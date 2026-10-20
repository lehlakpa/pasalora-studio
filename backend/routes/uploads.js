const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
router.post('/', requireAdmin, upload.single('image'), require('../controllers/uploads'));
module.exports = router;
