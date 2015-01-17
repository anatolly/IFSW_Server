

module.exports = {

  test: function (req, res) {

   if (req.param('param') == "OK")
   {
     return res.ok();
   }
    else
   {
     return res.badRequest("NOK");
   }
  }
}
