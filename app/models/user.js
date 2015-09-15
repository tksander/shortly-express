var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  // set tableName
  // set defaults - username, password
  // 
});

module.exports = User;