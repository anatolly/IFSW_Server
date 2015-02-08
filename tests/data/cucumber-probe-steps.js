

// SE ALSO: https://github.com/basti1302/cucumber-js-rest-api


module.exports = function () {
  console.log('"Cucumber probe" steps are loaded');


  /*------------------- STEPS SETUP -------------------------*/

   this.World = require('../features/worlds/testCucumberWorld.js').World;
 // this.World = require('../worlds/testRequestWorld.js').World;

  /*------------------- GIVEN clauses -------------------------*/

  this.Given(/^I am on test cucumber site$/, function (cb) {
    console.log('given');
    this.visithome('', cb);
  });

  /*------------------- WHEN clauses -------------------------*/



  this.When(/^I make request to test controller page with param "([^"]*)"$/, function (param_val, cb) {
    console.log('when:' + param_val);
    this.visittest(param_val, cb);
  });



  /*------------------- THEN clauses -------------------------*/


  this.Then(/^I should see http status (\d+)$/, function (expected_status, cb) {
    console.log('then');
    if( this.browser.statusCode != expected_status) {
      cb.fail("ERROR: HTTP Status is not equal to expected (" + expected_status +")");
    }
    else {
      cb();
    }

    })


 /*==============================================================*/
/*---------------------------- UTILITIES ------------------------*/
};
