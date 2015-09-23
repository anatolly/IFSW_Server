/**
 * Created by ebabkin on 09/21/15.
 */

const DEFAULT_TOKENSIZE = 32;

module.exports = {


//--------------------------------------------------------------------------------------------------------------------
  createValetKeyFor: function (envelope, lease_time_in_minutes, cb) {

    var new_token = createToken(DEFAULT_TOKENSIZE);
    var issuemoment = new Date(Date.now());

    ValetKey.create( {issueTime: issuemoment, leaseMinutes:lease_time_in_minutes, token:new_token, refersTo: envelope} , cb);

  }
};

//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================

// see http://t-pwk.github.io/flake-idgen/  http://blog.tompawlak.org/generate-unique-identifier-nodejs-javascript
// see https://www.npmjs.com/search?q=uuid
// see https://github.com/sehrope/node-rand-token
// see http://stackoverflow.com/questions/29605672/how-to-generate-short-unique-names-for-uploaded-files-in-nodejs
// see http://stackoverflow.com/questions/26066604/generating-unique-tokens-in-a-nodejs-crypto-token-authentication-environment
// see http://yoramkornatzky.com/post/useful-node-js-identification-modules

function createToken(size) {
  /*
   var FlakeId = require('flake-idgen');
   var flakeIdGen = new FlakeId();

   sails.log.debug(flakeIdGen.next());
   sails.log.debug(flakeIdGen.next());
   sails.log.debug(flakeIdGen.next());
   */
  var cr = require('crypto');

  //var hashes = cr.getHashes();
  //sails.log.debug("ValetKeyfactory","test hashes:",hashes);

  return cr.randomBytes(size).toString('hex');
}
