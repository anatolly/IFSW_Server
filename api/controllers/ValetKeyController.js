/**
 * ValetKeyController
 *
 * @description :: Server-side logic for generating a unique one-time URL for the envelope (ValetKey pattern)
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */



  var fs = require('fs');

//---------------- CONSTANTS DEFINITIONS ----------------------------------------------------------------- begin -----

  const DEFAULT_LEASING_TIME_IN_MINUTES = 60 * 24;
  const DEFAULT_PATHNAME = "/valet";

//---------------- CONSTANTS DEFINITIONS -----------------------------------------------------------------  end  -----



//--------------------------------------------------------------------------------------------------------------------
module.exports =
{

//--------------------------------------------------------------------------------------------------------------------
  generateValet: function (req, res) {

    sails.log.debug("REQUEST:", req.params)
    if (! req.params['id'])
    {
      res.statusCode=500;
      return res.json({error:"500", reason:"No needed parameters"});
      }
    else
    {
      // return res.json({success:"200", reason:"OK", myid:req.params['id'], token:new_token});

      // DONE 1) check presence of Envelope with such id
      Envelope.findOne({id:req.params['id']}, function (err, envelope) {
        if (!err) {
          if (envelope != null) {


            // DONE 2) Determine lease time in minutes
            var lease_time_in_minutes = DEFAULT_LEASING_TIME_IN_MINUTES;

            // DONE 3) create an unique valet key
            ValetKeyFactory.createValetKeyFor(envelope, lease_time_in_minutes, function (errKey, valetKey) {

              if ((!errKey) && (valetKey != null)) {

                // TODO 4) compose the request
                sails.log.debug("ValetKeyController", "requestValetKey", 'Send a valet key:', valetKey);
                res.statusCode = 200;

                //  Ingore ---  4.1) Set Headers (Size, Mime, No Cache), A wrong moment to do this
                // these headers should be set when the object is accessed by this ValetKey URL

                var valetKeyURL = getURLFor(req, valetKey);

                // DONE 5) SEND THE REQUEST
                return res.json({"valetKeyURL": valetKeyURL, leasetime: valetKey.leaseMinutes});

              } else {
                sails.log.error("ValetKeyController", "requestValetKey", 'Error during creating a valetKey. Error:', errKey);
                res.statusCode = 500;
                return res.send("Generic 500 Error (no valet key)");
              }
            });
          }
          else {
            sails.log.error("ValetKeyController", "requestValetKey", 'requested Envelope was not found. Search conditions:id =', req.params['id']);
            res.statusCode = 404;
            return res.send("Requested object does not exist. 404 error");
          }
        }
        else {
          sails.log.error("ValetKeyController", "requestValetKey", 'Error in find Envelope. Search conditions:', req.params);
          res.statusCode = 500;
          return res.send("Generic 500 Error");
        }
      });
    }
  },

//--------------------------------------------------------------------------------------------------------------------
  uploadObjectByValet: function (req, res) {
    sails.log.debug("REQUEST:", req.params)
    if (! req.params['token'])
    {
      sails.log.debug("ValetKeyController", "uploadObjectByValet", " parameters:", req.params);
      res.statusCode=500;
      return res.json({error:"500", reason:"No needed parameters"});
    }
    else {
      // TODO 1) check validity of the token (token, lease time)


      // TODO 2) ....
      return res.json({ok:"200", data:req.params['token']});
    }
  }

};


//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================

function getURLFor(request, valetKey) {

  var url = "https://" + request.get('host') + DEFAULT_PATHNAME + "?token=" + valetKey.token;
  return url;
}
