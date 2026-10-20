function seconds(value, key) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|w)?$/i);
  const duration = match && Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400, w: 604800 }[(match[2] || 's').toLowerCase()]);
  if (!Number.isSafeInteger(duration) || duration < 1) throw new Error(`${key} must be positive seconds or a duration such as 15m or 7d.`);
  return duration;
}
function tokenConfig(kind) {
  if (!['access', 'refresh'].includes(kind)) throw new Error('Unknown token kind.');
  const prefix = kind.toUpperCase();
  const secret = process.env[`${prefix}_TOKEN_SECRET`] || (kind === 'access' ? process.env.ACCESS_TOKEN_SECRE : undefined);
  if (!secret || secret.length < 32) throw new Error(`${prefix}_TOKEN_SECRET must contain at least 32 characters.`);
  return { secret, seconds: seconds(process.env[`${prefix}_TOKEN_EXPIRE`] || (kind === 'access' ? '15m' : '7d'), `${prefix}_TOKEN_EXPIRE`) };
}
module.exports = { tokenConfig, seconds };
