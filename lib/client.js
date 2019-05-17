/**
 * @module client
 */

'use strict';

var rp = require('request-promise');
var error = require('./error');
var utils = require('./utils');
var settings = require('../package').settings;
var version = require('../package').version;

var config, token, onbehalfof;

module.exports = {
  requestToken: null,
  environment: 'demo',

  _config: {
    get: function () {
      return config;
    }
  },

  _token: {
    set: function (value) {
      token = value;
    },
    get: function () {
      return token;
    }
  },

  authenticate: function (params) {
    var baseUrl = settings.environment[params.environment];
    if (!baseUrl) {
      throw new Error('invalid environment');
    }

    config = {
      baseUrl: baseUrl,
      loginId: params.loginId,
      apiKey: params.apiKey,
      authUrl: params.authUrl
    };

    var promise = this.requestToken()
      .catch(function (res) {
        throw new error(res);
      });

    return promise;
  },

  request: function (params) {
    if(params.environment) this.environment = params.environment;
    var baseUrl = settings.environment[this.environment];
    if (!this.requestToken) {
      throw new Error('please setup request token handler');
    }
    if (!baseUrl) {
      throw new Error('invalid environment');
    }

    delete params.environment;

    config = {
      baseUrl: baseUrl,
    }

    // console.log('Environment', this.environment);
    // console.log('Config', config);
    // console.log('requestToken', this.requestToken);
    var self = this;
    var reauthenticate = function (attempts) {
      var promise = self.requestToken()
        .then(respToken => {
          token = respToken
        })
        .catch(function (res) {
          if (attempts > 1) {
            return reauthenticate(attempts - 1);
          }
          else {
            throw res;
          }
        });

      return promise;
    };

    var request = function (params) {
      return reauthenticate(3)
        .then(() => {
          if (onbehalfof) {
            params.qs = params.qs || {};
            params.qs.onBehalfOf = onbehalfof;
          }

          var promise = rp({
            headers: {
              'X-Auth-Token': token,
              'User-Agent': 'CurrencyCloudSDK/2.0 NodeJS/' + version
            },
            uri: config.baseUrl + params.url,
            method: params.method,
            qsStringifyOptions: {
              arrayFormat: 'brackets'
            },
            form: params.method === 'GET' ? null : utils.snakeize(params.qs),
            qs: params.method === 'GET' ? utils.snakeize(params.qs) : null
          })
            .then(function (res) {
              return utils.camelize(JSON.parse(res));
            });
          
          return promise;
        });
    };
    
    var promise = request(params)
      .catch(function (res) {
        if (res.statusCode === 401 && token) {
          return reauthenticate(3)
            .then(function () {
              return request(params);
            })
            .catch(function (res) {
              throw new error(res);
            });
        }
        else {
          throw new error(res);
        }
      });

    return promise;
  },

  close: function (params) {
    var promise = rp.post({
      headers: {
        'X-Auth-Token': token,
        'User-Agent': 'CurrencyCloudSDK/2.0 NodeJS/' + version
      },
      uri: config.baseUrl + params.url,
    })
      .then(function () {
        config = null;
        token = null;
      })
      .catch(function (res) {
        throw new error(res);
      });

    return promise;
  },

  /**
   * Executes operations on behalf of another contact.
   * @param {String} id       Id of the contact
   * @param {Promise} promise Promise, which is resolved on behalf of the given contact
   * @return {Promise}        Given promise, resolved.
   */
  onBehalfOf: function (id, promise) {
    if (onbehalfof) {
      throw new Error('onBehalfOf has already been called and not yet completed');
    }

    var UUIDregex = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g);
    if (!UUIDregex.test(id)) {
      throw new Error('id is not valid UUID');
    }

    onbehalfof = id;

    return promise()
      .then(function () {
        onbehalfof = null;
      });
  }
};
