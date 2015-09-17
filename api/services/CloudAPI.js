/**
 * Created by ebabkin on 12/9/14.
 */


//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');

var fs = require('fs');

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
      console.log("Cloud client error:"+ JSON.stringify(err,null,2));
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
