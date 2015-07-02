#!/usr/bin/env node
"use strict";

var argv = require("yargs")
  .strict()
  .usage("Usage: add -i some_id", {
    i: {
        describe: 'specify id of interview',
        alias: ('i','input')
    },
  })
  .help('help')
  .demand(['i'])
  .argv;

var ArchivistInterview = require('../interview');
var indexArticle = require('../src/index_interview.js');
var _ = require('underscore');
var request = require('superagent');
var elasticsearch = require('elasticsearch');
var config = require('../config');
var client = new elasticsearch.Client(_.clone(config));

var interviewUrl = config.archive + '/api/documents/' + argv.i;

var getJSON = function(url, cb) {
  request
    .get(url)
    .end(function(err, res){
      if(err) console.error(err);
      cb(err, res.body);
    });
}

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
		});
});