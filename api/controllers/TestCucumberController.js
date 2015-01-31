

module.exports = {

  index: function(req, res) {
     return res.ok('Hi there');
  },

  test: function (req, res) {

   if (req.param('param') == "OK")
   {
     return res.ok('OK');
   }
    else
   {
     return res.badRequest("NOK");
     //return res.ok("NOK");
   }
  }
}
