

// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api


module.exports = function () {
  console.log('"Cucumber probe" feature starts');


  /*------------------- STEPS SETUP -------------------------*/

 // this.World = require('../world/testCucumberWorld.js').World;
  this.World = require('../world/testRequestWorld.js').World;

  /*------------------- GIVEN clauses -------------------------*/

  this.Given(/^I am on test cucumber site$/, function (cb) {
    console.log('given');
    this.visithome('', cb);
  });

  /*------------------- WHEN clauses -------------------------*/



  this.When(/^I make request to test controller page with param "([^"]*)"$/, function (param_val, cb) {
    console.log('when:' + param_val);
    this.visittest("http://localhost:1337/v1.0/TestCucumber/test?param=", param_val, cb);
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


 /*==============================================================*/
/*---------------------------- UTILITIES ------------------------*/
  function assertResponse(lastResponse, cb) {
    if (!lastResponse) {
      cb.fail(new Error('No request has been made until now.'))
      return false
    }
    return true
  }


};
