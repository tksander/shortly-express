var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// NOTE: CHANGE SECRET!
app.use(session({secret: "HR32"}));
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


function restrict(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied.';
    res.redirect('/login');
  }
};


///GET handling////
 
app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/', 
function(req, res) {
  restrict(req, res, function(){
    res.render('index');
  });
});

app.get('/create', 
function(req, res) {
  restrict(req, res, function() {
    res.render('index');
  });
});

app.get('/links', 
function(req, res) {
  restrict(req, res, function() {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });
});




////POST handling////

app.post('/signup', 
  function(req, res) {
  console.log("the req body is  ", req.body);
  // new User({
  //   'username': req.body.username,
  //   'password': req.body.password
  // }).save().then(function(){
  //   res.send(200);
  // });

  Users.create({
    username: req.body.username,
    password: req.body.password
  })
  .then(function(user) {
    console.log("The new user object is    ", user);
    //Redirects to home page. Should modify to only redirect
    //When signup is actually successful.
    res.redirect('/');
    // res.send(200, user);
  })

});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/login', function(req, res) {

  // Check for the username and password attributes in database
  new User({
    username: req.body.username,
    password: req.body.password
  })
  .fetch()
  .then(function(found) {
    if (found) {
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  })

});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
