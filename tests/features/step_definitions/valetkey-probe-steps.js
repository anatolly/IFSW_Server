
// SEE ALSO: https://github.com/basti1302/cucumber-js-rest-api

var jsonPath = require('JSONPath').eval;


module.exports = function () {
  console.log('"valetkey probe" steps are loaded');


  /*------------------- STEPS SETUP -------------------------*/

  // this.World = require('../world/testCucumberWorld.js').World;
  this.World = require('../worlds/testRequestWorld.js').World;

  /*------------------- GIVEN clauses -------------------------*/

  /*------------------- WHEN clauses -------------------------*/

  this.When(/^I require a new ValetKey$/, function (cb) {
    console.log('when ValetKey:');
    this.visitVKIssue("/v1.0/envelope/" + this.getLastUploadedId() + "/valet", cb);
  });


  this.When(/^I use the LAST ValetKey$/, function (cb) {
    console.log('when require a file by ValetKey:');
    this.downloadByFullURI(this.getLastKnownVKUrl(),"RECEIVED_DICOM_FILE_FOR_ID_"+ this.getLastUploadedId() +".dcm" , cb);
  });

  /*------------------- THEN clauses -------------------------*/


  /*------------------- AND clauses -------------------------*/


  /*==============================================================*/
  /*---------------------------- UTILITIES ------------------------*/
  /*---------------------------------------------------------------*/


};
