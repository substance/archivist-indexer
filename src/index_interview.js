
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

  var shortEntry = { "index" : {
    _index: 'interviews',
    _type: 'interview',
    _id: interviewId,
  }};
  indexEntries.push(shortEntry);
  indexEntries.push(shortData);
  // console.log("#################");
  // console.log("Short Entry:");
  // console.log(shortEntry);
  // console.log("#################");
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
    var nodeEntry = { "index" : {
      _index: 'interviews',
      _type: 'fragment',
      _parent: interviewId,
      _id: entryId,
    }};
    indexEntries.push(nodeEntry);
    indexEntries.push({
        id: nodeId,
        type: type,
        content: nodeContent,
        position: pos
      })
  });

  // var promise = null;
  // indexEntries.forEach(function(entry) {
  //   console.log('Indexing entry %s...', entry.id);
  //   if (!promise) {
  //     promise = client.index(entry);
  //   } else {
  //     promise.then(function() { return client.index(entry); }).error(function(error, resp) {console.error(error);});
  //   }
  // });

  var promise = client.bulk({
    body: indexEntries
  });

  return promise;
}

module.exports = indexInterview;