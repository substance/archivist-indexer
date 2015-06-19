#!/usr/bin/env node

var seedIndex = require('../src/seed_index');

var MAX_COUNT = process.argv[2];

seedIndex( { MAX_COUNT: MAX_COUNT }, function(err) {
  if (err) {
    console.error(err);
    throw err;
  } else {
    console.log('Done.');
    return;
  }
});
