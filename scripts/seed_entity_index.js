#!/usr/bin/env node

var configureIndex = require('../src/entities/configure_index');
var seedIndex = require('../src/entities/seed_index');

configureIndex(function(err) {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.log('Entity index has been configured.');
    seedIndex(function(err) {
		  if (err) {
		    console.error(err);
		    throw err;
		  } else {
		    console.log('Done with entity indexing.');
		    return;
		  }
		});
    return;
  }
});