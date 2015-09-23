/**
 * Created by ebabkin on 25/05/15.
 * this is a clone of A.Tyurin's service from CMNYA
 */
module.exports = {


  //---------------------------------------------
// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript

  createUUID: function () {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
  },
//-----------------------------------------------------------------------------------------------------------------
  simpleObjectClone: function(obj) {
    var result = {};
    Object.keys(obj).forEach(function(key){
      var value = obj[key];
      result[key] = value;
    });
    return result;
  },

  //1. клонированирует req.params, чтобы с этим списком можно было работать (удалять что-то, добавлять)
  //   (!) это можно и так сделать var params = req.params.all(), но заодно уж это в плюсы функции запишем
  //   Код вместо этой функции:
  //   var params = req.params.all();
  //   delete params.lala;
  //2. удаляем 'id=undefined' из параметров - sails добавляет его для всех вызовов всех Методов (т.е. для find, findOne такой пробемы нет)
  //   Пример: http://localhost:1337/api/v1.0/fileEntity/somemethod?name=2013-04-28_5501.jpg
  //   Тогда req.params.all() = { name: '2013-04-28_5501.jpg', id: undefined }. Это не позволяет напрямую params.all() использовать как Model.find(req.params.all()...) т.к. вернется пусто
  //3. type - для определения какие параметры брать, значения 'all' или что-угодно типа 'url only'
  //   req - это стандартный http.IncommingMessage
  cloneSailsReqParams: function(req, type) {
    var params = {};

    var reqParams;
    if (type == 'all')
      reqParams = req.params.all();
    else
    if (req.params.id != null)
      reqParams = req.params; // берем только из URL до знака ?, т.к. это приоритетнее
    else
      reqParams = req.query; // иначе берем только из URL посл знака ?

    Object.keys(reqParams).forEach(function(key){
      var value = reqParams[key];
      if ((key == 'id') && (value == null)){ //это заодно и проверяет и на : typeof value == 'undefined'
        return;
      }
      params[key] = value;
    });

    return params;
  },

};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 0.чистим req.params
// 1. Единственное зачем эта функция придумана: добавляем обаботку нового параметра 'populate'
//    Но вообще это давно внесено в параметры (limit, skip, where...) для blueprint и можно с клиента контролировать populate
//    И если зачем-то потом реанимировать функцию, то сделать это в коде sails, чтобы везде вот эту функцию не вставлять
// 2. разделяем поиск одной сущности или списка - это для того, чтобы в контроллерах одну функцию на все использовать, а не две с похожим кодом
/* 3. Пример использовани в контроллерах:
 find: function(req, res) {
 return commonTools.improvedModelFind(bizCard, req, res);
 },
 findOne: function(req, res) {
 return commonTools.improvedModelFind(bizCard, req, res);
 }
 *///

/*
 improvedModelFind: function(model, req, res) {

 var params = this.cloneSailsReqParams(req, 'all');

 //Теперь отдельно обрабатываем спец параметр populate
 var doPopulate = false;
 if (typeof params.populate != 'undefined') {
 doPopulate = true;
 delete params.populate;
 }

 // Finding list of entities
 if (typeof params.id == 'undefined') {
 if (doPopulate) {
 model.find(params).populateAll().exec(function (err, entites) {
 if (err) return res.negotiate(err);
 return res.ok(entites);
 });
 }
 else {
 model.find(params).exec(function (err, entites) {
 if (err) return res.negotiate(err);
 return res.ok(entites);
 });
 }
 }
 // Finding single entity. Take ONLY id parameter
 else {
 if (doPopulate) {
 model.findOne({id:params.id}).populateAll().exec(function (err, entity) {
 if (entity == null) return res.notFound();
 if (err) return res.negotiate(err);
 return res.ok(entity);
 });
 }
 else {
 model.findOne({id:params.id}).exec(function (err, entity) {
 if (entity == null) return res.notFound();
 if (err) return res.negotiate(err);

 return res.ok(entity);
 });
 }
 }
 }
 */

