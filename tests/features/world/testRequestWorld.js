// Uses Request Lib https://github.com/request/request
// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api/blob/master/features/support/world.js

var request = require('request');
var fs = require('fs');


var World = function World(cb) {

  //place for some additional fields and functions

  var self = this;

  this.lastResponse = null;


    this.visittest = function(base_url, param_val, cb) {

      var uri = base_url + param_val;

      request.get({url: uri, headers: {'User-Agent': 'request'}},
        function (error, response) {
          if (error) {
            return cb.fail(new Error('Error on GET request to ' + uri +
            ': ' + error.message))
          }
          self.lastResponse = response;
          cb()
        })

    };


  this.upload = function(base_url, filename, cb) {

    var formData = {
      dicom_file: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
    };


  request.post({url:base_url, formData: formData, headers: {'User-Agent': 'request'} }, function(error, response, body) {
    if (error) {
      return cb.fail(new Error('Error on POST request to ' + base_url +
      ': ' + error.message))
    }
    self.lastResponse = response;
     console.log("BODY IS:"+ response.body);
    cb()
  })



  };




    cb();
};


exports.World = World;
