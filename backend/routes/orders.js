const router = require('express').Router();
const controller = require('../controllers/orders');
const { requireAdmin } = require('../middleware/auth');
const { orderLimit } = require('../middleware/rateLimits');
router.get('/payment-options', controller.paymentOptions);
router.get('/esewa/return', controller.esewaReturn);
router.get('/', requireAdmin, controller.list);
router.patch('/:id', requireAdmin, controller.update);
router.post('/', orderLimit, controller.create);

module.exports = router;
