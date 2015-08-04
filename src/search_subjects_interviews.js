var elasticsearch = require('elasticsearch');
var config = require('../config');
var _ = require('underscore');

var searchArticlesWithSubject = function(options, cb) {
  var client = new elasticsearch.Client(_.clone(config));

  function _query(searchString) {
    // either
    if (!searchString) {
      return {
        "match_all" : {}
      };
    } else {
      return {
        "size": 100,
        "from":0,
        "query" : {
          "has_child": {
            "type": "subject_fragment",
            "query" : {
              "filtered": {
                "query": { "match_all": {}},
                "filter" : {
                  "term" : { 
                    "target" : searchString
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  var query = {
    index: 'iinterviews',
    type: 'interview',
    // only for debugging
    // explain: true,
    body: _query(options.searchString),
  };


  if (!options.searchString) {
    query.body.sort = [{ "published_on": { "order": "desc" } }]
  }

  console.log("################################");
  console.log(JSON.stringify(query, null, 2));
  console.log("################################");

  client.search(query).then(function (body) {
    client.close();
    cb(null, body)
  }, function (error) {
    console.trace(error.message);
    client.close();
    cb(error);
  });
};

module.exports = searchArticlesWithSubject;