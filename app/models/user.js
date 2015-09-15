var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  // set tableName
  tableName: 'users',
  // set defaults - username, password 

  initialize: function() {
    // on 'creatHash'
    this.on('createHash', function(user, password) {
      bcrypt.genSalt(10, function(err, salt) {
        console.log("Salted...", salt);
        console.log(typeof password);
        bcrypt.hash(password, salt, function(){},function(err, hash) {
          console.log("the hash is ", hash);
          console.log(typeof hash);
          user.set('salt', salt);
          user.set('hash', hash);
        });
      });
    });
  }
});

module.exports = User;