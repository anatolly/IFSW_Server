/**
 * Created by ebabkin on 12/9/14.
 */


//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');

var fs = require('fs');

//var   AWS = require('aws-sdk');
//var proxy = require('proxy-agent');

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
      accessKeyId: 'H0RB6KZUKYKQCZ7IDTC4', // access key
      accessKey: '0oCODjamvzwb9CPTUtOvWJkYjLyXV9VfMtnjgOFY', // secret key
      // as it was given in http://www.cloudvps.com/community/knowledge-base/pkgcloud-library-for-nodejs/
      serversUrl: '192.168.17.145',
      protocol: 'http',
      region: 'us-west-2' // region
       };

    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    var client = require('pkgcloud').storage.createClient(options);



  //  AWS.config.update({
  //    httpOptions: { agent: proxy('http://192.168.17.145:80') }
  //  });

   // AWS.config.update({accessKeyId: 'akid', secretAccessKey: 'secret'});

    return client;

  },





  uploadFile: function (filepath, filename, cb) {

    // create a cloud client
    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");

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
      cb(null, file);
    });

    readStream.pipe(writeStream);
  },

  downloadFile: function ( filename, res) {

    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");


    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    client.download({
      container: 'my-container',
      remote: filename
    }).pipe(res);
  }


};
