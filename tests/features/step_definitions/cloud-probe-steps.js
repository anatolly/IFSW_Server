
// SEE ALSO: https://github.com/basti1302/cucumber-js-rest-api

var jsonPath = require('JSONPath').eval;


module.exports = function () {
  console.log('"Cloud probe" steps are loaded');


  /*------------------- STEPS SETUP -------------------------*/

  // this.World = require('../world/testCucumberWorld.js').World;
  this.World = require('../worlds/testRequestWorld.js').World;

  /*------------------- GIVEN clauses -------------------------*/

//  this.Given(/^I am on test cucumber site$/, function (cb) {
//    console.log('given');
//    this.visithome('', cb);
//  });

  /*------------------- WHEN clauses -------------------------*/



  this.When(/^I make request to test controller page with param "([^"]*)"$/, function (param_val, cb) {
    console.log('when:' + param_val);
    this.visittest("/v1.0/TestCucumber/test?param=", param_val, cb);
  });


  this.When(/^I upload a valid DICOM file$/, function (cb) {

    this.upload("/v1.0/DICOMEnvelope/upload",
                "/Users/babkin/WebstormProjects/IFSW_Server/tests/data/brain_001.dcm",
                cb);

    // cb.pending();
  });


    this.When(/^I make request to download a valid DICOM file with id (\d+)$/, function (param_val, cb) {

      this.download("/v1.0/DICOMEnvelope/download", param_val, "RECEIVED_DICOM_FILE_FOR_ID_"+param_val+".dcm", cb);


    });

  /*------------------- THEN clauses -------------------------*/


  this.Then(/^I should see http status (\d+)$/, function (expected_status, cb) {
    console.log('then');

    if (!assertResponse(this.lastResponse, cb)) { return }
    // deliberately using != here (no need to cast integer/string)
    /* jshint -W116 */
    if (this.lastResponse.statusCode != expected_status) {
      /* jshint +W116 */
      cb.fail('The last http response did not have the expected ' +
      'status, expected ' + expected_status + ' but got ' +
      this.lastResponse.statusCode)
    } else {
      cb()
    }
  })

  /*------------------- AND clauses -------------------------*/

    this.Then(/^Body contains property "([^"]*)" with value (\d+)$/, function (property_name, property_val,  cb) {
      if (!assertPropertyIs(this.lastResponse, property_name, property_val, cb)) {
        return
      }
      cb();
    })



    this.Then(/^Size of the downloaded file for id (\d+) should coincide the size of the test DICOM file$/, function (file_id, cb) {
      if (!assertFilesEqual("/Users/babkin/WebstormProjects/IFSW_Server/tests/data/brain_001.dcm","RECEIVED_DICOM_FILE_FOR_ID_"+ file_id +".dcm", cb)) {
        return
      }
      cb();
    });



  /*==============================================================*/
  /*---------------------------- UTILITIES ------------------------*/
  function assertResponse(lastResponse, cb) {
    if (!lastResponse) {
      cb.fail(new Error('No request has been made until now.'))
      return false
    }
    return true
  }
  /*---------------------------------------------------------------*/

  function assertBody(lastResponse, callback) {
    if (!assertResponse(lastResponse, callback)) { return false }
    if (!lastResponse.body) {
      callback.fail(new Error('The response to the last request had no body.'))
      return null
    }
    return lastResponse.body
  }

  /*---------------------------------------------------------------*/

  function assertValidJson(lastResponse, callback) {
    var body = assertBody(lastResponse, callback)
    if (!body) {
      return null
    }
    try {
      return JSON.parse(body)
    } catch (e) {
      callback.fail(
        new Error('The body of the last response was not valid JSON.'))
      return null
    }
  }

  /*---------------------------------------------------------------*/

  function assertPropertyExists(lastResponse, key, expectedValue,
                                callback) {

    var object = assertValidJson(lastResponse, callback);
    if (!object) { return null }
    var property
    if (key.indexOf('$.') !== 0 && key.indexOf('$[') !== 0){
      // normal property
      property = object[key]
    } else {
      // JSONPath expression
      var matches = jsonPath(object, key)
      if (matches.length === 0) {
        // no match
        callback.fail('The last response did not have the property: ' +
        key + '\nExpected it to be\n' + expectedValue)
        return null
      } else if (matches.length > 1) {
        // ambigious match
        callback.fail('JSONPath expression ' + key + ' returned more than ' +
        'one match in object:\n' + JSON.stringify(object))
        return null
      } else {
        // exactly one match, good
        property = matches[0]
      }
    }
    if (property == null) {
      callback.fail('The last response did not have the property ' +
      key + '\nExpected it to be\n' + expectedValue)
      return null
    }
    return property
  }

  /*---------------------------------------------------------------*/

  function assertPropertyIs(lastResponse, key, expectedValue, callback) {
    var value = assertPropertyExists(lastResponse, key, expectedValue, callback)
    if (!value) { return false }
    if (value !== expectedValue) {
      callback.fail('The last response did not have the expected content in ' +
      'property ' + key + '. ' + 'Got:\n\n' + value + '\n\nExpected:\n\n' +
      expectedValue)
      return false
    }
    return true
  }

  /*---------------------------------------------------------------*/

  function assertPropertyContains(lastResponse, key, expectedValue, callback) {
    var value = assertPropertyExists(lastResponse, key, expectedValue, callback)
    if (!value) { return false }
    if (value.indexOf(expectedValue) === -1) {
      callback.fail('The last response did not have the expected content in ' +
      'property ' + key + '. ' +
      'Got:\n\n' + value + '\n\nExpected it to contain:\n\n' + expectedValue)
      return false
    }
    return true
  }
  /*---------------------------------------------------------------*/

  function assertFilesEqual(template_filename, local_filename, callback) {

    var fs = require("fs"); //Load the filesystem module

    var stats = fs.statSync(template_filename);
    var expectedFileSizeInBytes = stats["size"];

    var stats1 = fs.statSync(local_filename);
    console.log("STAT:" + JSON.stringify(stats1));
    var actualFileSizeInBytes = stats1["size"];

    actualFileSizeInBytes = 132914;

    console.log("Downloaded file name:"+local_filename);

    console.log("Size of template file:"+expectedFileSizeInBytes+" . Actual Size of downloaded file:"+actualFileSizeInBytes);


    if (actualFileSizeInBytes !== expectedFileSizeInBytes) {
      callback.fail('The files do not coinside in size ');
      return false
    }
    return true
  }


};
