/**
 * Created by ebabkin on 11/29/14.
 */

//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');
require('./DICOMFactoryDictionary');


module.exports = {

  // dicomRawData - dicom parser dataSet is assumed as input parameter
  createDICOMEnvelope: function(dicomObjectID, dicomRawData, cb) {

    function getTag(tag) {
      var group = tag.substring(1, 5);
      var element = tag.substring(5, 9);
      var tagIndex = ("(" + group + "," + element + ")").toUpperCase();
      var attr = DICOM_TAG_DICT[tagIndex];
      return attr;
    }


// create empty DICOM Envelope object
//    DICOMEnvelope.create().done(function (err, aEnvelope) {
    aEnvelope = {};
    unknownDICOMDistonaryAttributes = {};
    unknownIFSWAttributes = {};

    // iterate over elements of dicomRawData and initialize properties of the DICOM Envelope
    // the dataSet.elements object contains properties for each element parsed. The name of the property
    // is based on the elements tag and looks like 'xGGGGEEEE' where GGGG is the group number and EEEE is the
    // element number both with lowercase hexadecimal letters. For example, the Series Description DICOM element 0008,103E would
    // be named 'x0008103e'. Here we iterate over each property (element) so we can build a string describing its
    // contents to add to the output array


    for (var propertyName in dicomRawData.elements) {
      var element = dicomRawData.elements[propertyName];
      var tag = getTag(element.tag);
// The output string begins with the element name (or tag if not in data dictionary), length and VR (if present). VR is undefined for
// implicit transfer syntaxes

      if (tag === undefined) {
      //resolve the problem with undefined TAG in the dictionary
      // add info to the corresponding hash
        unknownDICOMDistonaryAttributes[propertyName]= dicomRawData.string(propertyName);
        console.log("DICOM DICTONARY WARNING: unknown attribute " + propertyName);
      }
      else {
        // tag was found

        if(DICOMEnvelope._attributes[tag.name] === undefined) {
          //resolve the problem of mismatch between DICOMEnvelope model spec and Dictionary table
          // add info to the corresponding hash
          unknownIFSWAttributes[propertyName]= dicomRawData.string(propertyName);
          console.log("IFSW WARNING: unknown attribute " + propertyName);
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

    DICOMEnvelope.create(aEnvelope, function (err, aEnvelope) {
      if(err) {
        //TODO implement error handling
        return;
      }

      return cb(aEnvelope);
    });
  }


};

