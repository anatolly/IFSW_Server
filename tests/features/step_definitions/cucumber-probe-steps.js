var assert = require("assert");

module.exports = function () {
  console.log('"Cucumber probe" feature starts');

  this.World = require('../worlds/testCucumberWorld.js').World;

  this.Given(/^I am on test cucumber site$/, function (cb) {
    console.log('given');
    this.visithome('', cb);
  });

  this.When(/^I make request to test controller page with param "([^"]*)"$/, function (param_val, cb) {
    console.log('when:' + param_val);
    this.visittest(param_val, cb);
  });

  this.Then(/^I should see status "([^"]*)"$/, function (expected_status, cb) {
    console.log('then');

    //assert.equal(this.browser.statusCode, expected_status);
    if (this.browser.statusCode != expected_status) {
      throw "Error: HTTP-Status is not like expected";
    }

    cb();

  });

};
