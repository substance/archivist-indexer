var elasticsearch = require('elasticsearch');
var config = require('../config');
var _ = require('underscore');

// should be
var documentId = "55a43fb30bae2c0c00507579";

var client = new elasticsearch.Client(_.clone(config));
var query = {
  index: 'interviews',
  type: 'interview',
  body: {
    size: 10000,
    from: 0,
    query: {
     "match_all" : { }
    },
    aggs: {
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
      }
    }
  }
};
client.search(query).then(function (body) {
  client.close();
  console.log(JSON.stringify(body, null, 2));
}, function (error) {
  console.trace(error.message);
  client.close();
  console.error(error);
});

