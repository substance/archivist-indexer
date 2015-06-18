
var _ = require('underscore');

function indexInterview(client, interview) {


  var content = interview.get('content');
  var nodeIds = content.nodes;
  var interviewId = interview.data.seed.id

  var documentNode = interview.get('document');

  // record all entries and call ES later, so that we only index if everything goes well
  var indexEntries = [];

  var shortData = {
    "abstract": documentNode.abstract,
    "interviewee_bio": documentNode.interviewee_bio,
    "title": documentNode.title,
    "published_on": documentNode.published_on,
    "interview_date": documentNode.interview_date,
    "interview_location": documentNode.interview_location
  };

  var shortEntry = {
    index: 'interviews',
    type: 'interview',
    id: interviewId,
    body: shortData
  };
  indexEntries.push(shortEntry);
  console.log("#################");
  console.log("Short Entry:");
  console.log(shortEntry);
  console.log("#################");
  nodeIds.forEach(function(nodeId, pos) {
    var node = interview.get(nodeId);
    if (!node) {
      throw new Error("Corrupted interview json. Node does not exist " + nodeId);
    }

    var type = node.type;
    var nodeContent = node.content;
    if (!nodeContent) {
      return;
    }

    var entryId = interviewId + "/" + nodeId;
    var nodeEntry = {
      index: 'interviews',
      type: 'fragment',
      parent: interviewId,
      id: entryId,
      body: {
        id: nodeId,
        type: type,
        content: nodeContent,
        position: pos
      }
    };
    indexEntries.push(nodeEntry);
  });

  var promise = null;
  indexEntries.forEach(function(entry) {
    if (!promise) {
      promise = client.index(entry);
    } else {
      promise.then(function() { return client.index(entry); });
    }
  });

  return promise;
}

module.exports = indexInterview;