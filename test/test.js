const sentry = require('sentry');

var client = sentry({
  key: '5660affd663b4e4e8f0ca25c96dce705'
  api: 'http://sentry.lsong.org/api'
});

client.send();
