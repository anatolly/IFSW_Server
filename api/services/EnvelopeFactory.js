/**
 * Created by ebabkin on 11/29/14.
 */

//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');
require('./DICOMFactoryDictionary');

module.exports = {

  /**
    @dicomRawData - dicom parser dataSet is assumed as input parameter
  */
  createEnvelope: function(objectID, userID, cb) {


    aEnvelope = {};

    aEnvelope.ObjectID = objectID;
     // use unique ID


    //setup aapplication ID and user ID for the Envelope
    aEnvelope.applicationID =  sails.config.ifsw.application_name;
    if ( ! userID ) { userID = sails.config.ifsw.default_param_userid; }
    aEnvelope.userID = userID;

    Envelope.create(aEnvelope, function (err, aEnvelope) {
      if(err) {
        //TODO implement error handling
        sails.log("Error during creating ORM Generic Envelope");
        return;
      }

      return cb(aEnvelope);
    });
  }

};

