/**
 * DICOM_envelopeController
 *
 * @description :: Server-side logic for managing Dicom_envelopes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


// Reference the dicomParser module
var dicomParser = require('../../ext/dicomParser');

module.exports =
{
 //TODO redesign upload method to avoid saving the local file (parse it as a stream ! )
  upload: function  (req, res) {
    req.file('dicom_file').upload(function (err, files) {
      if (err)
        return res.serverError(err);

 // This code reads a DICOM P10 file from disk and creates a UInt8Array from it
      var fs = require('fs');

      var filePath =  files[0].fd; //   'ctimage.dcm';
      var dicomFileAsBuffer = fs.readFileSync(filePath);
      var dicomFileAsByteArray = new Uint8Array(dicomFileAsBuffer);

      // Now that we have the Uint8array, parse it and extract the patient name
      var dataSet = dicomParser.parseDicom(dicomFileAsByteArray);
      //var patientName = dataSet.string('x00100020');
      //console.log('Patient Name = '+ patientName);
      DICOMFactory.createDICOMEnvelope(filePath, dataSet, function(aEnvelope) {

        return res.json({
          message: files.length + ' file(s) uploaded successfully!',
          files: files,
          envelope: JSON.stringify(aEnvelope)
        });

      });

    });
  },

  find: function (req, res) {
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {

      return res.json({
        envelopes: JSON.stringify(envelopes)
      });

    });
  },

  download: function (req, res) {
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {


      var fs = require('fs');
      var filePath =  envelopes[0].DICOMObjectID; //   'ctimage.dcm';
      fs.readFile(filePath, function(err, data) {
        res.contentType("application/octet-stream");
        res.set("Content-Disposition","attachment; filename=IFSW_DICOMObject_ID_" + envelopes[0].id +".dcm");
        return res.send(data);
        });
      });
  }

};

