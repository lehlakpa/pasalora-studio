const jwt = require('jsonwebtoken');
const { tokenConfig } = require('../config/tokens');
const { createHash, randomBytes } = require('node:crypto');
const { Session } = require('../models/Session');
const hash = token => createHash('sha256').update(token).digest('hex');
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true' };
function cookie(req, name) {
  return (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1);
}
function verify(token, kind) {
  return jwt.verify(token, tokenConfig(kind).secret, { algorithms: ['HS256'], issuer: 'pasalora', audience: kind });
}
function sign(userId, sid, kind) {
  return jwt.sign({ sid }, tokenConfig(kind).secret, { subject: userId, jwtid: randomBytes(16).toString('hex'), algorithm: 'HS256', issuer: 'pasalora', audience: kind, expiresIn: tokenConfig(kind).seconds });
}
function setCookies(res, userId, sid, refresh) {
  res.cookie('studio_access', sign(userId, sid, 'access'), { ...cookieOptions, path: '/api', maxAge: tokenConfig('access').seconds * 1000 });
  res.cookie('studio_refresh', refresh, { ...cookieOptions, path: '/api/auth', maxAge: tokenConfig('refresh').seconds * 1000 });
}
function clearCookies(res) {
  res.clearCookie('studio_access', { ...cookieOptions, path: '/api' });
  res.clearCookie('studio_refresh', { ...cookieOptions, path: '/api/auth' });
}
async function createSession(userId, res) {
  const sid = randomBytes(24).toString('hex');
  const refresh = sign(userId, sid, 'refresh');
  await Session.create({ _id: sid, userId, refreshHash: hash(refresh), expiresAt: new Date(Date.now() + tokenConfig('refresh').seconds * 1000) });
  setCookies(res, userId, sid, refresh);
}

module.exports = { hash, cookie, verify, sign, setCookies, clearCookies, createSession };
