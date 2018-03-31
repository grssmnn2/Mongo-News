// Dependencies for server
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio for actual web scraping
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Database configuration
// databaseurl needs to be the name of your database and also created on your computer
var databaseUrl = "news";
var collections = ["newsData"];

//if deployed, use deployed database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// connect to mongoDB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
  console.log("Database Error:", error);
});

// This route will retrieve all of the data
app.get("/", function (req, res) {

  // Making a request for onion's news board. The page's HTML is passed as the callback's third argument
request("https://www.nytimes.com/", function (error, response, html) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);

  // An empty array to save the data that we'll scrape
  var results = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("h2.story-heading").each(function (i, element) {

    // Save the text of the element in a "title" variable
    // this gives back whatever text is being held in the element
    console.log($(element).text());
    var title = $(element).text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    // use this if you want all elements inside of one div
    var link = $(element).children().attr("href");
    var summary = $(this).children('p.summary').text().trim() + "";

    // Save these results in an object that we'll push into the results array we defined earlier
    results.push({
      title: title,
      link: link,
      summary: summary
    });
  });


  // Log the results once you've looped through each of the elements found with cheerio
  db.scrapedData.insert(results);
  console.log(results);
  res.json(results);
});

});

// Listen on port 3000
app.listen(3000, function () {
  console.log("App running on port 3000!");
});
