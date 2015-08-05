var elasticsearch = require('elasticsearch');
var config = require('../config');
var _ = require('underscore');

var countSubjects = function(cb) {
  var client = new elasticsearch.Client(_.clone(config));

  var query = {
    index: 'interviews',
    type: 'fragment',
    search_type: 'count',
    body: {
      "facets": {
      	"subjects" : { 
      		"terms" : {
      			"field" : "subjects",
      			"size": 5000
      		} 
      	}
    	}
    }
  };
	client.search(query).then(function (body) {
    client.close();
    cb(null, body)
  }, function (error) {
    console.trace(error.message);
    client.close();
    cb(error);
  });
}

module.exports = countSubjects;