/**
 * EnvelopeController
 *
 * @description :: Server-side logic for managing auth- and application-dependent envelopes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


// See www.stackoverflow.com/questions/28204247


var DICOMEnvelopeController = require ('./DICOMEnvelopeController');


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

//--------------------------------------------------------------------------------------------------------------------
//TODO redesign upload method to avoid saving the local file (parse it as a stream ! )
//TODO redesign upload method to use MIME encoding for proper type
  upload: function  (req, res) {
      return DICOMEnvelopeController.upload(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  download: function (req, res) {
    return DICOMEnvelopeController.download(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  delete: function (req, res ) {

    return DICOMEnvelopeController.delete(req,res);
  },

//--------------------------------------------------------------------------------------------------------------------
  deleteHeap: function (req, res) {
  return DICOMEnvelopeController.deleteHeap(req,res)
  }
};



//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================
