var cheerio = require('cheerio');
var _ = require('underscore');
global.$ = cheerio.load('', {decodeEntities: false});

module.exports = function getIndexingCommands(interview) {

  var content = interview.get('content');
  var nodeIds = content.nodes;
  var interviewId = interview.id;

  var documentNode = interview.get('document');
  var htmlExporter = new interview.constructor.HtmlExporter({
    skipTypes: {
      'timecode': true
    },
    exportAnnotationFragments: true,
    containerId: 'content'
  });
  htmlExporter.initialize(interview);

  // record all entries and call ES later, so that we only index if everything goes well
  var indexEntries = [];

  var shortData = {
    "summary": documentNode.short_summary,
    "summary_en": documentNode.short_summary_en,
    "title": documentNode.title,
    "published_on": documentNode.published_on
  };

  var shortEntry = { "index" : {
    _index: 'iinterviews',
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
    var nodeHtml = htmlExporter.convertNode(node).html();

    var facets = [];
    var path = [node.id, 'content'];
    var annotations = interview.getIndex('annotations').get(path);
    _.each(annotations, function(anno) {
      if (anno.type === "entity_reference") {
        facets.push(anno.target);
      }
    });
    var annotationFragments = interview.containerAnnotationIndex.getFragments(path, 'content');
    _.each(annotationFragments, function(annoFragment) {
      var anno = annoFragment.anno;
      if (anno.type === "subject_reference") {
        facets = facets.concat(anno.target);
      }
    });

    var entryId = nodeId;
    var nodeEntry = { "index" : {
      _index: 'iinterviews',
      _type: 'fragment',
      _parent: interviewId,
      _id: entryId,
    }};
    indexEntries.push(nodeEntry);
    indexEntries.push({
        id: nodeId,
        type: type,
        content: nodeHtml,
        position: pos,
        target: facets
      });
  });

  return indexEntries;
};
