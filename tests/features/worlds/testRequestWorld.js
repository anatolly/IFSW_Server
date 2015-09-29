// Uses Request Lib https://github.com/request/request
// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api/blob/master/features/support/world.js

var request = require('request');
var fs = require('fs');


var auth_cookie = "";

var last_message = null;
var lastValetURL = null;

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

    //------------------------------------------------------------------
    this.getLastKnownVKUrl = function (){
      return lastValetURL["valetKeyURL"];
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


//-----------------------------------------------------------------------------------------------
    this.visitVKIssue = function(request_path,cb) {

      var uri = this.SERVER_URL + request_path;

      console.log("visitVKIssue","URI:",uri);

      request.get({url: uri, headers: {'User-Agent': 'request', 'cookie':auth_cookie }},
        function (error, response) {
          if (error) {
            console.log("visitVKIssue", "Error:", error);
            return cb.fail(new Error('Error on GET request to ' + request_path + ': ' + error.message));
          }
          self.lastResponse = response;
          if (response.headers['set-cookie']) {
            auth_cookie = response.headers['set-cookie'];
          }

          console.log("visitVKUssue", "BODY IS:", response.body);
          console.log("visitVKUssue", "STATUS:", response.statusCode);


          var str = response.body;
          var v_str = str.match(/\"valetKeyURL\"\: \"\[^\"]+\"/g);

          if (v_str) {
            lastValetURL =  JSON.parse('{'+ v_str + '}');
            console.log("visitVKIssue", "LAST UPLOADED ValetURL:", self.getLastKnownVKUrl() );
          }
          else{
            console.log("visitVKIssue","no match in str", "parse:", str);
            lastValetURL =  JSON.parse(str);
            console.log("visitVKIssue", "LAST UPLOADED ValetURL:", self.getLastKnownVKUrl() );
          }


          cb()
        });
    }

//-----------------------------------------------------------------------------------------------
    this.upload = function(request_path, filename, cb) {

      var formData = {
        new_content: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
      };

      var uri = this.SERVER_URL + request_path;

      request.post({url:uri, formData: formData, headers: {'User-Agent': 'request', 'cookie':auth_cookie } }, function(error, response, body) {
        if (error) {
          return cb.fail(new Error('Error on POST request to ' + uri +
          ': ' + error.message))
        }
        self.lastResponse = response;
        console.log("Upload", "BODY IS:", response.body);

        var str = response.body;
        var id_str = str.match(/\"id\"\: \d+/g);
        if (id_str) {
          lastMessage =  JSON.parse('{'+ id_str + '}');
          console.log("upload", "LAST UPLOADED ID:", self.getLastUploadedId() );
        }



        cb()
      })



    };
    //--------------------------------------------------------------------------------------------------------------------

     this.delete = function(request_path, envelopeid, cb) {

     var uri = this.SERVER_URL + request_path;

     console.log("URL USED:" + uri +'/'+ envelopeid);

     request.get({url:uri +'/'+ envelopeid, headers: {'User-Agent': 'request', 'cookie':auth_cookie }},  function (error, response)  {
     console.log("delete", "response code:",response.statusCode) // 200
     console.log("delete", "response headers:", response.headers)
     self.lastResponse = response;
     cb();
     });

     };


//-----------------------------------------------------------------------------------
    this.download = function(request_path, param_val, localfilename, cb) {

      var uri = this.SERVER_URL + request_path;

      console.log("download", "URL USED:", uri +'?id='+param_val);

      request.get({url:uri +'?id='+param_val, headers: {'User-Agent': 'request', 'cookie':auth_cookie }}).on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
        self.lastResponse = response;

      }).pipe(fs.createWriteStream(localfilename)).on('finish', function(response){cb();});

    };
//-----------------------------------------------------------------------------------
    this.downloadByFullURI = function(uri, localfilename, cb) {


      console.log("downloadBtFullURI", "URL USED:", uri );

      request.get({url:uri, headers: {'User-Agent': 'request', 'cookie':auth_cookie }}).on('response', function(response) {
        console.log(response.statusCode) // 200
        console.log(response.headers['content-type']) // 'image/png'
        self.lastResponse = response;

      }).pipe(fs.createWriteStream(localfilename)).on('finish', function(response){cb();});

    };



    cb();
  };

};

