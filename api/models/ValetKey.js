/**
* ValetKey.js
*
* @description :: ValetKey contains meta-data and a reference to the actual Envelope need for expiring shared Links.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

const ALLOWED_STATES =  ['issued', 'accessed', 'rejected'];

const VALID_STATUS = 200;

const INVALID_STATUS = 403;

const DEFAULT_MAX_ACCESS_COUNT = 9999999;

const DEFAULT_LEASE_MINUTES = 60 * 24;

module.exports =
{
  VALID_STATUS:             VALID_STATUS,
  INVALID_STATUS:           INVALID_STATUS,
  DEFAULT_MAX_ACCESS_COUNT: DEFAULT_MAX_ACCESS_COUNT,
  DEFAULT_LEASE_MINUTES:    DEFAULT_LEASE_MINUTES,


  attributes:
  {
    state: { type: 'string', enum: ALLOWED_STATES,  defaultsTo: ALLOWED_STATES[0], required: true},
    issueTime:  "datetime",
    lastAccessTime: "datetime",
    accessCount: {type:"integer", min:0,defaultsTo:0, required: true},
    accessCountMax: {type:"integer", min:1, defaultsTo:DEFAULT_MAX_ACCESS_COUNT, required: true},
    leaseMinutes: {type:"integer", min:0, defaultsTo:DEFAULT_LEASE_MINUTES, required: true},
    token: {type: "string", required: true},
    refersTo:{ model: 'Envelope', required: true },

    //-----------------------------------------------------------------------------------------------------------------
    checkValidity: function() {

      // default decision is to forbid
      var decision = INVALID_STATUS; //http://httpstatus.es/403

      // pass the check ' in accessable state'
      if((this.state === ALLOWED_STATES[0]) || (this.state === ALLOWED_STATES[1]) ) {


        // pass the check ' lease ends in future'
        var millisec_limit = this.issueTime.getTime() + this.leaseMinutes * 60 *1000;
        var now = new Date(Date.now());
        if( (millisec_limit > now.getTime())) {

          if (this.state === ALLOWED_STATES[1]) {
            // pass the check 'access count is less than the limit'
            if(this.accessCount < this.accessCountMax)
            {
              decision = VALID_STATUS; // checks were passed sucessfully
            }
          }
          else {
            // no access till now
            decision = VALID_STATUS; // checks were passed sucessfully
          }

        }
      }

      if((decision == INVALID_STATUS) && (this.state != ALLOWED_STATES[2]))
      { //persistently update state the ValetKey to REJECTED
        this.state = ALLOWED_STATES[2];
        this.save(function (){ });
      }
        return decision;
    },

    //-----------------------------------------------------------------------------------------------------------------
    registerAccessEvent: function() {

      this.state = ALLOWED_STATES[1];
      this.accessCount++;
      this.lastAccessTime = new Date(Date.now());

    }
    //-----------------------------------------------------------------------------------------------------------------

  }
};

