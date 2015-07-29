
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var config = require("../config");
var client = new elasticsearch.Client(_.clone(config));
var queries = {};
var async = require('async');

var searchArticles = require("./search_interviews");
var searchArticlesSubject = require("./search_subjects_interviews");
var countSubjects = require("./counters");

queries.findDocumentsWithContentAdvanced = function(query, cb) {
  var searchQuery = JSON.parse(query.searchQuery);
  console.log('#####', searchQuery);

  searchArticles({
    searchString: searchQuery.searchStr,
    filters: searchQuery.filters
  }, function(err, result) {

    if (err) return cb(err);
    // assuming openFiles is an array of file names 
    async.each(result.hits.hits, function(doc, cb) {
      queries.getDocumentPreview({
        documentId: doc._id,
        searchString: searchQuery.searchStr
      }, function(err, docPreview) {
        if (err) return cb(err);
        doc.fragments = docPreview.fragments;
        cb(err);
      });
    }, function() {
      cb(null, result);
    });
  });
};


queries.findDocumentsWithContent = function(query, cb) {
  var searchQuery = JSON.parse(query.searchQuery);
  console.log('#####', searchQuery);

  searchArticles({
    searchString: searchQuery.searchStr,
    filters: searchQuery.filters
  }, cb);
};

queries.getDocumentMetaById = function(id) {
  return client.get({
    index: 'interviews',
    type: 'interview',
    id: id
  });
};

queries.getDocumentPreview = function(query, cb) {
  var documentId = query.documentId;
  var searchString = query.searchString;

  // Pagination
  var size = query.size || 2;
  var from = query.from || 0;
  var type = query.type || "boolean";

  // create a result that contains
  // - fragments
  // - TODO: all figures
  // - TODO: document meta data

  var _documentMeta;
  var _fragments;

  function createDocumentPreview() {
    var result = {};
    result.document = _documentMeta;
    result.fragments = _fragments || [];
    cb(null, result);
  }

  queries.getDocumentMetaById(documentId)
  .then(function(data) {
    _documentMeta = data._source;
    return queries.findDocumentFragmentsWithContent(documentId, searchString, from, size, type);
  })
  .then(function(data) {
    _fragments = [];
    var fragments = data.hits.hits;
    fragments.sort(function(a, b) {
      return a._source.position - b._source.position;
    });
    for (var i = 0; i < fragments.length; i++) {
      var fragmentData = fragments[i];
      var fragmentResult = fragments[i]._source;
      if (fragmentData.highlight) {
        for (var key in fragmentData.highlight) {
          var highlightedContent = fragmentData.highlight[key].join('');
          console.log("Replacing:\n\t%s\n  with:\n\t%s", fragmentResult[key], highlightedContent);
          fragmentResult[key] = highlightedContent;
        }
      }
      _fragments.push(fragmentResult);
    }
    createDocumentPreview();
  })
  .error(function(error) {
    console.error("Urg", error);
    cb(error);
  });
};

queries.findDocumentFragmentsWithContent = function(documentId, searchString, from, size, type) {
  console.log("Asking for fragment in %s containing %s", documentId, searchString);

  return client.search({
    index: 'interviews',
    type: 'fragment',
    body: {
      "size": size,
      "from": from,
      "query": {
        "bool": {
          "must": [
            { "term":  { "_parent": documentId } },
            { "match": { "content": { "query": searchString, "type": type, "minimum_should_match": "75%" } } }
          ]
        }
      },
      "highlight": {
        "pre_tags" : ['<span class="query-string">'], "post_tags" : ["</span>"],
        "fields": {
          // NOTE: "number_of_fragments" : 0 is necessary to suppress lucene's automatic truncation of fragments
          "content": { "number_of_fragments" : 0 }
        }
      }
    }
  });
};

queries.findDocumentsWithSubject = function(query, cb) {
  var searchQuery = JSON.parse(query.searchQuery);
  console.log('#####', searchQuery);

  searchArticlesSubject({
    searchString: searchQuery.searchStr,
  }, function(err, result) {

    if (err) return cb(err);
    // assuming openFiles is an array of file names 
    async.each(result.hits.hits, function(doc, cb) {
      queries.getDocumentSubjectsPreview({
        documentId: doc._id,
        searchString: searchQuery.searchStr
      }, function(err, docPreview) {
        if (err) return cb(err);
        doc.fragments = docPreview.fragments;
        cb(err);
      });
    }, function() {
      cb(null, result);
    });
  });
};

queries.getDocumentSubjectsPreview = function(query, cb) {
  var documentId = query.documentId;
  var searchString = query.searchString;

  // Pagination
  var size = query.size || 2;
  var from = query.from || 0;

  var _documentMeta;
  var _fragments;

  function createDocumentPreview() {
    var result = {};
    result.document = _documentMeta;
    result.fragments = _fragments || [];
    cb(null, result);
  }

  queries.getDocumentMetaById(documentId)
  .then(function(data) {
    _documentMeta = data._source;
    return queries.findDocumentSubjectFragmentsWithContent(documentId, searchString, from, size);
  })
  .then(function(data) {
    _fragments = [];
    var fragments = data.hits.hits;
    for (var i = 0; i < fragments.length; i++) {
      var fragmentData = fragments[i];
      var fragmentResult = fragments[i]._source;
      _fragments.push(fragmentResult);
    }
    createDocumentPreview();
  })
  .error(function(error) {
    console.error("Urg", error);
    cb(error);
  });
};

queries.findDocumentSubjectFragmentsWithContent = function(documentId, searchString, from, size) {
  console.log("Asking for subject fragment in %s containing %s", documentId, searchString);

  return client.search({
    index: 'interviews',
    type: 'subject_fragment',
    body: {
      "size": size,
      "from": from,
      "query": {
        "bool": {
          "must": [
            { "term": { "_parent": documentId } },
            { "term": { "target" : searchString } }
          ]
        }
      }
    }
  });
};

queries.countSubjects = function(cb) {
  countSubjects(function(err, result) {
    if (err) return cb(err);
    var subjects = {};
    _.each(result.facets.target.terms, function(subject) {
      subjects[subject.term] = subject.count;
    });
    cb(null, subjects);
  });
}

module.exports = queries;