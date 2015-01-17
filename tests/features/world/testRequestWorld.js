// Uses Request Lib https://github.com/request/request
// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api/blob/master/features/support/world.js

var request = require('request');

var World = function World(cb) {

  //place for some additional fields and functions

  var self = this;

  this.lastResponse = null;



    this.visittest = function(base_url, param_val, cb) {

      var uri = base_url + param_val;

      request.get({url: uri, headers: {'User-Agent': 'request'}},
        function (error, response) {
          if (error) {
            return callback.fail(new Error('Error on GET request to ' + uri +
            ': ' + error.message))
          }
          self.lastResponse = response;
          cb()
        })

    };

  cb();
};


exports.World = World;
