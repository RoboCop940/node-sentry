const qs      = require('querystring');
const request = require('superagent');
const pkg     = require('./package');
/**
 * [Sentry description]
 * @param {[type]} options [description]
 */
function Sentry(options){
  if(!(this instanceof Sentry)){
    return new Sentry(options);
  }
  this.options = options;
}
/**
 * [__defineGetter__ description]
 * @param  {[type]} 'dsn'     [description]
 * @param  {[type]} function( [description]
 * @return {[type]}           [description]
 */
Sentry.prototype.__defineGetter__('dsn', function(){
  return [
    this.options.tls ? 'https' : 'http',
    '://', this.options.clientKey   ,
    ':'  , this.options.clientSecret,
    '@'  , this.options.endpoint    ,
    '/'  , this.options.projectId
  ].join('');
});
/**
 * [__defineGetter__ description]
 * @param  {[type]} 'name'    [description]
 * @param  {[type]} function( [description]
 * @return {[type]}           [description]
 */
Sentry.prototype.__defineGetter__('name', function(){
  return [ pkg.name, pkg.version ].join('/');
});
/**
 * [__defineGetter__ description]
 * @param  {[type]} 'auth'    [description]
 * @param  {[type]} function( [description]
 * @return {[type]}           [description]
 */
Sentry.prototype.__defineGetter__('auth', function(){
  function echo(v){ return v; }
  return  [ 'Sentry',  qs.stringify({
    sentry_version  : 7         ,
    sentry_client   : this.name ,
    sentry_timestamp: +new Date ,
    sentry_key      : this.options.clientKey,
    sentry_secret   : this.options.clientSecret
  }, ',', null, { encodeURIComponent: echo })].join(' ');
});
/**
 * [__defineGetter__ description]
 * @param  {[type]} 'api'     [description]
 * @param  {[type]} function( [description]
 * @return {[type]}           [description]
 */
Sentry.prototype.__defineGetter__('api', function(){
  return (this.options.tls ? 'https' : 'http')
  + '://'
  + this.options.endpoint
  + '/api/' + this.options.projectId;
});

/**
 * [function description]
 * @return {[type]} [description]
 * @docs https://docs.getsentry.com/hosted/clientdev/attributes/
 */
Sentry.prototype.send = function(data, callback) {
  request
  .post(this.api + '/store/')
  .set('User-Agent'   , this.name)
  .set('X-Sentry-Auth', this.auth)
  .send(data)
  .end(callback);
  return this;
};
/**
 * [function description]
 * @param  {[type]}   message  [description]
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Sentry.prototype.captureMessage = function(message, options, callback) {
  options = options || {};
  options.message = message;
  return this.send(options, callback);
};
/**
 * [function description]
 * @param  {[type]}   exception [description]
 * @param  {[type]}   options   [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
Sentry.prototype.captureException = function(exception, options, callback){
  options = options || {};
  if(typeof exception == 'string')
    exception = new Error(exception);
  options.message = String(exception);
  options.exception = [{
    type  : exception.name,
    value : exception.message
  }];
  return this.send(options, callback);
}

module.exports = Sentry;
