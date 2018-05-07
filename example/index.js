const Sentry = require('..');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const client = new Sentry('https://23c08cebdc704d7eba047b32c650e27b:ef9caf620f684ba68e0892f50c118685@sentry.lsong.org/2');

// client.captureMessage('test message');

try {
  throw new Error('test error');
} catch (e) {
  client.captureException(e);
}