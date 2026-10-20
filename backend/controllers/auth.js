const bcrypt = require('bcryptjs');
const { tokenConfig } = require('../config/tokens');
const { User } = require('../models/User');
const { Session } = require('../models/Session');
const { hash, cookie, verify, sign, setCookies, clearCookies, createSession } = require('../utils/tokens');
const publicUser = user => ({ id: user._id, name: user.name, phone: user.phone, username: user.username });

const status = async (req, res) => res.json({ registrationOpen: !(await User.exists({ _id: 'owner' })) });

const register = async (req, res) => {
  const { name, phone, username, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80 || typeof phone !== 'string' || !/^\+?[0-9 ()-]{7,20}$/.test(phone) || typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(username) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) return res.status(400).json({ error: 'Enter a name, valid phone, 3–30 character username, and password of at least 8 characters (maximum 72 bytes).' });
  if (await User.exists({ _id: 'owner' })) return res.status(403).json({ error: 'The store owner is already registered. Please sign in.' });
  try {
    const user = await User.create({ _id: 'owner', name: name.trim(), phone: phone.trim(), username: username.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
    await createSession(user._id, res);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ error: 'An owner is already registered. Please sign in.' }); throw error; }
};

const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || Buffer.byteLength(password) > 72) return res.status(400).json({ error: 'Enter your username and password.' });
  const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Incorrect username or password.' });
  await createSession(user._id, res);
  res.json({ user: publicUser(user) });
};

const refresh = async (req, res) => {
  try {
    const token = cookie(req, 'studio_refresh'), claims = verify(token, 'refresh');
    const refresh = sign(claims.sub, claims.sid, 'refresh');
    const session = await Session.findOneAndUpdate({ _id: claims.sid, userId: claims.sub, refreshHash: hash(token), expiresAt: { $gt: new Date() } }, { refreshHash: hash(refresh), expiresAt: new Date(Date.now() + tokenConfig('refresh').seconds * 1000) });
    if (!session) throw Error('Invalid refresh');
    setCookies(res, claims.sub, claims.sid, refresh);
    res.json({ refreshed: true });
  } catch { clearCookies(res); res.status(401).json({ error: 'Your session expired. Please sign in again.' }); }
};

const logout = async (req, res) => {
  try { const claims = verify(cookie(req, 'studio_refresh'), 'refresh'); await Session.deleteOne({ _id: claims.sid, userId: claims.sub }); } catch {}
  clearCookies(res); res.json({ loggedOut: true });
};

const me = async (req, res) => {
  const user = await User.findById(req.adminId);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });
  res.json({ user: publicUser(user) });
};

module.exports = { status, register, login, refresh, logout, me };
