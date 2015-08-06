"use strict";

var _ = require('underscore');
var express = require('express');
var app = express();
var queries = require('./src/queries');
var index = require('./src/interview_op');

app.set('port', (process.env.PORT || 4002));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allo w-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Full search (including fragments)

app.get('/search', function (req, res) {
  var query = {
    searchString: "",
    filters: {}
  };

  console.log('############ QUERY', req.query);
  if(req.query.searchQuery) {
    query = JSON.parse(req.query.searchQuery);
    if (query.searchStr) {
      query.searchString = query.searchStr;
    }
  }
  queries.findDocumentsWithContent(query, function(error, result) {
    if (error) {
      res.send('500', error.message);
    } else {
      res.send(result);
    }
  });
});

app.get('/search/document/', function (req, res) {
  var query = {
    documentId: req.query.documentId,
    searchString: "",
    filters: {}
  };
  if(req.query) {
    query = JSON.parse(req.query);
    if (query.searchStr) {
      query.searchString = query.searchStr;
    }
  }
  queries.getDocumentPreview(query, function(error, result) {
    if (error) {
      res.send('500', error.message);
    } else {
      res.send(result);
    }
  });
});

// Update index for document

app.get('/update/document/:id', function (req, res) {
  var id = req.params.id;
  index.update(id, function(err){
    if (err) {
      res.send('500', err.message);
    } else {
      res.status(200).send('done');
    }
  });
});

// Remove index for document

app.get('/remove/document/:id', function (req, res) {
  var id = req.params.id;
  index.remove(id, function(err){
    if (err) {
      res.send('500', err.message);
    } else {
      res.status(200).send('done');
    }
  });
});

// Count subject frequency

app.get('/subjects', function(req, res) {
  queries.countSubjects(function(err, result) {
    if (err) {
      res.send('500', err.message);
    } else {
      res.status(200).json(result);
    }
  });
});


app.use(express.static(__dirname));

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
