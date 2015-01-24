var zombie = require("zombie");

//module.exports = function () {
//
//  //place for some additional fields and functions
//
//  this.World = function (cb) {
//
//    this.browser = new zombie(); // this.browser will be available in step definitions
//
//    this.testpage = function(param_val) {
//      return "http://localhost:1337/v1.0/TestCucumber/test?param=" + param_val;
//    };
//
//    this.homepage = function(path) {
//      return "http://localhost:1337/v1.0/TestCucumber/" + path;
//    };
//
//    this.visittest = function(param_val, cb) {
//      this.browser.visit(this.testpage(param_val), function(err, browser, status) {
//        cb(err, browser, status);
//      });
//    };
//
//    this.visithome = function(path, cb) {
//      this.browser.visit(this.homepage(path), function(err, browser, status) {
//        cb(err, browser, status);
//      });
//    };
//
//    cb();
//  };
//
//};
