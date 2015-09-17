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

  //  this.digestedbuffer = Buffer.concat([this.digestedbuffer,buffer]);

  this.digestedsize += chunk.length;

  if(! this.processed ) {
    this.processed = true;
    this.magic.detect(buffer, function (err, result) {
      if (err) throw err;
      stream.mime_type = result;
      console.log("RES IN TRANSFORM:"+result);

      stream.push(chunk);
      cb();

    });
  }

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

  console.log("we digested:" + this.digestedsize + "b bytes.");
  console.log("mime type discovered:"+this.mime_type);
  cb();
};



module.exports = MimeDetectorStream;
