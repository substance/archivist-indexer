var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var config = require('../config');
var searchEntities = require('../src/search_entities');

var query = {
	searchString: "Линц",
	threshold: 2.0
};

searchEntities(query, function(err, data){
	console.log(JSON.stringify(data, null, 2));
})