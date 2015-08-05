var request = require('superagent');

var url = "http://localhost:4002/search";

request
  .get(url)
  .query({
  	searchQuery: JSON.stringify({
    	searchStr: 'Дмитраш'
   	})
  })
  .end(function(err, res){
    if(err) console.error(err);
    console.log(JSON.stringify(res.body, null, 2))
  });