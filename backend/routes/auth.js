const router = require('express').Router();
const controller = require('../controllers/auth');
const { requireAdmin } = require('../middleware/auth');
const { authLimit: limit } = require('../middleware/rateLimits');
router.use(require('../middleware/noCache'));
router.get('/status', controller.status);
router.post('/register', limit, controller.register);
router.post('/login', limit, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAdmin, controller.me);

module.exports = router;
