/**
 * Created by ebabkin on 12/9/14.
 */


//var dicomFactoryDictionary = require('./DICOMFactoryDictionary');

var fs = require('fs');

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
