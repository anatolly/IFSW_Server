/**
 * Created by babkin on 17/09/15.
 */
/** See details on https://github.com/mscdex/mmmagic */

var MimeDetectorStream = require('../../api/services/MimeDetectorStream');

var fs = require('fs');

var mmm = require('mmmagic'),
  Magic = mmm.Magic;

var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var tested_file = process.argv[2];

magic.detectFile(tested_file, function (err, result) {
  if (err) throw err;
  console.log("RES:"+result);
  // output on Windows with 32-bit node:
  //    PE32 executable (DLL) (GUI) Intel 80386, for MS Windows
});

  //-----------------  STREAM BASED IMPLEMENTATION ----------

  var read_stream = fs.createReadStream(tested_file);
  var write_stream = fs.createWriteStream('test.test');


// Compose it all together


//--- create a transform stream as it was suggested in: http://codewinds.com/blog/2013-08-20-nodejs-transform-streams.html
var mime = MimeDetectorStream();

  write_stream.on('finish', function() {
    console.log("RES IN END:"+ mime.getMimeType());
  });


read_stream.pipe(mime).pipe(write_stream);




