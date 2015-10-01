/**
 * Created by ebabkin on 11/29/14.
 */

//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');
require('./DICOMFactoryDictionary');

module.exports = {


  createEnvelope: function(objectID, userID, applicationID) {


    aEnvelope = {};

    aEnvelope.ObjectID = objectID;
     // use unique ID


    //setup application ID and user ID for the Envelope
    if ( ! applicationID ) { applicationID = sails.config.ifsw.default_param_applicationid; }
    aEnvelope.applicationID = applicationID;


    if ( ! userID ) { userID = sails.config.ifsw.default_param_userid; }
    aEnvelope.userID = userID;


    aEnvelope.isSemanticsExtracted = false;

    return aEnvelope;
  }

};

