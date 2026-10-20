const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { tokenConfig } = require('./tokens');
tokenConfig('access');
tokenConfig('refresh');
