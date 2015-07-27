#!/usr/bin/env node

var Interview = require('archivist-core/interview');
var indexArticle = require('./index_interview.js');
var deleteArticle = require('./delete_interview.js');
var _ = require('underscore');
var request = require('superagent');
var elasticsearch = require('elasticsearch');
var config = require('../config');

var getJSON = function(url, cb) {
  request
    .get(url)
    .end(function(err, res){
      if(err) console.error(err);
      cb(err, res.body);
    });
}

var updateIndex = function(id, cb) {
  var interviewUrl = config.archive + '/api/documents/' + id;
  var client = new elasticsearch.Client(_.clone(config));

  deleteArticle.removeFragments(client, id).error(function() {
    console.error("Failed.", arguments);
  }).then(function() {
    client.close();
    client = new elasticsearch.Client(_.clone(config));
    console.log("All fragments for", id, "has been removed.");
    deleteArticle.removeInterview(client, id).error(function() {
      console.error("Failed.", arguments);
    }).then(function() {
      client.close();
      client = new elasticsearch.Client(_.clone(config));
      console.log("Interview", id, "has been removed.");
      getJSON(interviewUrl, function(err, json){
        if (err) return cb(err);
        console.log('Indexing interview %s...', interviewUrl);
        var interview = new Interview.fromJson(json);

        indexArticle(client, interview).then(function() {
          console.log("Done.");
          client.close();
          cb(null);
        }).error(function(error, resp) {
          console.error(error);
          client.close();
          cb(error);
        });
      });
    });
  });
}

module.exports = updateIndex;