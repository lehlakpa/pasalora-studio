const router = require('express').Router();
router.get('/health', require('../controllers/health'));
router.use('/auth', require('./auth'));
router.use('/products', require('./products'));
router.use('/orders', require('./orders'));
router.use('/store', require('./store'));
router.use('/uploads', require('./uploads'));
module.exports = router;
