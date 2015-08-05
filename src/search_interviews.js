var elasticsearch = require('elasticsearch');
var config = require('../config');
var _ = require('underscore');

var searchArticles = function(options, cb) {
  var client = new elasticsearch.Client(_.clone(config));

  function _mustMatch(filters) {
    var matchTerms = [];
    _.each(filters, function(filterValues, facet) {
      _.each(filterValues, function(value) {
        var matchTerm = { "term": { } };
        matchTerm.term[facet] = value;
        matchTerms.push(matchTerm);
      });
    });
    if (matchTerms.length > 0) {
      return {
        "bool": {
          "must": [
            matchTerms
          ]
        }
      };
    } else {
      return null;
    }
  }

  function _fragmentMatch(searchString, filters) {
    var should = [];
    var query = {
      "bool": {
        "should": should
      }
    };
    if (searchString) {
      should.push({ "match": { "content": { "query": searchString, "minimum_should_match": "75%" } } });
    }
    _.each(filters, function(filterValues, facet) {
      _.each(filterValues, function(value) {
        var matchTerm = { "term": { } };
        matchTerm.term[facet] = value;
        should.push(matchTerm);
      });
    });
    return query;
  }

  function _query(searchString, filters) {
    // either
    if (!searchString && filters.length === 0) {
      return {
        "match_all" : {}
      }
    } else {
      return {
        "bool": {
          "should": [
            {
              "has_child": {
                "type": "fragment",
                "score_mode" : "sum",
                "query": _fragmentMatch(searchString, filters)
              }
            },
            {
              "match": {
                "title": { "query": searchString, "minimum_should_match": "75%", "boost": 3.0 }
              }
            },
            {
              "match": {
                "short_summary": { "query": searchString, "minimum_should_match": "25%", "boost": 3.0 }
              }
            },
            {
              "match": {
                "short_summary_en": { "query": searchString, "minimum_should_match": "25%", "boost": 3.0 }
              }
            }
          ]
        }
      };
    }
  }

  var query = {
    index: 'interviews',
    type: 'interview',
    // only for debugging
    // explain: true,
    body: {
      "size": 30,
      "sort": [
        { "_score": { "order": "desc" } }
      ],
      "query": {
        "filtered": {
          "query": _query(options.searchString, options.filters),
          "filter": _mustMatch(options.filters),
        }
      },
      "highlight": {
        "pre_tags" : ['<span class="query-string">'], "post_tags" : ["</span>"],
        "fields": {
          // NOTE: "number_of_fragments" : 0 is necessary to suppress lucene's automatic truncation of fragments
          "title": { "number_of_fragments" : 0 },
          "short_summary": { "number_of_fragments" : 0 },
          "short_summary_en": { "number_of_fragments" : 0 }
        }
      },
      "aggs": {
        subjects: {
          "nested" : {
            "path" : "subjects"
          },
          aggs: {
            "occurrences" : {
              terms : {
                "field": "subjects.id",
                "size": 5000
              },
              aggs: {
                total_count: {
                  "sum" : { "field" : "subjects.count" }
                }
              }
            }
          }
        },
        entities: {
          "nested" : {
            "path" : "entities"
          },
          aggs: {
            "occurrences" : {
              terms : {
                "field": "entities.id",
                "size": 5000
              },
              aggs: {
                total_count: {
                  "sum" : { "field" : "entities.count" }
                }
              }
            }
          }
        }
      }
    }
  };


  if (!options.searchString) {
    query.body.sort = [{ "published_on": { "order": "desc" } }];
  }

  console.log("################################");
  console.log(JSON.stringify(query, null, 2));
  console.log("################################");

  client.search(query).then(function (body) {
    client.close();
    cb(null, body);
  }, function (error) {
    console.trace(error.message);
    client.close();
    cb(error);
  });
};

module.exports = searchArticles;
