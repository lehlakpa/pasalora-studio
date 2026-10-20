const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { tokenConfig, seconds } = require('../config/tokens');
const { sign, verify, setCookies, createSession } = require('../utils/tokens');
const { Session } = require('../models/Session');
test('env expiry controls JWTs, cookies and session expiry together', async () => {
  const before = { ...process.env }, original = Session.create;
  try {
    process.env.ACCESS_TOKEN_SECRET = 'a'.repeat(40); process.env.REFRESH_TOKEN_SECRET = 'r'.repeat(40);
    process.env.ACCESS_TOKEN_EXPIRE = '30m'; process.env.REFRESH_TOKEN_EXPIRE = '14d';
    const access = sign('test-owner', 'test-session', 'access'), refresh = sign('test-owner', 'test-session', 'refresh');
    for (const [token, seconds] of [[access, 1800], [refresh, 1209600]]) { const claims = jwt.decode(token); assert.equal(claims.exp - claims.iat, seconds); }
    assert.equal(verify(access, 'access').sub, 'test-owner'); assert.throws(() => verify(access, 'refresh'));
    const cookies = []; const res = { cookie: (name, value, options) => cookies.push({ name, options }) };
    setCookies(res, 'test-owner', 'test-session', refresh);
    assert.equal(cookies[0].options.maxAge, 1800000); assert.equal(cookies[1].options.maxAge, 1209600000);
    let session; Session.create = async data => { session = data; };
    const now = Date.now(); await createSession('test-owner', res);
    assert.ok(Math.abs(session.expiresAt.getTime() - now - 1209600000) < 2000);
    delete process.env.ACCESS_TOKEN_SECRET; process.env.ACCESS_TOKEN_SECRE = 'x'.repeat(40);
    assert.equal(tokenConfig('access').secret, 'x'.repeat(40));
  } finally { Session.create = original; for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key]; Object.assign(process.env, before); }
});
test('expiry supports units and numeric seconds, rejects invalid durations', () => {
  assert.equal(seconds('900', 'expiry'), 900); assert.equal(seconds('15m', 'expiry'), 900); assert.equal(seconds('7d', 'expiry'), 604800);
  for (const value of ['0', '-2d', 'invalid', '0.1s']) assert.throws(() => seconds(value, 'expiry'));
});
