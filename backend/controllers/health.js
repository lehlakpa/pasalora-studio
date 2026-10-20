const mongoose = require('mongoose');
const { configured } = require('../config/cloudinary');
module.exports = (req, res) => res.json({ database: mongoose.connection.readyState === 1, cloudinary: configured() });
