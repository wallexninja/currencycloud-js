/**
 * @module currency-cloud
 */

'use strict';


module.exports = function (requestToken) {
  var client = require('./client');
  var error = require('./error');

  client.requestToken = requestToken;
  
  return {
    authentication: require('./api/authentication'),
    accounts: require('./api/accounts'),
    balances: require('./api/balances'),
    beneficiaries: require('./api/beneficiaries'),
    contacts: require('./api/contacts'),
    conversions: require('./api/conversions'),
    ibans: require('./api/ibans'),
    payers: require('./api/payers'),
    payments: require('./api/payments'),
    rates: require('./api/rates'),
    reference: require('./api/reference'),
    settlements: require('./api/settlements'),
    transactions: require('./api/transactions'),
    transfers: require('./api/transfers'),
    reports: require('./api/reports'),
    retry: require('./backoff'),
    vans: require('./api/vans'),
    onBehalfOf: client.onBehalfOf,
    APIerror: error.APIerror,
    AuthenticationError: error.AuthenticationError,
    BadRequestError: error.BadRequestError,
    ForbiddenError: error.ForbiddenError,
    NotFoundError: error.NotFoundError,
    TooManyRequestsError: error.TooManyRequestsError,
    InternalApplicationError: error.InternalApplicationError,
    UndefinedError: error.UndefinedError
  }
};
