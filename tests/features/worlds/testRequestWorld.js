// Uses Request Lib https://github.com/request/request
// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api/blob/master/features/support/world.js

var request = require('request');
var fs = require('fs');


module.exports = function () {

  this.World = function (cb) {

    //place for some additional fields and functions

    var self = this;

    this.lastResponse = null;


//    this.SERVER_URL = "http://localhost:1337/";
    this.SERVER_URL = "http://localhost:8080/cloudStorage-1";


    this.visittest = function(request_path, param_val, cb) {

      var uri = this.SERVER_URL + request_path + param_val;

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


    this.upload = function(request_path, filename, cb) {

      var formData = {
        dicom_file: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
      };

      var uri = this.SERVER_URL + request_path;

      request.post({url:uri, formData: formData, headers: {'User-Agent': 'request'} }, function(error, response, body) {
        if (error) {
          return cb.fail(new Error('Error on POST request to ' + uri +
          ': ' + error.message))
        }
        self.lastResponse = response;
        console.log("BODY IS:"+ response.body);
        cb()
      })



    };


    this.download = function(request_path, param_val, localfilename, cb) {

      var uri = this.SERVER_URL + request_path;

      console.log("URL USED:" + uri +'?id='+param_val);
      request.get(uri +'?id='+param_val).on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
        self.lastResponse = response;
        cb();
      }).pipe(fs.createWriteStream(localfilename));

    };




    cb();
  };

};

