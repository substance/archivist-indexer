exports.removeFragments = function(client, interviewId) {
  var promise = null;

  promise = client.delete({
    index: 'interviews',
    type: 'fragment',
    parent: interviewId,
  });
  
  return promise;
}

exports.removeInterview = function(client, interviewId) {
  var promise = null;

  promise = client.delete({
    index: 'interviews',
    type: 'interview',
    id: interviewId,
  });
  
  return promise;
}