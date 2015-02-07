/**
 * Created by ebabkin on 12/9/14.
 */


//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');

var fs = require('fs');

var   AWS = require('aws-sdk');
var proxy = require('proxy-agent');

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
    var client = CloudAPI.initClient("test:tester", "testing", "http://192.168.17.111:8080");//http://89.109.55.200:8080");

    //save local file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    var readStream = fs.createReadStream(filepath);
    var writeStream = client.upload({ container: 'my-container', remote: filename});

    writeStream.on('error', function(err)
    {
      // handle your error case
      cb(err, null);
    });

    writeStream.on('success', function(file)
    {
      // success, file will be a File model
      // write metadata to the cloud
     // file.metadata = {test : 'aaaa'}; //JSON.stringify(metadata);

      file.metadata = {studyDescription: metadata.StudyDescription,
                        patientID: metadata.PatientID,
                        all_1: new Buffer(JSON.stringify(metadata)).toString('base64').substr(0,250),
                        all_2: new Buffer(JSON.stringify(metadata)).toString('base64').substr(251,250),
                        all_3: new Buffer(JSON.stringify(metadata)).toString('base64').substr(502,250),
                        all_4: new Buffer(JSON.stringify(metadata)).toString('base64').substr(753,250),
                        all_5: new Buffer(JSON.stringify(metadata)).toString('base64').substr(904,250)

      };

      console.log('updated file:'+JSON.stringify(file));
      console.log('updated file metadata:'+JSON.stringify(file.metadata));


      client.updateFileMetadata(file.container, file, cb );

      //console.log(file);
      //cb(null, file);

    });

    readStream.pipe(writeStream);
  },

  downloadFile: function ( filename, cb) {

    var client = CloudAPI.initClient("test:tester", "testing", "http://192.168.17.111:8080"); //http://89.109.55.200:8080");

    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    client.download({
      container: 'my-container',
      remote: filename }, cb);

    //); //.pipe(result);

    //res.on('error', function(err) {
    //  // handle your error case
    //  console.log('Error during download of the file from the cloud. Error:'+ err);
    //  res.status(404);
    //  return res;
    //});
    //
    //res.on('success', function(file) {
    //  console.log('Meta data of the downloaded file:'+ JSON.stringify(file.metadata));
    //  console.log('the downloaded file:'+ JSON.stringify(file));
    //});

  },

  deletefile: function (filename, cb) {

    var client = CloudAPI.initClient("test:tester", "testing", "http://192.168.17.111:8080");

    client.removeFile("my-container", filename , cb);



  }


};
