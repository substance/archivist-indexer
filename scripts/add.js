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

var _ = require('underscore');
var getJSON = require('../src/get_json');
var Interview = require('archivist-core/interview');
var indexArticle = require('../src/index_interview.js');
var elasticsearch = require('elasticsearch');
var config = require('../config');

var interviewUrl = config.archive + '/api/documents/' + argv.i;

getJSON(interviewUrl, function(err, json){
  if (err) {
    return console.error(err);
  }
  console.log('Indexing interview %s...', interviewUrl);
  var interview = new Interview.fromJson(json);
  var client = new elasticsearch.Client(_.clone(config));
	indexArticle(client, interview, function(err) {
    if (err) {
      console.error("Failed.", err);
    } else {
      console.log("Done.");
    }
    client.close();
  });
});