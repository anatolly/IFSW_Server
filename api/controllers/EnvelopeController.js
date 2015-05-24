/**
 * EnvelopeController
 *
 * @description :: Server-side logic for managing auth- and application-dependent envelopes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


//See www.stackoverflow.com/questions/28204247




// Reference the dicomParser module
//var dicomParser = require('.././dicomParser');
var dicomParser = require('../../externals/dicomParser');
var fs = require('fs');


var DICOMEnvelopeController = require ('./DICOMEnvelopeController');

module.exports =
{

  index: function (req, res) {



    //return res.redirect("/v1.0/DICOMEnvelope");

    DICOMEnvelope.find({'userID':req.session.user.toString(), 'applicationID':sails.config.ifsw.application_name }, function (err, envelopes) {

      if(err) {
        return res.json({Error: 'Error during index in Envelope:' + err });
      }
      return res.json(envelopes);

    });



  },

find: function (req, res) {

  var id = req.param('id');

  if (id) {
    DICOMEnvelope.findOne({'userID':req.session.user.toString(), 'id':id, 'applicationID':sails.config.ifsw.application_name}, function (err, envelope) {

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
    DICOMEnvelope.find({'userID':req.session.user.toString(), 'applicationID':sails.config.ifsw.application_name }, function (err, envelopes) {

      if(err) {
        return res.json({Error: 'Error during index in Envelope:' + err });
      }
      return res.json(envelopes);

    });
  }


},


 //TODO redesign upload method to avoid saving the local file (parse it as a stream ! )
  upload: function  (req, res) {
      return DICOMEnvelopeController.upload(req,res);
  },


  download: function (req, res) {
    return DICOMEnvelopeController.download(req,res);
  },

  //------------------------------------------------------------------------------------------------
  delete: function (req, res ) {

    return DICOMEnvelopeController.delete(req,res);
  },

  //---------------------------------------------------------------------------------
  deleteHeap: function (req, res) {
  return DICOMEnvelopeController.deleteHeap(req,res)
  }
};

//====================================== INTERNAL UTILITY FUNCTIONS ================================
