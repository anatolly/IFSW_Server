/**
 * EnvelopeController
 *
 * @description :: Server-side logic for managing auth- and application-dependent envelopes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


// See www.stackoverflow.com/questions/28204247


  var fs = require('fs');

//---------------- CONSTANTS DEFINITIONS ----------------------------------------------------------------- begin -----

  const UPLOADED_CONTENT_PARAM_NAME = "new_content";


//---------------- CONSTANTS DEFINITIONS -----------------------------------------------------------------  end  -----



//--------------------------------------------------------------------------------------------------------------------
module.exports =
{

//-------Original methods ---------------------------------------------------------------------------------- begin  --
//--------------------------------------------------------------------------------------------------------------------

  index: function (req, res) {

    var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

    // force using extra conditions to limit search
    //search_conditions.userID = (req.session.user )?req.session.user:sails.config.ifsw.default_param_userid;
    //search_conditions.applicationID = sails.config.ifsw.application_name;

    Envelope.find(search_conditions, function (err, envelopes) {

      if(err) {
        sails.log.error("EnvelopeController", "index", "Error during find:", err);

        return res.json({Error: 'Error during index in Envelope:' + err });
      }
      return res.json(envelopes);

    });

  },


//--------------------------------------------------------------------------------------------------------------------
  find: function (req, res) {

    var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

    // force using extra conditions to limit search
    //search_conditions.userID = (req.session.user )?req.session.user:sails.config.ifsw.default_param_userid;
    //search_conditions.applicationID = sails.config.ifsw.application_name;

    if (search_conditions.id) {
      Envelope.findOne(search_conditions, function (err, envelope) {

        if(err) {
          sails.log.error("EnvelopeController", "find", "Error during find:", err);

          return res.json({Error: 'Error during find in Envelope:' + err });
        }
        if (envelope === undefined) {
          return res.notFound();
        }
        else {
          return res.json(envelope);
        }

      });

    }
    else {
      Envelope.find(search_conditions, function (err, envelopes) {

        if (err) {
          sails.log.error("EnvelopeController", "find", "Error during Index:", err);
          return res.json({Error: 'Error during index in Envelope:' + err});
        }
        return res.json(envelopes);

      });
    }
  },


//--------------------------------------------------------------------------------------------------------------------
  upload: function  (req, res) {

    // pipe the  data of multipart body (file)
    //fs.createReadStream(TEST_FILENAME); //fs.
    var readStream =  req.file(UPLOADED_CONTENT_PARAM_NAME);

    // generate ObjectID
    var uniqueObjectID = CommonTools.createUUID();


    //check uniqueness
//        DICOMEnvelope.find({where:{'DICOMObjectID': {'=': uniqueDICOMObjectID } }, limit: 1}, function (err, envelopes) {
    Envelope.find({"ObjectID": uniqueObjectID }, function (err, envelopes) {

      if (err) {
        sails.log.error("Error: Error during check Envelope");
      }

      if (envelopes != null) {
        // generate UUID once more
        uniqueObjectID = CommonTools.createUUID();
      }

      try {
          var basicEnvelope = EnvelopeFactory.createEnvelope(uniqueObjectID.toString(), req.session.user, req.session.application);
          try {

            CloudAPI.uploadEnvelopeContent(readStream, basicEnvelope , function (err, fileModel) {

              if (err) {

                sails.log.error("EnvelopeController", 'Cloud API Error :', err);
                return res.json({Error: 'Error text:' + err});
              }

              sails.log.debug("EnvelopeController", "FILE UPLOADED:",  JSON.stringify(fileModel.metadata));


              // Save Envelope
              Envelope.create(fileModel.metadata, function (err, newEnvelope) {
                if(err) {
                  // implement error handling
                  sails.log.error("EnvelopeController","upload", "Error during creating ORM Generic Envelope");
                  res.statusCode = 500;
                  return res.json({
                    message: 'File uploaded successfully, but ORM operation failed.',
                    error: err,
                    envelope: fileModel.metadata
                  });
                }
                else
                {

                  // it works -- return res.redirect("../../envelope/"+ newEnvelope.id.toString());

                  res.statusCode = 201;
//                  res.location(req.protocol + '://' + req.get('host')+ '/../../envelope/' + newEnvelope.id.toString());
                  res.location( '/../' + newEnvelope.id.toString());

                  return res.json({
                    message: 'File uploaded successfully.',
                    envelope: newEnvelope
                  });
                }
              });
            })
          }
          catch (e) {
            sails.log.error("EnvelopeController", "Exception during upload file:", e);
            //TODO send HTTP error code and a reason
          }
      }
      catch (e) {
        sails.error.log("EnvelopeController", "Exception during evelope", e);
      //TODO send HTTP error code and a reason
      };

    });

  },

//--------------------------------------------------------------------------------------------------------------------
  download: function (req, res) {

    var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

    Envelope.findOne(search_conditions, function (err, envelope) {

      if (err)
      {
        sails.log.error("EnvelopeController", "download", "Error during find:", err);
        res.statusCode = 500;
        return res.json({Error: 'Error during findOne:' + err });
      }
      else {
        if (envelope != null) {

          sails.log.debug("EnvelopeController", "download", "ENVELOPE ID = ", envelope.id);
          sails.log.debug("EnvelopeController", "download","OBJECT ID:", envelope.ObjectID);

          var ostream = CloudAPI.downloadFile(envelope.ObjectID);

          ostream.pause();
          ostream.on('error', function (resp) {
            sails.log.error("EnvelopeController", "download", "Error in output stream:", resp);
            return res.send(500, "Download Error");
          });

          ostream.once('data', function (data_chunk) {
            sails.log.debug("EnvelopeController", "download", "ONCE Data event");
            var first_resp = data_chunk.toString();
            if (first_resp == "NoSuchKey") {
              sails.log.error("EnvelopeController", "download", "ERROR: No such key response from cloud storage");
              ostream.end();
              return res.send(404, "No such File");

            } else {

              var name = envelope.filename;

               if (name === 'unknown') {
                 name = "IFSW_Object_ID_" + envelope.id + ".object";
               }

              if(envelope.MimeType != null) {
                res.contentType(envelope.MimeType);
              }
              else
              {
                res.set("Content-Type", envelope.claimedMimeType);
              }
              res.set('Content-Length',envelope.size);


/*
              if (envelope.filename == 'unknown') {
                filename = "IFSW_Object_ID_" + envelope.id + ".object";
              }
              else
              {
                filename = envelope.filename;
              }
*/
              res.set("Content-Disposition", "attachment; filename=" + name);
              res.write(data_chunk);
              ostream.pipe(res);
              ostream.resume();
            }
          });

          ostream.on('response', function (resp) {
            sails.log.debug("EnvelopeController", "download", "ON Response event", resp);
            return res.send(404, "No such file");
          });
        }
        else {
          sails.log.error("EnvelopeController", "download", 'Envelope was not found. Search conditions:', search_conditions);
          res.statusCode = 404;
          return res.send("Envelope was not found. 404 error" );
        }
      }
    });
  },

//--------------------------------------------------------------------------------------------------------------------
  delete: function (req, res ) {

    var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

    sails.log.debug("SEARCH_CONDITIONS",search_conditions);
    sails.log.debug("SEARCH_CONDITIONS",search_conditions.length);

    if (Object.keys(search_conditions).length === 0) {
      sails.log.debug("EnvelopeController", "delete", "ERROR: Empty filter conditions");
      res.statusCode = 400;
      return res.json("ERROR: Filter conditions are missed.");
    }


    // force using extra conditions to limit search
  //  search_conditions.userID = (req.session.user )?req.session.user:sails.config.ifsw.default_param_userid;
  //  search_conditions.applicationID = sails.config.ifsw.application_name;


    Envelope.findOne(search_conditions, function (err, envelope) {
      if (err) {
        sails.log.error("EnvelopeController", "delete", "Error during find:", err);
        res.statusCode = 500;
        return res.json({Error: 'Error during delete in Envelope:' + err });
      }
      else {
        if (envelope != null) {
          _deleteObjectFromStorage(envelope, function (result) {
            if(result != null){
              res.statusCode = result.statusCode;
              return res.json(result.result);
            }
          } );
        }
        else {
          sails.log.error("EnvelopeController", "delete", 'Envelope was not found. Search conditions:', search_conditions);
          res.statusCode = 404;
          return res.send("Envelope was not found. 404 error" );
        }
      }


    });
  }

//-------Original methods ---------------------------------------------------------------------------------- end    --
};


//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================

function _deleteObjectFromStorage (envelope, cb) {
  CloudAPI.deletefile(envelope.ObjectID, function (err, result) {
    if (err) {
      sails.log.error("EnvelopeController","delete", 'Error during delete the object from the cloud. Error:', err);
      cb({statusCode: 500, result: "Envelope ID:" + envelope.id +" Error deleting object from cloud: " + err });
    }
    else {

      Envelope.destroy(envelope.id).exec(function (err) {
        if (err) {
          sails.log.error("EnvelopeController","delete", "Error delete of ORM isntance with id:", envelope.id);
          cb({statusCode: 500, result: "Failure: delete ORM instance:" + err });
        }
        else {
          sails.log.debug("EnvelopeController","delete", "delete sucessfull with id:", envelope.id);
          cb({statusCode: 200, result: "Sucess: delete file "});
        }
      }); //destroy ORM instance
    }
  });
}

