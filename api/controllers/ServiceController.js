/**
 * ServiceController
 *
 * @description :: Server-side logic for managing Services
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

//ALT: Original basic file uploading is get from http://sailsjs.org/#/documentation/concepts/File-Uploads
//new commit test
// add new

module.exports = {
		  index: function (req,res){

			    res.writeHead(200, {'content-type': 'text/html'});
			    res.end(
			    '<form action="/service/upload" enctype="multipart/form-data" method="post">'+
			    '<input type="text" name="title"><br>'+
			    '<input type="file" name="avatar" multiple="multiple"><br>'+
			    '<input type="submit" value="Upload">'+
			    '</form>'
			    )
			  },

			  prettyinput: function (req, res)
			  {


				  return res.view('prettyinput', {title:"HHHH-RRRRR-QQQQQ" });


			  },

			  upload: function  (req, res) {
			    req.file('avatar').upload(function (err, files) {
			      if (err)
			        return res.serverError(err);

			      return res.json({
			        message: files.length + ' file(s) uploaded successfully!',
			        files: files
			      });
			    });
			  }

};

