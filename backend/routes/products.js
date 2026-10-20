const router = require('express').Router();
const controller = require('../controllers/products');
const { requireAdmin } = require('../middleware/auth');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', requireAdmin, controller.create);
router.put('/:id', requireAdmin, controller.update);
router.delete('/:id', requireAdmin, controller.remove);

module.exports = router;
