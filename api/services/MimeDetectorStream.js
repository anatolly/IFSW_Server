/**
 * Created by babkin on 17/09/15.
 */

var util = require('util');
var stream = require('stream');
// node v0.10+ use native Transform
var Transform = stream.Transform;

var mmm = require('mmmagic'),
  Magic = mmm.Magic;

var magic = new Magic(mmm.MAGIC_MIME_TYPE);


function MimeDetectorStream(options) {

  /*
  var cat = {}
  var walked = false

  cat.__proto__ = Animal()

  cat.pat = function pat() {
    console.log('being patted')
  }

  cat.lasagna = function lasagna() {
    console.log('Lasagna!')
    walked = true
  }

  return cat
*/
  // allow use without new
  if (!(this instanceof MimeDetectorStream)) { return new MimeDetectorStream(options);}

  // init Transform
  Transform.call(this, options);

  this.processed = false;
  this.mime_known = false;
  this.digestedsize = 0;
  this.digestedbuffer = new Buffer(1024);
  this.magic = new Magic(mmm.MAGIC_MIME_TYPE);

  this.mime_type = 'UNK';

}

util.inherits(MimeDetectorStream,Transform);


//---------------------------------------------------------------------------------------------------
/* during each chunk, perform a certain action */
MimeDetectorStream.prototype._transform = function (chunk, enc, cb) {
  // if is Buffer use it, otherwise coerce
  var buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, enc);

  var stream = this;

  this.digestedbuffer = Buffer.concat([buffer], 512);




  this.digestedsize += chunk.length;

  if(! this.processed ) {
    this.processed = true;
    this.mime_known = false;
    this.magic.detect(this.digestedbuffer, function (err, result) {
      if (err) {sails.log.error("MimeDetectorStream", "ERROR  during detection"); throw err;}
      stream.mime_type = result;
      sails.log.debug("MimeDetectorStream", "Mime Type In Trasform Stream:", result);
      stream.mime_known = true;

    });
  }

  stream.push(chunk);
  cb();


};


//---------------------------------------------------------------------------------------------------
/* at the end, flush */
MimeDetectorStream.prototype.getMimeType = function () {
  return this.mime_type;
};




//---------------------------------------------------------------------------------------------------
/* at the end, flush */
MimeDetectorStream.prototype._flush = function (cb) {
  // this.push(this.digester.digest('hex'));

  if(!this.processed)
  {
    this.processed = true;

  }

  sails.log.debug("MimeDetectorStream", "we digested:",this.digestedsize, "b bytes.");
  sails.log.debug("MimeDetectorStream", "mime type discovered:", this.mime_type);
  cb();
};



module.exports = MimeDetectorStream;
