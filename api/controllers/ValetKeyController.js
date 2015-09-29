/**
 * ValetKeyController
 *
 * @description :: Server-side logic for generating a unique one-time URL for the envelope (ValetKey pattern)
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */



  var fs = require('fs');

//---------------- CONSTANTS DEFINITIONS ----------------------------------------------------------------- begin -----

  const DEFAULT_PATHNAME = "/v1.0"+"/valetkey";

//---------------- CONSTANTS DEFINITIONS -----------------------------------------------------------------  end  -----



//--------------------------------------------------------------------------------------------------------------------
module.exports =
{

//--------------------------------------------------------------------------------------------------------------------
  generateValet: function (req, res) {
    if (! req.params['id'])
    {
      res.statusCode=500;
      return res.json({error:"500", reason:"No needed parameters"});
      }
    else
    {
      // DONE 1) check presence of Envelope with such id
      var search_conditions = {id:req.params['id']};

      Envelope.findOne().where(search_conditions).where(CommonTools.getIsolationFilterCondition(req)).exec(function (err, envelope) {
        if (!err) {
          if (envelope != null) {

            sails.log.debug("ValetKeyController",'generateValet', "Envelope:", envelope);

            // DONE 2) Determine lease time in minutes

            var lease_time_in_minutes = (req.query[sails.config.ifsw.req_param_valetKey_lease]) || ValetKey.DEFAULT_LEASE_MINUTES;
            var max_count = (req.query[sails.config.ifsw.req_param_valetKey_maxcount]) || ValetKey.DEFAULT_MAX_ACCESS_COUNT;


            // DONE 3) create an unique valet key
            ValetKeyFactory.createValetKeyFor(envelope, lease_time_in_minutes, max_count, function (errKey, valetKey) {

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
            sails.log.error("ValetKeyController", "requestValetKey", 'requested Envelope was not found. Search conditions:', search_conditions);
            res.statusCode = 404;
            return res.send("Requested object does not exist. 404 error");
          }
        }
        else {
          sails.log.error("ValetKeyController", "requestValetKey", 'Error in find Envelope. Search conditions:', search_conditions);
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
      sails.log.error("ValetKeyController", "uploadObjectByValet", " no nedeed parameter token. Available:", req.params);
      res.statusCode=500;
      return res.json({error:"500", reason:"No needed parameters"});
    }
    else {
      // 1) check existance of the single instance of the valet key
      ValetKey.find({token:req.params['token']}).populate('refersTo').exec(function(err, vkeys) {
        if(err) {
          sails.log.error("ValetKeyController", "uploadObjectByValet", " DB Error in find:", err);
          res.statusCode=500;
          return res.json({error:"500", reason:"Storage Error"});
        }
        else {
          if(vkeys.length == 0) {
            sails.log.error("ValetKeyController", "uploadObjectByValet", " Token Not found");
            res.statusCode=404;
            return res.json({error:"404", reason:"token not found"});
          }
          else {
            if(vkeys.length > 1) {
              sails.log.error("ValetKeyController", "uploadObjectByValet", " Token exists in several instances:",vkeys.length);
              // http://httpstatus.es/409
              res.statusCode=409;
              return res.json({error:"409", reason:"Conflict is detected"});


            } else {
              // a single instance of the valetkey was found
              // 2) check a proper type of vkeys[0]

              try { // vkeys[0] instanceof ValetKey

                var vkey = new ValetKey._model(vkeys[0]);

                // 3) Check logical validity of the key (state, access count, lease time, etc)
                var status = vkey.checkValidity();

                if (status === ValetKey.VALID_STATUS ) {
                  // access may be granted
                  // 4) Register the key access event and save in ORM
                  vkey.registerAccessEvent();

                  vkey.save(function(err, vk){
                    if (err) {
                      sails.log.error("ValetKeyController", "uploadObjectByValet", " DB Error in save:", err);
                      res.statusCode=500;
                      return res.json({error:"500", reason:"Storage Error II"});
                    } else {
                      // ---------------------- delivery of the content to the client -------------- begin ----
                      // 5) Prepair needed headers
                      setupHeaders(res, vkeys[0]);

                      // 6) initiate streaming of the object based on the reffered envelope
                      var envelope = vkey.refersTo;
                      if (envelope != null)
                      {
                          initiateStreamingFor(envelope, res);
                      }
                      else
                      {
                        sails.log.error("ValetKeyController", "uploadObjectByValet", " Envelope for known ValetKey is null or invalid");
                        res.statusCode=500;
                        return res.json({error:"500", reason:"Generic Storage Error III"});
                      }
                      // ---------------------- delivery of the content to the client -------------- end   ----
                    }
                  });
                }
                else {
                // key access is rejected
                  sails.log.error("ValetKeyController", "uploadObjectByValet", " Access to Valet Key is rejected");
                  return res.json({error: status.toString(), reason:"Access is rejected"});
                }

              }
              catch (e) {
              // vkeys[0] is of improper type or another error
                sails.log.error("ValetKeyController", "uploadObjectByValet", " Exception was raised:",e);
                res.statusCode=500;
                return res.json({error:"500", reason:"Improper type of the keys or another error."});
              }
            }
          }

        }
      });


     // return res.json({ok:"200", data:req.params['token']});
    }
  }

};


//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================

function getURLFor(request, valetKey) {

  var url = "http://" + request.get('host') + DEFAULT_PATHNAME + "/" + valetKey.token;
  return url;
}
//--------------------------------------------------------------------------------------------------------------------
function setupHeaders(response, valetKey)
{
  // --- setup Content-Type from the reffered envelope
  response.setHeader("Content-Type", valetKey.refersTo.MimeType);

  // TODO --- setup Size
 // response.res.setHeader("Content-length", valetKey.refersTo.ContentSize);

  //  --- setup No-Cache
  // see http://stackoverflow.com/questions/866822/why-both-no-cache-and-no-store-should-be-used-in-http-response
  // see http://cristian.sulea.net/blog/disable-browser-caching-with-meta-html-tags/
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");


}
//--------------------------------------------------------------------------------------------------------------------
function initiateStreamingFor(envelope, response)
{
  var res = response;

  sails.log.debug("ValetKeyController", "uploadObjectByValet", "initiateStreaming for envelope id:", envelope.id);
  sails.log.debug("ValetKeyController", "uploadObjectByValet", "initiateStreaming for ObjectID:", envelope.ObjectID);

  var ostream = CloudAPI.downloadFile(envelope.ObjectID);

  ostream.pause();
  ostream.on('error', function (resp) {
    sails.log.error("ValetKeyController", "uploadObjectByValet", "initiateStreaming", "Error in output stream:", resp);
    res.statusCode=500;
    return res.send(500, "Object Download Error");
  });

  ostream.once('data', function (data_chunk) {
    sails.log.debug("ValetKeyController", "uploadObjectByValet", "initiateStreaming", "ONCE Data event");
    var first_resp = data_chunk.toString();
    if (ClodStorageSignalNotFound(first_resp)) {
      sails.log.error("ValetKeyController", "uploadObjectByValet", "initiateStreaming", "ERROR: No such key response from cloud storage");
      ostream.end();
      res.statusCode=404;
      return res.send(404, "No such Object in Storage");

    } else {  // succesfull finish of preparatory tasks - start to download the object as a stream
      var filename = envelope.filename || ("IFSW_Object.object");
      res.statusCode = 200;
      res.set("Content-Disposition", "attachment; filename=" + filename);
      res.write(data_chunk);
      ostream.pipe(res);
      ostream.resume();
    }
  });

  ostream.on('response', function (resp) {
    sails.log.debug("ValetKeyController", "uploadObjectByValet", "initiateStreaming", "ON Response event:", resp);
    // return res.send(404, "No such file");
  });

//--------------------------------------------------------------------------------------------------------------------

  function ClodStorageSignalNotFound(response)
  {
     return (response == '{"Code":"NoSuchKey"}');
  }
}

