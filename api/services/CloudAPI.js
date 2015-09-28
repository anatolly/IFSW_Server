/**
 * Created by ebabkin on 12/9/14.
 */


//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');

var fs      = require('fs');
var MimeDetectorStream = require('./MimeDetectorStream');
var Writable = require('stream').Writable;

var   AWS = require('aws-sdk');
// var proxy = require('proxy-agent');

var STORAGE_PROVIDER_URL = sails.config.cloudStorageProviders.url;
var STORAGE_PROVIDER_LOGIN = sails.config.cloudStorageProviders.apiLogin ;
var STORAGE_PROVIDER_KEY = sails.config.cloudStorageProviders.apiKey;
var STORAGE_PROVIDER_CONTAINER = sails.config.cloudStorageProviders.container;

module.exports = {

  initClient: function (a_username, a_passwd, a_service_url) {
    var containers = {};
    var client = require('pkgcloud').storage.createClient({
      provider: 'openstack', // required
      username: a_username, // required
      password: a_passwd, // required
      authUrl: a_service_url, // required
      version: 1, // required for v.1,0 SWIFT Auth API, as it was made in pkgcloud issue#311
      useServiceCatalog: false
    });


    client.on('error', function (err) {
      sails.log.error("CloudAPI", "Cloud client error:", JSON.stringify(err,null,2));
    });

    return client;

  },

  initS3Client: function (a_username, a_passwd, a_service_url) {
    var containers = {};
    var options = {
      provider: 'amazon',
      accessKeyId: a_username,// access key
      accessKey: a_passwd // secret key
      // region: 'us-west-4'
      // we do not need a proxy-server as it was given in http://www.cloudvps.com/community/knowledge-base/pkgcloud-library-for-nodejs/
      // PROXY SETTINGS -- serversUrl: '192.168.17.145',
      // PROXY SETTINGS -- protocol: 'http',
      // PROXY SETTINGS -- region: 'us-west-2' // region
      , s3ForcePathStyle: true
       };
    AWS.config.update({s3ForcePathStyle: true});

    // we do not modify HTTPS settings of node js yet -- process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    var client = require('pkgcloud').storage.createClient(options);
    // configure properly S3 endpoint to access the own S3-based service.
    client.s3.endpoint = new AWS.Endpoint('http://ceph-objgw');
    AWS.config.update({s3ForcePathStyle: true});


    return client;

  },

//----------------------------------------------------------------------------------------------------------------------
  uploadEnvelopeContent: function(read_stream, aEnvelope, cb1) {

    var filenameFromClient;
    var sizefileFromClient;
    var mimeFromClient;

    // create a cloud client
    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );


    // first, check availability of the CloudProvider and presence of needed container
    client.getContainers(function(err, data) {
        if (err) {
          sails.log.error("CloudAPI", "ERROR of uploadEnvelopeContent in getContainers:", JSON.stringify(err,null,2));
          cb(err,null);

        }
        else if (neededContainerExists(data)) {

          //actually parameter size is not used because we use Encoding: Chunked
          var writeStream = client.upload({ container: STORAGE_PROVIDER_CONTAINER, remote: aEnvelope.ObjectID, size: 0});


          // register event handlers for input and output streams
          writeStream.on('error', function(err)
          {
            sails.log.error("CloudAPI"," ERROR in writestream:", JSON.stringify(err,null,2));
            cb1(err, null);
          });

          read_stream.on('error', function (d) {
            sails.log.error("CloudAPI", "ERROR in readstream:", JSON.stringify(d, null, 2));
            cb1(err, null);
          });

          // create MimeDetector Transform Stream
          var mime = MimeDetectorStream({highWaterMark:512});


          // mime.on('error', function(err){console.log("ERROR IN MIME:"+err)});

          // define processing logic for the end of streaming
          // success, file will be a pkgCloud File model
          // so, we can write metadata to the cloud
          writeStream.on('success', function (fileModel) {
            if(mime.mime_known)
            {
              sails.log.debug("CloudAPI", "Mime IN Success:" + mime.getMimeType());
              //update envelope
              aEnvelope.MimeType = mime.getMimeType();
              aEnvelope.size = mime.getSize();
              aEnvelope.filename = filenameFromClient;
              aEnvelope.claimedMimeType = mimeFromClient;
              aEnvelope.claimedSize = sizefileFromClient;

              // Add metadata to the cloud object, including logged userID and current application ID for uniqueness
              // Assume metadata object is Envelope

              //file.metadata = { userID: metadata.userID, applicationID: metadata.applicationID,
              //  studyDescription: metadata.StudyDescription,
              //  patientID: metadata.PatientID
              //};
              fileModel.metadata = aEnvelope;
              client.updateFileMetadata(fileModel.container, fileModel, cb1 );
            }
            else
            {

              // wait until next 500 ms and check
              var count = 0;
              var intervalId = setInterval( function() {
                if (mime.mime_known)
                {
                  clearInterval(intervalId);
                  aEnvelope.MimeType = mime.getMimeType();
                  aEnvelope.size = mime.getSize();
                  aEnvelope.filename = filenameFromClient;
                  aEnvelope.claimedMimeType = mimeFromClient;
                  aEnvelope.claimedSize = sizefileFromClient;

                  //cb1(null,aEnvelope);
                  fileModel.metadata = aEnvelope;
                  client.updateFileMetadata(fileModel.container, fileModel, cb1 );
                }

                if (count > 3) {
                  clearInterval(intervalId);
                  sails.log.debug("CloudAPI","MIME Is Still Unknown");
                  fileModel.metadata = aEnvelope;
                  client.updateFileMetadata(fileModel.container, fileModel, cb1 );
                  // cb1(null,aEnvelope);
                }
                count++;

              }, 500);
            }
          });


         //  mime.pipe(writeStream);

          // Let's create a custom receiver
          var receiver = new Writable({objectMode: true});
          receiver._write = function(skiper_stream, enc, cb) {

            //pipe the streams together
            skiper_stream.pipe(mime).pipe(writeStream);
            cb();
          };

          read_stream.upload(receiver, function(err, files){
            // Too early - that is just end of the sequence
            filenameFromClient = files[0].filename;
            sails.log.debug("CloudAPI","uploadEnvelopeContent","filenameFromClient:",filenameFromClient);
            sizefileFromClient = files[0].size;
            mimeFromClient = files[0].type;

          });

        }
        else {
          sails.log.error("CloudAPI", "ERROR of uploadEnvelopeContent in getContainers: No Needed Container : ", STORAGE_PROVIDER_CONTAINER);
          cb({"error":'no container'},null);
        }

    });

  },

//----------------------------------------------------------------------------------------------------------------------
// @Depricated
  uploadFile: function (filepath, filename, metadata, cb) {

    // create a cloud client
    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );//http://89.109.55.200:8080");

    //save local file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage


    client.getContainers(function(err, data) {

      if (err) {
      console.log("ERROR in getContainers:"+ JSON.stringify(err,null,2));
        cb(err,null);

      }
      else {

        var readStream = fs.createReadStream(filepath);
        var stats = fs.statSync(filepath);
        var fileSizeInBytes = stats["size"];

        //actually parameter size is not used because we use Encoding: Chunked
        var writeStream = client.upload({ container: STORAGE_PROVIDER_CONTAINER, remote: filename, size: 0});

        writeStream.on('error', function(err)
        {
          // handle your error case
          console.log("ERROR in writestream:"+ JSON.stringify(err,null,2));

          cb(err, null);
        });

        readStream.on('error', function (d) {
          console.log("ERROR in readstream:" + JSON.stringify(d,null,2));
        });

        writeStream.on('success', function(file)
        {
          // success, file will be a File model
          // write metadata to the cloud
          // file.metadata = {test : 'aaaa'}; //JSON.stringify(metadata);

          // Add metadata to the cloud object, including logged userID and current application ID for uniqueness
          // Assume metadata object is DICOMEnvelope
          file.metadata = { userID: metadata.userID, applicationID: metadata.applicationID,
            studyDescription: metadata.StudyDescription,
            patientID: metadata.PatientID,
            all_1: new Buffer(JSON.stringify(metadata)).toString('base64').substr(0,250),
            all_2: new Buffer(JSON.stringify(metadata)).toString('base64').substr(251,250),
            all_3: new Buffer(JSON.stringify(metadata)).toString('base64').substr(502,250),
            all_4: new Buffer(JSON.stringify(metadata)).toString('base64').substr(753,250),
            all_5: new Buffer(JSON.stringify(metadata)).toString('base64').substr(904,250)

          };

          sails.log('updated file:'+JSON.stringify(file));
          sails.log('updated file metadata:'+JSON.stringify(file.metadata));


          client.updateFileMetadata(file.container, file, cb );

          //sails.log(file);
          //cb(null, file);

        });

        readStream.pipe(writeStream).on('error', function (err) { sails.log.error("ERROR IN PIPING STREAMS:"+ JSON.stringify(err,null,2))});
      }

    });

  },
//-----------------------------------------------------------------------------------------------------------------------
  downloadFile: function ( filename, cb) {

    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL ); //http://89.109.55.200:8080");

    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    return client.download({
      container: STORAGE_PROVIDER_CONTAINER,
      remote: filename }, cb);

    //); //.pipe(result);

    //res.on('error', function(err) {
    //  // handle your error case
    //  sails.log('Error during download of the file from the cloud. Error:'+ err);
    //  res.status(404);
    //  return res;
    //});
    //
    //res.on('success', function(file) {
    //  sails.log('Meta data of the downloaded file:'+ JSON.stringify(file.metadata));
    //  sails.log('the downloaded file:'+ JSON.stringify(file));
    //});

  },

  deletefile: function (filename, cb) {

    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );

    client.removeFile(STORAGE_PROVIDER_CONTAINER, filename , cb);



  }

};
//--------------------------------------------------------------------------------------------------------------------

//====================================== INTERNAL UTILITY FUNCTIONS ==================================================
function neededContainerExists(containersList)
{
  for(var i=0; i < containersList.length; i++) {

    if (containersList[i].name == STORAGE_PROVIDER_CONTAINER ) return true;
  }

return false;


  }



//--------------------------------------------------------------------------------------------------------------------
