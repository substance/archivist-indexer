var elasticsearch = require('elasticsearch');
var config = require('../config');
var _ = require('underscore');
var getExtendedSubjects = require('./get_extended_subjects');

function buildQuery(options) {
  function _facetFilter(facet, values) {
    return {
      "nested": {
        "path": facet,
        "filter": {
          "bool": {
            "must": [
              _.map(values, function(value) {
                var matchTerm = { "term": { } };
                matchTerm.term[facet+".id"] = value;
                return matchTerm;
              })
            ]
          }
        }
      }
    };
  }

  function _mustMatch(filters) {
    var facetFilters = [];
    _.each(filters, function(values, facet) {
      if (values.length > 0) {
        facetFilters.push(_facetFilter(facet, values));
      }
    });
    if (facetFilters.length > 0) {
      return {
        'and': {
          'filters': facetFilters
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
    // _.each(filters, function(filterValues, facet) {
    //   _.each(filterValues, function(value) {
    //     var matchTerm = { "term": { } };
    //     matchTerm.term[facet] = value;
    //     should.push(matchTerm);
    //   });
    // });
    return query;
  }

  function _query(searchString, options) {
    // either
    var hasFilters = false;
    _.each(options.filters, function(values) {
      if (values.length > 0) {
        hasFilters = true;
      }
    });
    if (!searchString && !hasFilters) {
      return {
        "match_all" : {}
      };
    } else {
      return {
        "bool": {
          "should": [
            {
              "has_child": {
                "type": "fragment",
                "score_mode" : "sum",
                "query": _fragmentMatch(searchString, options.extendedFilters)
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
      "size": 100,
      // _source: false,
      "sort": [
        { "_score": { "order": "desc" } }
      ],
      "query": {
        "filtered": {
          "query": _query(options.searchString, options),
          "filter": _mustMatch(options.filters),
          // "filter": null
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
  return query;
}

function getResult(res, options) {
  var result = {
  };
  var hits = res.hits;
  result.interviews = _.map(hits.hits, function(record) {
    var interview = _.omit(record._source, ["subjects", "entities"]);
    interview.id = record._id;
    _.each(record.highlight, function(snippets, property) {
      interview[property] = snippets.join('<br>');
    });
    interview.subjects = {};
    interview.entities = {};
    if (options.filters) {
      if (options.filters.subjects) {
        var subjectStats = {};
        _.each(record._source.subjects, function(record) {
          subjectStats[record.id] = record.count;
        });
        _.each(options.filters.subjects, function(id) {
          interview.subjects[id] = subjectStats[id];
        });
      }
      if (options.filters.entities) {
        var entityStats = {};
        _.each(record._source.entities, function(record) {
          entityStats[record.id] = record.count;
        });
        _.each(options.filters.entities, function(id) {
          interview.entities[id] = entityStats[id];
        });
      }
    }
    return interview;
  });
  var facets = {};
  _.each(res.aggregations, function(agg, facet) {
    var stats = {};
    _.each(agg.occurrences.buckets, function(bucket) {
      stats[bucket.key] = bucket.total_count.value;
    });
    facets[facet] = stats;
  });
  result.facets = facets;
  result.count = hits.hits.length;
  return result;
}

var searchArticles = function(options, cb) {
  console.log('### QUERY OPTIONS:', JSON.stringify(options, null, 2));
  options.filters = options.filters || {};
  getExtendedSubjects("children", options.filters.subjects, function(err, extendedSubjects) {
    if (err) return cb(err);
    options.extendedFilters = _.clone(options.filters);
    options.extendedFilters.subjects = extendedSubjects;

    var client = new elasticsearch.Client(_.clone(config));
    var query = buildQuery(options);

    // console.log("################################");
    // console.log(JSON.stringify(query, null, 2));
    // console.log("################################");

    client.search(query, function(err, res) {
      client.close();
      if (err) {
        cb(err);
      } else {
        // console.log(JSON.stringify(res, null, 2));
        var result = getResult(res, options);
        cb(null, result);
      }
    });
  });
};

module.exports = searchArticles;
