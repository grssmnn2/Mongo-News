// Dependencies for server
var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
// Require request and cheerio for actual web scraping
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();
var db = require("./models");
var PORT = 3000;
// Database configuration

app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news";

// Hook mongojs configuration to the db variable
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// This route will retrieve all of the data
app.get("/scrape", function (req, res) {

  request("https://www.nytimes.com/", function (error, response, html) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(html);

    // With cheerio, find each p-tag with the "title" class
    // (i: iterator. element: the current element)
    $("div.collection").each(function (i, element) {


      // An empty array to save the data that we'll scrape
      var results = {};

      // Save the text of the element in a "title" variable
      // this gives back whatever text is being held in the element
      results.link = $(element).find("a").attr("href");
      results.title = $(element).find("a").text().trim();
      results.summary = $(element).find("p.summary").text().trim();

      // Log the results once you've looped through each of the elements found with cheerio
      // if (title && link && summary){
      db.Article.create(results)
        .then(function (dbArticle) {
          console.log(dbArticle);
        }).catch(function (err) {
          return res.json(err);
        });
      // }
    });

  });
});


// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for DELETING an Article's associated Note
app.delete("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.remove(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Note.findOneAndRemove({ _id: req.params.id }, { note: dbNote._id });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Listen on port 3000
app.listen(3000, function () {
  console.log("App running on port 3000!");
});
