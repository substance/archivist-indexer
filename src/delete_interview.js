exports.removeFragments = function(client, interviewId) {
  var promise = null;

  promise = client.deleteByQuery({
    index: 'iinterviews',
    type: 'fragment',
    body: {
      query: {
        term: { _parent: interviewId }
      }
    }
  });
  
  return promise;
}

exports.removeInterview = function(client, interviewId) {
  var promise = null;

  promise = client.delete({
    index: 'iinterviews',
    type: 'interview',
    id: interviewId,
  });
  
  return promise;
}