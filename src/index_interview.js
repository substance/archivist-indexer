var getIndexingCommands = require('./get_indexing_commands');

function indexInterview(client, interview) {
  var indexEntries = getIndexingCommands(interview);
  return client.bulk({
    body: indexEntries
  });
}

module.exports = indexInterview;
