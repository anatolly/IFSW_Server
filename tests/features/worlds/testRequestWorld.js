// Uses Request Lib https://github.com/request/request
// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api/blob/master/features/support/world.js

var request = require('request');
var fs = require('fs');


var auth_cookie = "";

var last_message = null;

module.exports = function () {

  this.World = function (cb) {

    //place for some additional fields and functions

    var self = this;

    this.lastResponse = null;
   // this.lastMessage = null;


// CHANGE SERVER_URL regarding the location of tested server
// LOCAL
      this.SERVER_URL = "http://localhost:1337";

// SINGAPORE
//    this.SERVER_URL = "http://localhost:8080/cloudStorage";




//------------------------------- INTERNAL STATE VALUES ------------- begin

    this.getLastUploadedId = function () {
      var id = lastMessage["id"];

      return id;
    }


//------------------------------- INTERNAL STATE VALUES ------------- end

    this.visittest = function(request_path, param_val, cb) {

      var uri = this.SERVER_URL + request_path + param_val;

      request.get({url: uri, headers: {'User-Agent': 'request', 'cookie':auth_cookie }},
        function (error, response) {
          if (error) {
            return cb.fail(new Error('Error on GET request to ' + uri +
            ': ' + error.message))
          }
          self.lastResponse = response;
          if (response.headers['set-cookie']) {
            auth_cookie = response.headers['set-cookie'];
          }

          cb()
        })

    };


    this.upload = function(request_path, filename, cb) {

      var formData = {
        dicom_file: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
      };

      var uri = this.SERVER_URL + request_path;

      request.post({url:uri, formData: formData, headers: {'User-Agent': 'request', 'cookie':auth_cookie } }, function(error, response, body) {
        if (error) {
          return cb.fail(new Error('Error on POST request to ' + uri +
          ': ' + error.message))
        }
        self.lastResponse = response;
        console.log("BODY IS:"+ response.body);

        var str = response.body;
        var id_str = str.match(/\"id\"\: \d+/g);
        if (id_str) {
          lastMessage =  JSON.parse('{'+ id_str + '}');
          console.log("LAST UPLOADED ID:" + self.getLastUploadedId() );
        }



        cb()
      })



    };


    this.download = function(request_path, param_val, localfilename, cb) {

      var uri = this.SERVER_URL + request_path;

      console.log("URL USED:" + uri +'?id='+param_val);

      request.get({url:uri +'?id='+param_val, headers: {'User-Agent': 'request', 'cookie':auth_cookie }}).on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
        self.lastResponse = response;
        cb();
      }).pipe(fs.createWriteStream(localfilename));

    };




    cb();
  };

};

