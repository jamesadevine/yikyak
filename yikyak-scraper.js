
/* 
-----------GENERAL IMPORTS-----------
*/
var express = require('express'); //express framework!
var logger = require('morgan');
var app = express();  //create the app object
app.use(logger('dev'));
var cookieParser = require('cookie-parser');  //used to 
var session = require('express-session'); //used for managing sessions
var uuid = require('node-uuid');  //used to generate UUIDs
var moment = require('moment'); //clever date library
var fs = require('fs'); //used to interact with the file system



var mongoose = require('mongoose'); //allows interation with MongoDB



//connect to MongoDB!
mongoose.connect('mongodb://localhost/yikyak');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

//create the project name 
var projectName = "Smart Fuse -";

//set up the app!
app.set('view engine', 'jade');

app.use(cookieParser());

//create the session generator
app.use(session({secret: 'J@m3sD3V1n3',
                 saveUninitialized: true,
                 resave: true}));

//create the body parser to automatically pass request parameters
var bodyParser = require('body-parser');
//set the limit to 50mb for image upload
app.use( bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

//set CORS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(allowCrossDomain);

//set the public DIR
app.use(express.static(__dirname + '/public'));


var api = require('./api/yak-api.js');

api.init(uuid,mongoose);
api.begin();


app.get('/', function (req, res) {
    console.log("index session ",req.session.userID);
    var callback = function(results){
      console.log(results[0]);
      res.render('index',{
        yaks:results
      });
    };
    api.get_stored_yaks(callback);
});

app.get('/mostrecent', function (req, res) {
    console.log("index session ",req.session.userID);
    var callback = function(results){
      res.status(200).json({yak:results[1]});
    };
    api.get_stored_yaks(callback);
});

/*
  --------------------SERVER OBJECT----------------------
*/

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Server listening at http://%s:%s', host, port);
});






