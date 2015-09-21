/**
 * Created by ebabkin on 11/29/14.
 */

//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');
require('./DICOMFactoryDictionary');

module.exports = {


  createEnvelope: function(objectID, userID) {


    aEnvelope = {};

    aEnvelope.ObjectID = objectID;
     // use unique ID


    //setup aapplication ID and user ID for the Envelope
    aEnvelope.applicationID =  sails.config.ifsw.application_name;
    if ( ! userID ) { userID = sails.config.ifsw.default_param_userid; }
    aEnvelope.userID = userID;
    aEnvelope.isSemanticsExtracted = false;

    return aEnvelope;
  }

};

