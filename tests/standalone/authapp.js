// Node Application for Testing Project server
// For running please use command-line argument <number of requests>
/*
*    StandAlone node js test for the case of access to authorized Envelope services
*
*    25/05/2015
*
*
*
 */



var request = require('request');
var fs = require('fs');

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually run from.
// !!! __dirname is uequal to complete path to standalone

process.chdir(__dirname);


(function() {


// CHANGE URL if the address of the solution is different

// SINGAPORE
//  var url = "http://localhost:8080/cloudStorage/v1.0/DICOMEnvelope";

//  LOCAL
  var url = "http://localhost:1337/v1.0/Envelope";
  var session_url = "http://localhost:1337/v1.0/session";


  var filename  = "../data/brain_001.dcm";

  var upload_url = url + "/upload";
  var delete_url = url + "/delete";

  var signin_url = session_url + "/signin?appuser=testuser@test_test";
  var signout_url = session_url + "/signout";




  var sucessUploadCount = 0;
  var errorUploadCount = 0;

  var sucessDeleteCount = 0;
  var errorDeleteCount = 0;

  var currentCount = 0;

  MAX_COUNT = 10;


  var tick_start;
  var tick_end;


  var specifiedCount = process.argv[2];


  // Start test process here

  // sails.lift(rc('sails'));

  if (specifiedCount == null) {
    specifiedCount = MAX_COUNT;
  }

  console.log("PROJECT DIR:"+__dirname);
  console.log("RUN COUNT:"+ specifiedCount);
  console.log("+ means successfull upload, - means succesfull delete");


  // -- STEP 0 ---- Init Session by SignIn

  request
    .get(signin_url, function (error, response, body ) {
    console.log(response.statusCode);
      console.log(body);
      console.log(response.headers);


   if (!error && response.statusCode == 200) {

     var auth_cookie = response.headers['set-cookie'];//.toString().replace('Path=/;','Path='+ upload_url +';');
     console.log("AUTH COOKIE:"+ auth_cookie);


     //----------------------  MAIN CYCLE ---------   begin
     tick_start = process.hrtime();


     for(var actors = 0; actors < specifiedCount; actors ++) {


       // -- STEP 1 ---  Create a new object

       upload(upload_url,auth_cookie, filename, function (error, response, body) {
         if (error) {
           console.log('Error on POST request to ' + url + ': ' + error.message);
           errorUploadCount++;

         }

         else if (response.statusCode != 200) {
           console.log('HTTP Status is notOK on POST request to ' + url + '. HTTP Status code:' + response.statusCode);
           errorUploadCount++;
         }
         else {
           // console.log(response.statusCode);

           var message;
           try {
             message = JSON.parse(body);
           }
           catch (e) {
             message = null;
           }

           if (message == null) {
             console.log("ERROR in parsing message");
             errorUploadCount++;
           }
           else if(message.envelope == null) {
             console.log("ERROR in parsing message - Envelope is NULL. Message is :"+ body);
             errorUploadCount++;
           }
           else {

             // console.log(message.envelope.id);
             sucessUploadCount++;
             process.stdout.write('+');


           //  console.log("Message Envelope ID:"+ message.envelope.id);

             // -- STEP 2 ---  Delete created object with ID ---
             deleteObject(delete_url, auth_cookie, message.envelope.id, function (error, response, body) {
               if (error) {
                 console.log('Error on GET request during DELETE to ' + url + ': ' + error.message);
                 errorDeleteCount++;
               }
               else {
                 if (response.statusCode == 200) {
                   // console.log("SUCCESS DELETE");
                   sucessDeleteCount++;
                   process.stdout.write('-');

                 }
                 else {
                   console.log("Error during delete.Server response:" + body);
                   console.log(response.statusCode);
                   errorDeleteCount++;
                 }

               }

               currentCount++;

               if (currentCount == specifiedCount) {
                 //--------------------------------------------------  OUTPUT STATISTICS

                 tick_end = process.hrtime();
                 tick_diff = tick_end[0] - tick_start[0];

                 console.log("\n --- SUCCESSES ---");

                 console.log(" Uploads:" + sucessUploadCount);
                 console.log(" Deletes:" + sucessDeleteCount);

                 console.log(" --- ERRORS ---");

                 console.log(" Uploads:" + errorUploadCount);
                 console.log(" Deletes:" + errorDeleteCount);

                 console.log("TIME MEASURES (sec):" + tick_diff);

               }


             });
           }
         }
       });
     }
   }
      else {console.log ('Authentification is not valid. Tests are cancelled.')}
    }
  );





})();


//------------------------------------------------------------------
function upload(base_url, cookie, filename, cb) {

  var formData = {
    dicom_file: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
  };

  request.post({url:base_url, formData: formData, headers: {'User-Agent': 'request', 'Cookie':cookie} }, cb);
};

//------------------------------------------------------------------
function deleteObject(base_url, cookie, envelope_id, cb) {

var get_url = base_url + "?id="+envelope_id;

  request.get({url:get_url, headers: {'User-Agent': 'request', 'Cookie':cookie}}, cb);

};
