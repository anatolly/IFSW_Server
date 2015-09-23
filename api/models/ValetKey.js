/**
* ValetKey.js
*
* @description :: ValetKey contains meta-data and a reference to the actual Envelope need for expiring shared Links.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

const ALLOWED_STATES =  ['issued', 'accessed', 'rejected'];

module.exports =
{

  attributes:
  {
    state: { type: 'string', enum: ALLOWED_STATES,  defaultsTo: ALLOWED_STATES[0], required: true},
    issueTime:  "datetime",
    accessTime: "datetime",
    leaseMinutes: {type:"integer", min:0},
    token: {type: "string", required: true},
    refersTo:{ model: 'Envelope', required: true }
  }
};

