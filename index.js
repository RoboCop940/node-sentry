const URI = require('url');
const qs = require('querystring');
const EventEmitter = require('events');
const pkg = require('./package');
/**
 * Sentry Client for Node.js
 * https://docs.sentry.io/clientdev
 */
class Sentry extends EventEmitter {
  constructor(dsn, options = {}) {
    super();
    if (typeof dsn === 'string') {
      Object.assign(options, Sentry.parseDSN(dsn));
    } else if (typeof dsn === 'object') {
      options = dsn;
    } else {
      throw new TypeError('[Sentry] DSN must be a string');
    }
    return Object.assign(this, options);
  }
  /**
   * parseDSN
   * @param {*} dsn 
   */
  static parseDSN(dsn) {
    const {
      protocol,
      pathname,
      origin: endpoint,
      username: publicKey,
      password: secretKey,
    } = new URI.URL(dsn);
    const projectId = pathname.slice(1);
    return {
      endpoint,
      projectId,
      publicKey,
      secretKey,
    };
  }
  static request(url, params) {
    return new Promise((resolve, reject) => {
      const payload = Object.assign({}, URI.parse(url), params);
      const parseBody = req => new Promise((resolve, reject) => {
        const buffer = [];
        req
          .on('error', reject)
          .on('data', chunk => buffer.push(chunk))
          .on('end', () => resolve(Buffer.concat(buffer)))
      });
      const req = require(payload.protocol.slice(0, -1)).request(payload, res => {
        parseBody(res)
          .then(resolve)
          .catch(reject)
      });
      if (payload.body) {
        req.write(JSON.stringify(payload.body));
      }
      req.end();
    });
  }
  get name() {
    return [pkg.name, pkg.version].join('/');
  }
  get auth() {
    const {
      publicKey: sentry_key,
      secretKey: sentry_secret
    } = this;
    return ['Sentry', qs.stringify({
      sentry_version: 7,
      sentry_client: this.name,
      sentry_timestamp: +new Date,
      sentry_key,
      sentry_secret
    }, ',', null, {
      encodeURIComponent: x => x
    })].join(' ');
  }
  /**
   * sendMessage
   * @docs https://docs.sentry.io/clientdev/attributes/
   * @param {*} body 
   * @param {*} callback 
   */
  send(body, callback = () => {}) {
    const {
      name,
      auth,
      endpoint,
      projectId
    } = this;
    const api = `${endpoint}/api/${projectId}/store/`;
    return Sentry.request(api, {
      method: 'post',
      headers: {
        'User-Agent': name,
        'X-Sentry-Auth': auth
      },
      body
    })
    .then(res => JSON.parse(res))
    .then(body => {
      callback(null, body);
      return body;
    })
    .catch(callback);
  }
  /**
   * captureMessage
   * @docs https://docs.sentry.io/clientdev/interfaces/message/
   * @param {*} message 
   * @param {*} options 
   * @param {*} callback
   */
  captureMessage(message, options = {}, callback) {
    options.message = message;
    return this.send(options, callback);
  }
  /**
   * captureException
   * @docs https://docs.sentry.io/clientdev/interfaces/exception/
   * @param {*} exception 
   * @param {*} options 
   * @param {*} callback 
   */
  captureException(exception, options = {}, callback) {
    if (typeof exception === 'string') {
      exception = new Error(exception);
    }
    if (exception instanceof Error) {
      options.message = exception.toString();
      options.exception = [{
        type: exception.name,
        value: exception.message
      }];
    }
    return this.send(options, callback);
  }
}

module.exports = Sentry;