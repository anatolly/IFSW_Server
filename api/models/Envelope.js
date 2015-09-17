/**
* Envelope.js
*
* @description :: Generic Envelope contains meta-data and a reference to the actual object.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports =
{

  // see for the full list of atributes the URL: https://rawgit.com/chafey/dicomParser/master/examples/dragAndDropParse/index.html
  attributes:
  {
    toJSON: function() {

      var object = this.toObject();

      return object;

    },

    // IFSW specific data
    ObjectID: 'string',

    // MIME type detected
    MimeType: 'string',

    // Is metadata of the object is extracted
    metadataExtracted: 'boolean',


    //Authorization and Application-dependent data
    userID:        'string',
    applicationID: 'string'

  }
};

