#!/usr/bin/env node

var configureIndex = require('../src/configure_index');

configureIndex(function(err) {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.log('Done.');
    return;
  }
});
