var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var config = require('../config');

var client = new elasticsearch.Client(_.clone(config));

var query = {
  index: 'interviews',
  type: 'interview',
  search_type: 'count',
  body: {
    "query": {
       "match_all" : { }
    },
    "aggs": {
    "fragment": {
      "nested": {
        "path": "fragment"
      },
      "aggs": {
        "subjects": {
          "terms": {
            "field": "fragment.subjects"
          }
        }
      }
    }
  }
}
  

client.search(query).then(function (body) {
  client.close();
  console.log(JSON.stringify(body, null, 2))
}, function (error) {
  console.trace(error.message);
  client.close();
  console.log(error);
});