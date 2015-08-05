var searchInterviews = require('../src/search_interviews');

// from interview: 559d291dc87aeac22d1f46b5
// some text: спросила, сейчас, потом, бывают
// entities: 554a837026ee98fc0560759a (Белино), 554a837026ee98fc0560759a (Грац)
// subjects:
//  554a82e73a7f86f805fbed5e (Сельская местность, LEAF),
//  554a82e73a7f86f805fbed88 (Тыловая повседневность)
//  * 554a82e73a7f86f805fbed89 (Изменения в быту с началом войны)
//  * 554a82e73a7f86f805fbed96 (Мобилизация в Красную армию)


var query = {
  searchString: "спросила",
  filters: {
    subjects: ["554a82e73a7f86f805fbed89"],
    entities: ["554a837026ee98fc0560759a"]
  }
};

searchInterviews(query, function(err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
});
