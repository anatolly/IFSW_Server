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


var DICOMEnvelopeController = require ('./DICOMEnvelopeController');
var TEST_FILENAME = "TEST_UPLOAD_FILE.dat";


//--------------------------------------------------------------------------------------------------------------------
module.exports =
{

  index: function (req, res) {

    var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

    // force using extra conditions to limit search
    search_conditions.userID = req.session.user;
    search_conditions.applicationID = sails.config.ifsw.application_name;

    DICOMEnvelope.find(search_conditions, function (err, envelopes) {

      if(err) {
        return res.json({Error: 'Error during index in Envelope:' + err });
      }
      return res.json(envelopes);

    });



  },

//--------------------------------------------------------------------------------------------------------------------
find: function (req, res) {


  var search_conditions = CommonTools.cloneSailsReqParams(req, 'all');

  // force using extra conditions to limit search
  search_conditions.userID = req.session.user;
  search_conditions.applicationID = sails.config.ifsw.application_name;




  if (search_conditions.id) {
    DICOMEnvelope.findOne(search_conditions, function (err, envelope) {

      if(err) {
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
    DICOMEnvelope.find(search_conditions, function (err, envelopes) {

      if(err) {
        return res.json({Error: 'Error during index in Envelope:' + err });
      }
      return res.json(envelopes);

    });
  }


},

//-------Original methods ---------------------------------------------------------------------------------- begin  --
// TODO redesign upload method to avoid saving the local file (parse it as a stream ! )
//TODO redesign upload method to use MIME encoding for proper type
  upload: function  (req, res) {

    // pipe the  data of multipart body (file)
    var readStream = fs.createReadStream(TEST_FILENAME); //fs. req.file(UPLOADED_CONTENT_PARAM_NAME);

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
          EnvelopeFactory.createEnvelope(uniqueObjectID.toString(), req.session.user, function (aEnvelope) {
          try {
            CloudAPI.uploadEnvelopeContent(readStream, aEnvelope, function (err, updatedEnvelope) {

              if (err) {

                sails.log.error('Cloud API Error :' + err);
                return res.json({Error: 'Error text:' + err});
              }

              sails.log("FILE UPLOADED:" + JSON.stringify(updatedEnvelope));
          //    sails.log("FILE UPLOADED METADATA:" + JSON.stringify(file.metadata));
              res.statusCode = 200;
              return res.json({
                message: 'File uploaded successfully!',
                files: updatedEnvelope,
                envelope: updatedEnvelope
              });
            })
          }
          catch (e) {
            console.log("Exception during upload file" + e);
            //TODO send HTTP error code and a reason
          }
        });
      }
      catch (e) {
        sails.error.log("Exception during evelope"+e);
      //TODO send HTTP error code and a reason
      };

    });

  },



//-------Original methods ---------------------------------------------------------------------------------- end    --


//-------Stubs of the methods ------------------------------------------------------------------------------ begin  --
//--------------------------------------------------------------------------------------------------------------------
//TODO redesign upload method to avoid saving the local file (parse it as a stream ! )
//TODO redesign upload method to use MIME encoding for proper type
  _upload: function  (req, res) {
      return DICOMEnvelopeController.upload(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  _download: function (req, res) {
    return DICOMEnvelopeController.download(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  _delete: function (req, res ) {

    return DICOMEnvelopeController.delete(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  _deleteHeap: function (req, res) {
  return DICOMEnvelopeController.deleteHeap(req,res)
  }
//-------Stubs of the methods ------------------------------------------------------------------------------ end    --


};



//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================

