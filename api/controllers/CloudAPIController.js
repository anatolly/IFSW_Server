/**
 * Created by ebabkin on 12/9/14.
 */


module.exports = {

  index: function (req,res){

    return res.view('CloudUploadFile', {title:"IFSW Storage Provider DEVELOPMENT UI CONSOLE" });

  },



  test: function  (req, res) {

    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");
    client.getContainers(function (err, containers) {
        if (err) {
          console.log("ERROR="+err);
          return res.json({error_text: "ERROR" + err});
        };

      //  var count =  containers[1].metadata.access ;
     //    if (count == null) {count = 1; } else {count = count + 0.1}
     // containers[1].metadata.access = count + "10.0" ;
     //   client.updateContainerMetadata(containers[1], function (err, c){});
        res.json({Containers: containers});
    });

  },

  create: function  (req, res) {

    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");
    client.getContainers(function (err, containers) {
      if (err) {
        console.log("ERROR="+err);
        return res.json({error_text: "ERROR" + err});
      };

      client.createContainer({name:"my-container", metadata: {image:'DICOM', vol:234}}, function (err, container)
      {

        res.json({Container: container});
      })
    });


  },


  download: function (req, res) {
    // create a cloud client
    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");

    res.setHeader('Content-disposition', 'attachment; filename=test.jpg')

    //download a remote file to the predefined container
    // following the guidelines from https://github.com/pkgcloud/pkgcloud#storage

    client.download({
      container: 'my-container',
      remote: 'remote-file-name.txt'
    }).pipe(res);
  },

  pipeupload_succeded: function  (req, res) {

    // as in http://stackoverflow.com/questions/24069203/skipper-in-sailsjs-beta-image-resize-before-upload
    var Writable = require('stream').Writable;


    // create a cloud client
    var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");

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
      var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");

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
      var client = CloudAPI.initClient("test:tester", "testing", "http://89.109.55.200:8080");

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
