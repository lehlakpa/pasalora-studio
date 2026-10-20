const { Session } = require('../models/Session');
const { verify, cookie } = require('../utils/tokens');
async function requireAdmin(req, res, next) {
  try {
    const claims = verify(cookie(req, 'studio_access'), 'access');
    const session = await Session.exists({ _id: claims.sid, userId: claims.sub, expiresAt: { $gt: new Date() } });
    if (!session) throw Error('Expired');
    req.adminId = claims.sub;
    next();
  } catch { res.status(401).json({ error: 'Please sign in to continue.' }); }
}
module.exports = { requireAdmin };
