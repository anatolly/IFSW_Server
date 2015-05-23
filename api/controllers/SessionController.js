/**
 * SessionController
 *
 * @description :: Server-side logic for managing IFSW Sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */




module.exports =
{


  signin: function (req, res) {

   if(req.session) {
  if (req.session.authenticated) {
    // cleanup previous session
    req.session.destroy();
  }


  if (req.param(sails.config.ifsw.req_param_userid)) {
    // assume the user is authenticated here
    req.session.user = req.param(sails.config.ifsw.req_param_userid);
    req.session.authenticated = true;
    return res.ok();
  }
  else {
    return res.forbidden();
  }
} else {return res.forbidden()}
  },

  signout: function (req, res) {

    var user = req.session.user;
    req.session.destroy();

    if(user){
      return res.ok(user.toString());
    }
    else {
      return res.ok();
    }
  }

  /*
   find: function (req, res) {
   DICOMEnvelope.find(req.params.all(), function (err, envelopes) {

   return res.json({
   envelopes: JSON.stringify(envelopes)
   });

   });
   },
   */

//====================================== INTERNAL UTILITY FUNCTIONS ================================

};
