var getIndexingCommands = require('./get_indexing_commands');

function indexInterview(client, interview, cb) {
  getIndexingCommands(interview, function(err, commands) {
    if (err) return console.error(err);
    client.bulk({
      body: commands
    }, cb);
  });
}

module.exports = indexInterview;
