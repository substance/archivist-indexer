#!/usr/bin/env node

var ArchivistInterview = require('../interview');
var indexArticle = require('./index_interview.js');
var deleteArticle = require('./delete_interview.js');
var _ = require('underscore');
var request = require('superagent');
var elasticsearch = require('elasticsearch');
var config = require('../config');
var client = new elasticsearch.Client(_.clone(config));

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

  deleteArticle.removeFragments(client, id).error(function() {
    console.error("Failed.", arguments);
  }).done(function() {
    console.log("All fragments for", id, "has been removed.");
    deleteArticle.removeInterview(client, id).error(function() {
      console.error("Failed.", arguments);
    }).done(function() {
      console.log("Interview", id, "has been removed.");
      getJSON(interviewUrl, function(err, json){
        if (err) return cb(err);
        console.log('Indexing interview %s...', interviewUrl);
        var interview = new ArchivistInterview(json);

        indexArticle(client, interview)
          .error(function() {
            console.error("Failed.", arguments);
          })
          .done(function() {
            console.log("Done.");
            client.close();
            cb(null);
          });
      });
    });
  });
}

module.exports = updateIndex;