#!/usr/bin/env node

var elasticsearch = require('elasticsearch');
var config = require('../config');

var request = require('superagent');
var _ = require('underscore');

//var util = require('substance-util');
var ArchivistInterview = require('../interview');
var indexInterview = require('./index_interview');

var idx = 0;
var count = 0;
var MAX_COUNT = -1;
var documentUrs = [];

function step(cb) {
  if (idx >= documentUrs.length || (MAX_COUNT > 0 && count >= MAX_COUNT)) {
    cb(null);
    return;
  }
  var url = documentUrs[idx++];

  getJSON(url, function(err, json){
    if (err) return cb(err);
    console.log('Indexing interview %s...', url);
    var interview = new ArchivistInterview(json);
    var client = new elasticsearch.Client(_.clone(config));
    indexInterview(client, interview).then(function() {
      client.close();
      count++;
      step(cb);
    }).error(function(error, resp) {
      console.error(error);
      client.close();
      cb(error);
    });
  });
}

var seedIndex = function(options, cb) {
  MAX_COUNT = options.MAX_COUNT || -1;
  count = 0;

  getJSON(config.archive + '/api/documents', function(err, json){
    if (err) return cb(err);
    var docs = json[1];
    _.each(docs, function(doc){
      url = config.archive + '/api/documents/' + doc._id;
      documentUrs.push(url);
    });

    step(function(err) {
      if(err) {
        console.error(err);
        cb(err);
      } else {
        cb(null);
      }
    });
  });
};

var getJSON = function(url, cb) {
  request
    .get(url)
    .end(function(err, res){
      if(err) console.error(err);
      cb(err, res.body);
    });
}

module.exports = seedIndex;
