// Dependencies for server
var express = require("express");
var exphbs = require('express-handlebars');
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
// Require request and cheerio for actual web scraping
var request = require("request");
var cheerio = require("cheerio");

var db = require("./models");

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news" || 'mongodb://heroku_dcsd78d6:o1bbdlcqecisc385g24ljadpc5@ds127139.mlab.com:27139/heroku_dcsd78d6';

// body parser
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// connect to database
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {});

// Listen on port 3000
app.listen(PORT, function () {
  console.log("App running on port" + PORT);
});

// This route will retrieve all of the data
app.get("/scrape", function (req, res) {

  request("https://www.nytimes.com/", function (error, response, html) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    request('https://www.nytimes.com', (err, response, html) => {
      var $ = cheerio.load(html);
      var results = [];
      $("div.collection").each(function (i, element) {
        var ob = {};
        ob.link = $(element).find("a").attr("href");
        ob.title = $(element).find("a").text();
        ob.summary = $(element).find("p.summary").text().trim();
        results.push(ob);
      });
    
      db.Article.create(results)
        .then(function (dbArticles) {
          res.json(dbArticles);
        }).catch(function (err) {
          return res.json(err);
        });
    });
    res.send("You scraped the data successfully.");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find()
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



