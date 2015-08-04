
module.exports = function getIndexingCommands(interview) {

  var content = interview.get('content');
  var nodeIds = content.nodes;
  var interviewId = interview.id;

  var documentNode = interview.get('document');
  var htmlExporter = new interview.constructor.HtmlExporter();

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
      });
  });

  return indexEntries;
};