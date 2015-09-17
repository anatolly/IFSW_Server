/**
 * Created by babkin on 17/09/15.
 */
var Magic = require('mmmagic').Magic;

var magic = new Magic();

var tested_file = process.argv[2];

magic.detectFile(tested_file, function (err, result) {
  if (err) throw err;
  console.log(result);
  // output on Windows with 32-bit node:
  //    PE32 executable (DLL) (GUI) Intel 80386, for MS Windows


});
