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
      {
        sails.log.error('file upload Sailor Error :' + err);
        return res.serverError(err);
      }


 // This code reads a DICOM P10 file from disk and creates a UInt8Array from it
      var fs = require('fs');

      var filePath =  files[0].fd; //   'ctimage.dcm';
      var dicomFileAsBuffer = fs.readFileSync(filePath);
      var dicomFileAsByteArray = new Uint8Array(dicomFileAsBuffer);

      // Now that we have the Uint8array, parse it and extract the patient name
      var dataSet = dicomParser.parseDicom(dicomFileAsByteArray);
      //var patientName = dataSet.string('x00100020');
      //sails.log('Patient Name = '+ patientName);

      // generate DICOMObjectID
      var uniqueDICOMObjectID = createUUID();

        //check uniqueness
//        DICOMEnvelope.find({where:{'DICOMObjectID': {'=': uniqueDICOMObjectID } }, limit: 1}, function (err, envelopes) {
        DICOMEnvelope.find({"DICOMObjectID": uniqueDICOMObjectID }, function (err, envelopes) {

            if (err) {
            sails.log.error("Error: Error during check DICOMEnvelope");
          }

          if (envelopes != null ) {
            // generate UUID once more
            uniqueDICOMObjectID = createUUID();
          }

          //          DICOMFactory.createDICOMEnvelope(foundAsLastUID.toString(), dataSet, function(aEnvelope) {
          try {
            DICOMFactory.createDICOMEnvelope(uniqueDICOMObjectID.toString(), dataSet, req.session.user, function (aEnvelope) {
              try {
                CloudAPI.uploadFile(filePath, aEnvelope.DICOMObjectID, aEnvelope, function (err, file) {

                  if (err) {

                    sails.log.error('Cloud API Error :' + err);
                    return res.json({Error: 'Error text:' + err});
                  }

                  sails.log("FILE UPLOADED:" + JSON.stringify(file));
                  sails.log("FILE UPLOADED METADATA:" + JSON.stringify(file.metadata));
                  res.statusCode = 200;
                  return res.json({
                    message: 'File uploaded successfully!',
                    files: file,
                    envelope: aEnvelope
                  });
                })
              }
              catch (e) {
                sails.error.log("Exception during upload file" + e);
              }
            });
          }
          catch (e) { sails.error.log("Exception during evelope"+e)};
        });
    });
  },

  /*
  find: function (req, res) {
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {

      return res.json({
        envelopes: JSON.stringify(envelopes)
      });

    });
  },
*/

  download: function (req, res) {
    //TODO Add userID and applicationID to the search conditions in find to restrict access
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {

      if (err)
      {
        return res.json({Error: 'Error text:' + err });
      }
      else {
        if (envelopes[0] != null) {

          sails.log("ENVELOPE ID = " + envelopes[0].id);
          sails.log("FILE NAME:"+ envelopes[0].DICOMObjectID);
         // res.contentType("application/octet-stream");
         // res.set("Content-Disposition", "attachment; filename=IFSW_DICOMObject_ID_" + envelopes[0].id + ".dcm");


         /* var ostream = CloudAPI.downloadFile(envelopes[0].DICOMObjectID,     function (err, file) {
              if(err)
              {
                sails.log('Error during download of the file from the cloud. Error:'+ err);
                res.statusCode = 404;
                return res.send("!!!!!!!!!!!!!!!!!!!!! 404 error: " + err);

              }
              else
              {
                sails.log("FILE OBJECT:");
                sails.log(file);

                // check metadata
                sails.log('Meta data of the downloaded file:'+ JSON.stringify(file.metadata));
                sails.log('the downloaded file:'+ JSON.stringify(file));

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
            sails.log("ON Error event");
            sails.log(resp);
            return res.send(404, "No such file");
          });

          ostream.once('data', function (data_chunk) {
            sails.log("ONCE Data event");
            var first_resp = data_chunk.toString();
            if (first_resp == "NoSuchKey") {
              sails.log("No such key response from cloud storage");
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
            sails.log("ON Response event");
            sails.log(resp);
            return res.send(404, "No such file");
          });
        }
        else {
          sails.log('Object was not found in ORM. ' + req.param('id'));
          res.statusCode = 404;
          return res.send("404 error: " );
        }

      }
    });
  },

  //------------------------------------------------------------------------------------------------
  delete: function (req, res ) {
    //TODO Add userID and applicationID to the search conditions in find to restrict access
    DICOMEnvelope.find(req.params.all(), function (err, envelopes) {
      if (err) {
        return res.json({Error: 'Error during delete in DICOMEnvelope:' + err });
      }
      else {
        if (envelopes[0] != null) {
          _deleteObjectFromStorage(envelopes[0], function (result) {
            if(result != null){
              res.statusCode = result.statusCode;
              return res.json(result.result);
            }
          } );
        }
        else {
          sails.log('Object was not found in ORM. ' + req.param('id'));
          res.statusCode = 404;
          return res.send("404 error: " );
        }
      }


    });
  },

  //---------------------------------------------------------------------------------
  deleteHeap: function (req, res) {
    var d = new Date(req.param('y'),req.param('mo')-1,req.param('d'),req.param('h'),req.param('mi'),req.param('s'));
    //TODO Add userID and applicationID to the search conditions in find to restrict access
    DICOMEnvelope.find({where:{'createdAt': {'<': d } }, limit: req.param('limit'), sort: 'createdAt ASC'}, function (err, envelopes) {
      if (err) {
        return res.json({Error: 'Error during Massive Delete HEAP in DICOMEnvelope:' + err });
      }

      else {

        var completed = 0;
        var max_status_code = 0;


        for(var i=0; i < envelopes.length; i++) {
          sails.log("Envelope["+i+"]");
          sails.log(envelopes[i]);

          if (envelopes[i] != null) {

            _deleteObjectFromStorage(envelopes[i], function (result) {

             if(result != null){
                //res.statusCode = result.statusCode;
                buffer = "\n" + result.result;
                res.write(result.result);
                if (max_status_code < result.statusCode) {max_status_code = result.statusCode; }
                completed++;

                if (completed == envelopes.length) {
                  res.statusCode = max_status_code;
                  res.end();
                }
               }
            } );
          }
          else {
            sails.log('Object was not found in ORM. ' + req.param('id'));
            res.statusCode = 404;
            return res.send("404 error: " );
          }
       }
        if (envelopes.length == 0) {
          res.statusCode = 404;
          return res.send("No entries found");
        }
      }
    })
  }

};

//====================================== INTERNAL UTILITY FUNCTIONS ================================

function _deleteObjectFromStorage (envelope, cb) {
  CloudAPI.deletefile(envelope.DICOMObjectID, function (err, result) {
    if (err) {
      sails.log('Error during delete the file from the cloud. Error:' + err);
      cb({statusCode: 404, result: "Envelope ID:" + envelope.id +" !!!!!!!!!!!!!!!!!!!!! 404 error: " + err });
    }
    else {

      DICOMEnvelope.destroy(envelope.id).exec(function (err) {
        if (err) {
          sails.log("Error delete of ORM isntance with id " + envelope.id);
          cb({statusCode: 500, result: "Failure: delete ORM instance" });
        }
        else {
          sails.log("delete sucessfull with id " + envelope.id);
          cb({statusCode: 200, result: "Sucess: delete file "});
        }
      }); //destroy ORM instance
    }
  });
}


//---------------------------------------------
// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript

function createUUID() {
  // http://www.ietf.org/rfc/rfc4122.txt
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}
