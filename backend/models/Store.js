const mongoose = require('mongoose');
const Store = mongoose.model('StudioDesign', new mongoose.Schema({ _id: String, document: mongoose.Schema.Types.Mixed, catalogMigrated: Boolean }, { timestamps: true }));
module.exports = { Store };
