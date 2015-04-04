// Node Application for Testing Project server
// For running please use command-line argument <number of requests>

var request = require('request');
var fs = require('fs');

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually run from.
// !!! __dirname is uequal to complete path to standalone

process.chdir(__dirname);


(function() {


  // CHANGE URL if the address of the solution is different
//  var url = "http://localhost:8080/cloudStorage/v1.0/DICOMEnvelope";

  var url = "http://localhost:1337/v1.0/DICOMEnvelope";



  var filename  = "../data/brain_001.dcm";

  var upload_url = url + "/upload";
  var delete_url = url + "/delete";


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
  //----------------------  MAIN CYCLE ---------   begin
  tick_start = process.hrtime();


for(var actors = 0; actors < specifiedCount; actors ++) {


  // -- STEP 1 ---  Create a new object

  upload(upload_url, filename, function (error, response, body) {
    if (error) {
      console.log('Error on POST request to ' + url + ': ' + error.message);
      errorUploadCount++;

    }
    else {
      // console.log(response.statusCode);

      var message;

      try {
        message = JSON.parse(response.body);
      }
      catch (e) {
        message = null;
      }

      if (message == null) {
        console.log("ERROR in parsing message");
        errorUploadCount++;
      }
      else if(message.envelope == null) {
        console.log("ERROR in parsing message - Envelope is NULL. Message is :"+message);
        errorUploadCount++;
      }
      else {

       // console.log(message.envelope.id);
        sucessUploadCount++;
        process.stdout.write('+');

        // -- STEP 2 ---  Delete created object with ID ---
        deleteObject(delete_url, message.envelope.id, function (error, response, body) {
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



})();


//------------------------------------------------------------------
function upload(base_url, filename, cb) {

  var formData = {
    dicom_file: {value: fs.createReadStream(filename), options: {filename:"DICOM FILE"}}
  };

  request.post({url:base_url, formData: formData, headers: {'User-Agent': 'request'} }, cb);
};

//------------------------------------------------------------------
function deleteObject(base_url, envelope_id, cb) {

var get_url = base_url + "?id="+envelope_id;

  request(get_url, cb);

};
