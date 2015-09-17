/**
 * Created by babkin on 17/09/15.
 */
/** See details on https://github.com/mscdex/mmmagic */

var fs = require('fs');
var util = require('util');

var stream = require('stream');

var mmm = require('mmmagic'),
  Magic = mmm.Magic;

var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var tested_file = process.argv[2];

magic.detectFile(tested_file, function (err, result) {
  if (err) throw err;
  console.log(result);
  // output on Windows with 32-bit node:
  //    PE32 executable (DLL) (GUI) Intel 80386, for MS Windows


  //-----------------  STREAM BASED IMPLEMENTATION ----------

  var read_stream = fs.createReadStream(tested_file);
  var write_stream = fs.createWriteStream('test.test');

  //--- create a transform stream as it was suggested in: http://codewinds.com/blog/2013-08-20-nodejs-transform-streams.html

// node v0.10+ use native Transform
  var Transform = stream.Transform;


  function MimeType(options)
  {
    // allow use without new
    if (!(this instanceof MimeType)) { return new MimeType(options);}

    // init Transform
    Transform.call(this, options);

    this.processed = false;
    this.digestedsize = 0;
    this.digestedbuffer = new Buffer(1024);
    this.magic = new Magic(mmm.MAGIC_MIME_TYPE);
    this.mime_type="UNK";

  }

util.inherits(MimeType,Transform);

 //---------------------------------------------------------------------------------------------------
  /* during each chunk, perform a certain action */
  MimeType.prototype._transform = function (chunk, enc, cb) {
    // if is Buffer use it, otherwise coerce
    var buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, enc);


  //  this.digestedbuffer = Buffer.concat([this.digestedbuffer,buffer]);

    this.digestedsize += chunk.length;

    if(! this.processed ) {
      this.processed = true;
      this.magic.detect(buffer, function (err, result) {
        if (err) throw err;
        this.mime_type = result;
      });
    }
    this.push(chunk);
    cb();
  };


  //---------------------------------------------------------------------------------------------------
  /* at the end, flush */
  MimeType.prototype._getMimeType = function () {
    return this.mime_type;
  };




//---------------------------------------------------------------------------------------------------
  /* at the end, flush */
 MimeType.prototype._flush = function (cb) {
   // this.push(this.digester.digest('hex'));
   console.log("we digested:" + this.digestedsize + "b bytes.");
   cb();
 };


  // Compose it all together
  var mime = new MimeType();


  write_stream.on('end', function() {
    console.log(mime._getMimeType());
  });


read_stream.pipe(mime).pipe(write_stream);



});
