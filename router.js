var bodyParser = require('body-parser');

var express = require('express');
var app = express();

var sparkhandler = require('./sparkhandler.js');


//------------ SERVER SETUP -----------
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', function (req, res) {
  console.log("Non-webhook request");
  console.log(req);
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end('Hello, World!\n\n💚   🔒  .js');
});
app.post('/webhook', function (req, res) {
  if(req.body.resource && 'function' === typeof(sparkhandler[req.body.resource])) {
    sparkhandler[req.body.resource](req.body);
    res.status(201).send();
  } else {
    console.log("Unmatched webhook resouce: " + req.body.resource);
    res.status(400).send();
  }
});
app.use(function (req, res, next) {
  console.log("Request: " + req.method + ":" + req.url);
  next();
});

module.exports = app;
