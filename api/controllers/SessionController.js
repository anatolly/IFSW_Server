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

    // check presence of application
    if(req.param(sails.config.ifsw.req_param_applicationid)) {
      req.session.application = req.param(sails.config.ifsw.req_param_applicationid);
    }

    return res.ok();
  }
  else {
    return res.forbidden();
  }
} else {return res.forbidden()}
  },

  //----------------------------------------------------------------------------------------------------------------
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

//====================================== INTERNAL UTILITY FUNCTIONS ================================

};
