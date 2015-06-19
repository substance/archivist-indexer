"use strict";

var _ = require('underscore');
var express = require('express');
var app = express();
var queries = require('./src/queries');

app.set('port', (process.env.PORT || 4002))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Full search (including fragments)

app.get('/search', function (req, res) {
  // Test: if query object is empty, then we trying to fetch results for "Moscow"
  if(_.isEmpty(req.query)) {
    req.query = {
      searchQuery: JSON.stringify({
        searchStr: 'Москва'
      })
    }
  }
  queries.findDocumentsWithContentAdvanced(req.query, function(error, result) {
    if (error) {
      res.send('500', error.message);
    } else {
      res.send(result);
    }
  });
});

app.get('/search/document/', function (req, res) {
  // Test: if query object is empty, then we trying to fetch results for "Moscow" and "554e7662f10c3c030049f7ee" document
  if(_.isEmpty(req.query)) {
    req.query = {
      searchString: 'Москва',
      documentId: '554e7662f10c3c030049f7ee'
    }
  }
  queries.getDocumentPreview({
    documentId: req.query.documentId,
    searchString: req.query.searchString,
    from: req.query.from,
    size: req.query.size
  }, function(error, result) {
    if (error) {
      res.send('500', error.message);
    } else {
      res.send(result);
    }
  });
});


app.use(express.static(__dirname));

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
