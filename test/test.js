const assert = require('assert');
const Sentry = require('..');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const client = new Sentry({
  projectId: '2',
  publicKey: '23c08cebdc704d7eba047b32c650e27b',
  secretKey: 'ef9caf620f684ba68e0892f50c118685',
  endpoint : 'https://sentry.lsong.org'
});

const it = (title, fn) => {
  fn().then(() => {
    console.log('➜ ok');
  }, err => {
    console.error('✘', err.name, err.message);
  });
};

it('capture message', async () => {
  const a = await client.captureMessage('capture message');
  assert.ok(a.id);
});

it('capture exception message', async () => {
  const b = await client.captureException('error message');
  assert.ok(b.id);
});

it('capture error exception', async () => {
  const err = new Error('error object');
  const c = await client.captureException(err);
  assert.ok(c.id);
});
