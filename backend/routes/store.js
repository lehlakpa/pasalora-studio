const router = require('express').Router();
const controller = require('../controllers/store');
const { requireAdmin } = require('../middleware/auth');
router.get('/', controller.get);
router.put('/', requireAdmin, controller.save);
module.exports = router;
