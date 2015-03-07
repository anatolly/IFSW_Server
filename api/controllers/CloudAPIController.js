/**
 * Created by ebabkin on 12/9/14.
 */

var S3_HOST_ADDRESS = 'http://192.168.17.145';


var STORAGE_PROVIDER_URL = sails.config.cloudStorageProviders.url;
var STORAGE_PROVIDER_LOGIN = sails.config.cloudStorageProviders.apiLogin ;
var STORAGE_PROVIDER_KEY = sails.config.cloudStorageProviders.apiKey;
var STORAGE_PROVIDER_CONTAINER = sails.config.cloudStorageProviders.container;


module.exports = {

  index: function (req,res){

    return res.view('CloudUploadFile', {title:"IFSW Storage Provider DEVELOPMENT UI CONSOLE" });

  },

  testS3: function  (req, res) {

    var client = CloudAPI.initS3Client( "H0RB6KZUKYKQCZ7IDTC4",
                                        "0oCODjamvzwb9CPTUtOvWJkYjLyXV9VfMtnjgOFY",
                                        S3_HOST_ADDRESS);


    client.getContainers(function (err, containers) {
      if (err) {
        sails.log("ERROR="+err);
        return res.json({error_text: "ERROR" + err});
      };

      //  var count =  containers[1].metadata.access ;
      //    if (count == null) {count = 1; } else {count = count + 0.1}
      // containers[1].metadata.access = count + "10.0" ;
      //   client.updateContainerMetadata(containers[1], function (err, c){});
      res.json({Containers: containers});
    });

  },

  test: function  (req, res) {

    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );
    client.getContainers(function (err, containers) {
        if (err) {
          sails.log("ERROR="+err);
          return res.json({error_text: "ERROR" + err});
        };

        var descr =  "";
      // res.json({info: "Available" + containers.length + " containers"});

      for(var i=0; i < containers.length; i++) {

      descr = containers[i].metadata.description;
      if (descr != undefined) {
        // current version doe snot support update. delete metadata frist
      }
      else
      {
        descr = 'Container for DICOM data';
      }
      containers[i].metadata.access = descr ;
      client.updateContainerMetadata(containers[i], function (err_u, c){

        if (err_u) {
          sails.log("ERROR="+err_u);
          return res.json({error_text: "ERROR" + err_u});
        }
        res.json({Containers_AFTER: c})});


    }



    });

  },

  createS3: function  (req, res) {

    var client = CloudAPI.initS3Client( "H0RB6KZUKYKQCZ7IDTC4",
      "0oCODjamvzwb9CPTUtOvWJkYjLyXV9VfMtnjgOFY",
      'http://192.168.17.145');


    client.getContainers(function (err, containers) {
      if (err) {
        sails.log("ERROR="+err);
        return res.json({error_text: "ERROR" + err});
      };

    //  client.createContainer({name: 'bucket---1', Key: 'key', Body: 'body'}, function (err, container){
    //  {
    //    if (err) {
    //      sails.log("ERROR="+err);
    //      return res.json({error_text: "ERROR" + err});
    //    }
    //    return res.json({Container: container});
    //  })
    //});

        client.s3.createBucket({Bucket: 'my-container/' }, function (err, container) {
          if (err) {
             sails.log("ERROR="+err);
             return res.json({error_text: "ERROR" + err});
           }
           return res.json({Container: container});
          })
        });

  },


  create: function  (req, res) {

    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );
    client.getContainers(function (err, containers) {
      if (err) {
        sails.log("ERROR="+err);
        return res.json({error_text: "ERROR" + err});
      };

      client.createContainer({name: STORAGE_PROVIDER_CONTAINER, metadata: {image:'DICOM', vol:234}}, function (err, container)
      {

        res.json({Container: container});
      })
    });


  },


  downloadS3: function (req, res) {
    // create a cloud client
    var client = CloudAPI.initS3Client("test:tester", "testing", "http://89.109.55.200:8080");

    res.setHeader('Content-disposition', 'attachment; filename=test.dcm')

    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    client.download({
      container: 'my-container',
      remote: '/Users/babkin/WebstormProjects/IFSW_Server/.tmp/uploads/c32ec5c0-b111-475c-9450-bda863eaa4fa.dcm'
    }).pipe(res);
  },




  download: function (req, res) {
    // create a cloud client
    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );

    res.setHeader('Content-disposition', 'attachment; filename=test.dcm')

    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    client.download({
      container: 'my-container',
      remote: '/Users/babkin/WebstormProjects/IFSW_Server/.tmp/uploads/c32ec5c0-b111-475c-9450-bda863eaa4fa.dcm'
    }).pipe(res);
  },


  pipeuploadS3_succeded: function  (req, res) {

    // as in http://stackoverflow.com/questions/24069203/skipper-in-sailsjs-beta-image-resize-before-upload
    var Writable = require('stream').Writable;


    // create a cloud client
    var client = CloudAPI.initS3Client( "H0RB6KZUKYKQCZ7IDTC4",
      "0oCODjamvzwb9CPTUtOvWJkYjLyXV9VfMtnjgOFY",
      S3_HOST_ADDRESS);

    //stream file to the predefined container
    var writeStream = client.upload({ container: 'my-container11111111/', remote: 'remote-file-name.txt'});

    // pipe the  data directly to the cloud provide
    var readStream = req.file('dicom_file');

    writeStream.on('error', function(err)
    {
      // handle your error case
      return res.json({Error: 'Error text:' + err });
    });

    writeStream.on('success', function(file)
    {
      // success, file will be a File model
      return res.json({SUCCESS: 'File details:' + file });
    });

    // Let's create a custom receiver
    var receiver = new Writable({objectMode: true});
    receiver._write = function(file, enc, cb) {
      file.pipe(writeStream);

      cb();
    };

    req.file('dicom_file').upload(receiver, function(err, files){
      // File is now  uploaded to cloud storage
    });

  },



  pipeupload_succeded: function  (req, res) {

    // as in http://stackoverflow.com/questions/24069203/skipper-in-sailsjs-beta-image-resize-before-upload
    var Writable = require('stream').Writable;


    // create a cloud client
    var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );

    //stream file to the predefined container
    var writeStream = client.upload({ container: 'my-container', remote: 'remote-file-name.txt'});

    // pipe the  data directly to the cloud provide
    var readStream = req.file('dicom_file');

    writeStream.on('error', function(err)
    {
      // handle your error case
      return res.json({Error: 'Error text:' + err });
    });

    writeStream.on('success', function(file)
    {
      // success, file will be a File model
      return res.json({SUCCESS: 'File details:' + file });
    });

    // Let's create a custom receiver
    var receiver = new Writable({objectMode: true});
    receiver._write = function(file, enc, cb) {
      file.pipe(writeStream);

      cb();
    };

    req.file('dicom_file').upload(receiver, function(err, files){
      // File is now  uploaded to cloud storage
    });

    },


  pipeupload_objectmode: function  (req, res) {

    var stream = require('stream');
    var util = require('util');
    //as in http://stackoverflow.com/questions/21124701/creating-a-node-js-readable-stream-from-a-javascript-object-the-simplest-possi

    function StringifyStream(){
      stream.Transform.call(this);

      this._readableState.objectMode = false;
      this._writableState.objectMode = true;
    }
    util.inherits(StringifyStream, stream.Transform);

    StringifyStream.prototype._transform = function(obj, encoding, cb){
      this.push(JSON.stringify(obj));
      this.push(JSON.stringify(obj));

      cb();
    };



    // as in  http://stackoverflow.com/questions/14726052/what-streams-and-pipe-capable-means-in-pkgcloud-in-nodejs

      // create a cloud client
      var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );

       //stream file to the predefined container
    var writeStream = client.upload({ container: 'my-container', remote: 'remote-file-name.txt'});

    // pipe the  data directly to the cloud provide
    var readStream = req.file('dicom_file');

    writeStream.on('error', function(err)
    {
      // handle your error case
      return res.json({Error: 'Error text:' + err });
    });

    writeStream.on('success', function(file)
    {
      // success, file will be a File model
      return res.json({SUCCESS: 'File details:' + file });
    });


    var rs = new stream.Readable({ objectMode: true });
    rs.push(readStream._files);
    rs.push(null);

  //   readStream.pipe(writeStream);
    rs.pipe(new StringifyStream()).pipe(writeStream);
  },


  upload: function  (req, res) {
    req.file('dicom_file').upload(function (err, files) {
      if (err)
        return res.serverError(err);


      var fs = require('fs');

      var filePath =  files[0].fd; //   'ctimage.dcm';


      // create a cloud client
      var client = CloudAPI.initClient(STORAGE_PROVIDER_LOGIN, STORAGE_PROVIDER_KEY,STORAGE_PROVIDER_URL );

      //save local file to the predefined container
     // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

      var readStream = fs.createReadStream(filePath);
      var writeStream = client.upload({ container: 'my-container', remote: 'remote-file-name.txt'});

      writeStream.on('error', function(err)
      {
        // handle your error case
        return res.json({Error: 'Error text:' + err });
      });

      writeStream.on('success', function(file)
      {
        // success, file will be a File model
        return res.json({SUCCESS: 'File details:' + file });
      });


      readStream.pipe(writeStream);

      });
  },


  uploadS3: function  (req, res) {
    req.file('dicom_file').upload(function (err, files) {
      if (err)
        return res.serverError(err);


      var fs = require('fs');

      var filePath =  files[0].fd; //   'ctimage.dcm';


      // create a cloud client
      var client = CloudAPI.initS3Client( "H0RB6KZUKYKQCZ7IDTC4",
        "0oCODjamvzwb9CPTUtOvWJkYjLyXV9VfMtnjgOFY",
        S3_HOST_ADDRESS);


      //save local file to the predefined container
      // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

      var readStream = fs.createReadStream(filePath);
      var writeStream = client.upload({ container: 'my-container', remote: 'remote-file-name.txt'});

      writeStream.on('error', function(err)
      {
        // handle your error case
        return res.json({Error: 'Error text:' + err });
      });

      writeStream.on('success', function(file)
      {
        // success, file will be a File model
        return res.json({SUCCESS: 'File details:' + file });
      });


      readStream.pipe(writeStream);

    });
  }



};
