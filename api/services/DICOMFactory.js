/**
 * Created by ebabkin on 11/29/14.
 */

//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');
require('./DICOMFactoryDictionary');

module.exports = {

  /**
    @dicomRawData - dicom parser dataSet is assumed as input parameter
  */
  createDICOMEnvelope: function(dicomObjectID, dicomRawData, userID, cb) {

    function getTag(tag) {
      var group = tag.substring(1, 5);
      var element = tag.substring(5, 9);
      var tagIndex = ("(" + group + "," + element + ")").toUpperCase();
      var attr = DICOM_TAG_DICT[tagIndex];
      return attr;
    }

    aEnvelope = {};
    unknownDICOMDistonaryAttributes = {};
    unknownIFSWAttributes = {};




    for (var propertyName in dicomRawData.elements) {
      var element = dicomRawData.elements[propertyName];
      var tag = getTag(element.tag);

      if (tag === undefined) {
        //resolve the problem with undefined TAG in the dictionary
        // add info to the corresponding hash
        unknownDICOMDistonaryAttributes[propertyName]= dicomRawData.string(propertyName);
        sails.log("DICOM DICTONARY WARNING: unknown attribute " + propertyName);
      }
      else {
        // tag was found

        if(DICOMEnvelope._attributes[tag.name] === undefined) {
          //resolve the problem of mismatch between DICOMEnvelope model spec and Dictionary table
          // add info to the corresponding hash
          unknownIFSWAttributes[propertyName]= dicomRawData.string(propertyName);
          sails.log("IFSW WARNING: unknown attribute " + propertyName);
        }
        else {
          // correspondence between the model and the dictionary is assured
          // TODO implement type checking of property
          aEnvelope[tag.name] = dicomRawData.string(propertyName);
        }
      }
    }

    aEnvelope.unknownDICOMDictionaryAttributes = JSON.stringify(unknownDICOMDistonaryAttributes);
    aEnvelope.unknownIFSWAttributes = JSON.stringify(unknownIFSWAttributes);


 aEnvelope.DICOMObjectID = dicomObjectID;
// use unique ID


    //setup aapplication ID and user ID for the Envelope
    aEnvelope.applicationID =  sails.config.ifsw.application_name;
    if ( ! userID ) { userID = sails.config.ifsw.default_param_userid; }
    aEnvelope.userID = userID;

    DICOMEnvelope.create(aEnvelope, function (err, aEnvelope) {
      if(err) {
        //TODO implement error handling
        sails.log("Error during creating ORM Envelope");
        return;
      }

      // make the second save with unique ID
      /*aEnvelope.DICOMObjectID = aEnvelope.id ;
      aEnvelope.save(function (err, inst){
                      if(err) {
                        sails.log("Error during second save of ORM");
                        return;
                      }
      });*/

      return cb(aEnvelope);
    });
  }

};

