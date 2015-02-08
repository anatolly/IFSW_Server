/**
 * DICOM_envelopeController
 *
 * @description :: Server-side logic for managing Dicom_envelopes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


// Reference the dicomParser module
//var dicomParser = require('.././dicomParser');
var dicomParser = require('../../externals/dicomParser');
var fs = require('fs');

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
      DICOMEnvelope.count().exec(function (err, foundAsLastUID) {

        if (err) {
          return res.json({error:" error in ORM"});
        }
        else {
          foundAsLastUID++;
          console.log("foundLastUID");
          console.log(foundAsLastUID);
          DICOMFactory.createDICOMEnvelope(foundAsLastUID.toString(), dataSet, function(aEnvelope) {
            CloudAPI.uploadFile(filePath, aEnvelope.DICOMObjectID, aEnvelope, function (err, file) {

              if (err)  return res.json({Error: 'Error text:' + err });

              console.log("FILE UPLOADED:"+ JSON.stringify(file));
              console.log("FILE UPLOADED METADATA:"+ JSON.stringify(file.metadata));
              res.statusCode = 200;
              return res.json({
                message: file.length + ' file(s) uploaded successfully!',
                files: file,
                envelope: aEnvelope
              });
            } )
          });

        }
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

      if (err)
      {
        return res.json({Error: 'Error text:' + err });
      }
      else {
        if (envelopes[0] != null) {

          console.log("ENVELOPE ID = " + envelopes[0].id);
          console.log("FILE NAME:"+ envelopes[0].DICOMObjectID);
         // res.contentType("application/octet-stream");
         // res.set("Content-Disposition", "attachment; filename=IFSW_DICOMObject_ID_" + envelopes[0].id + ".dcm");


         /* var ostream = CloudAPI.downloadFile(envelopes[0].DICOMObjectID,     function (err, file) {
              if(err)
              {
                console.log('Error during download of the file from the cloud. Error:'+ err);
                res.statusCode = 404;
                return res.send("!!!!!!!!!!!!!!!!!!!!! 404 error: " + err);

              }
              else
              {
                console.log("FILE OBJECT:");
                console.log(file);

                // check metadata
                console.log('Meta data of the downloaded file:'+ JSON.stringify(file.metadata));
                console.log('the downloaded file:'+ JSON.stringify(file));

                 res.contentType("application/octet-stream");
                 res.set("Content-Disposition", "attachment; filename=IFSW_DICOMObject_ID_" + envelopes[0].id + ".dcm");

                file.
                ostream.pipe(res);
              }

            }
          );
         */
          var ostream = CloudAPI.downloadFile(envelopes[0].DICOMObjectID);
          /*
           function doQuery(){
           var r = request(url)
           r.pause()
           r.on('response', function (resp) {
           if(resp.statusCode === 200){
           r.pipe(new WritableStream()) //pipe to where you want it to go
           r.resume()
           }else{
           setTimeout(doQuery,1000)
           }
           })
           }
           */
          ostream.pause();
          ostream.on('error', function (resp) {
            console.log("ON Error event");
            console.log(resp);
            return res.send(404, "No such file");
          });

          ostream.once('data', function (data_chunk) {
            console.log("ONCE Data event");
            var first_resp = data_chunk.toString();
            if (first_resp == "NoSuchKey") {
              console.log("No such key response from cloud storage");
              ostream.end();
              return res.send(404, "No such File");

            } else {
              res.contentType("application/octet-stream");
              res.set("Content-Disposition", "attachment; filename=IFSW_DICOMObject_ID_" + envelopes[0].id + ".dcm");
              res.write(data_chunk);
              ostream.pipe(res);
              ostream.resume();
            }
          });

          ostream.on('response', function (resp) {
            console.log("ON Response event");
            console.log(resp);
            return res.send(404, "No such file");
          });














        }
        else {
          console.log('Object was not found in ORM. ' + req.param('id'));
          res.statusCode = 404;
          return res.send("404 error: " );
        }

      }
    });
  },

  //------------------------------------------------------------------------------------------------
  delete: function (req, res ) {
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {
      if (err) {
        return res.json({Error: 'Error during delete in DICOMEnvelope:' + err });
      }
      else {
        if (envelopes[0] != null) {
          CloudAPI.deletefile(envelopes[0].DICOMObjectID, function (err, result) {
            if (err) {
              console.log('Error during delete the file from the cloud. Error:' + err);
              res.statusCode = 404;
              return res.send("!!!!!!!!!!!!!!!!!!!!! 404 error: " + err);
            }
            else {

              DICOMEnvelope.destroy(envelopes[0].id).exec(function (err) {
                if(err) {
                  console.log("Error delete of ORM isntance with id " + envelopes[0].id);
                  return res.json({Failure: "delete ORM instance"});
                }
                else {
                  console.log("delete sucessfull with id " + envelopes[0].id);
                  return res.json({Sucess: "delete file"});
                }


              }); //destroy ORM instance

            }

          });
        }
        else {
          console.log('Object was not found in ORM. ' + req.param('id'));
          res.statusCode = 404;
          return res.send("404 error: " );

        }

      }


    });
  }

};

