const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();
app.disable('x-powered-by');
// This editor API is local-only. Add authentication before exposing it publicly.
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  next();
});
app.use(express.json({ limit: '2mb' }));
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const Store = mongoose.model('StudioDesign', new mongoose.Schema({ _id: String, document: mongoose.Schema.Types.Mixed }, { timestamps: true }));
const configured = () => ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(k => Boolean(process.env[k]));
app.get('/api/health', (req, res) => res.json({ database: mongoose.connection.readyState === 1, cloudinary: configured() }));
app.get('/api/store', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is not connected' });
  const stored = await Store.findById('default').lean();
  res.json({ document: stored?.document || null, updatedAt: stored?.updatedAt });
});
app.put('/api/store', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is not connected' });
  const d = req.body;
  if (!d || !Array.isArray(d.sections) || !Array.isArray(d.products) || !d.settings || typeof d.settings.storeName !== 'string' || d.sections.length > 100 || d.products.length > 500) return res.status(400).json({ error: 'Invalid store document' });
  await Store.findByIdAndUpdate('default', { document: d }, { upsert: true });
  res.json({ saved: true });
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
app.post('/api/uploads', upload.single('image'), async (req, res) => {
  if (!configured()) return res.status(503).json({ error: 'Cloudinary is not configured' });
  const f = req.file;
  if (!f) return res.status(400).json({ error: 'Choose an image first' });
  const b = f.buffer;
  const valid = (b[0] === 255 && b[1] === 216 && b[2] === 255) || b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP');
  if (!valid) return res.status(400).json({ error: 'Use a JPEG, PNG or WebP image' });
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'pasalora-studio', resource_type: 'image', timeout: 60000 }, (error, result) => error ? reject(error) : resolve(result)).end(b);
    });
    res.status(201).json({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
  } catch (error) {
    const code = error.http_code || error.error?.http_code;
    console.error('Cloudinary upload failed:', code || error.code || 'network error');
    res.status(502).json({ error: code === 401 || code === 403
      ? 'Cloudinary rejected the credentials. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env, then restart the API.'
      : code === 400 ? 'Cloudinary could not read this image. Try a different JPG, PNG or WebP file.'
      : 'Cloudinary could not be reached. Check the server internet connection and retry.' });
  }
});
app.use((error, req, res, next) => {
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 8 MB' : 'Request could not be processed' });
});
const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Studio API listening at http://${host}:${port}`));
async function shutdown() {
  clearTimeout(databaseRetry);
  server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
let databaseRetry;
async function connectDatabase() {
  if (!process.env.MONGO_URI || mongoose.connection.readyState !== 0) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Database connected');
  } catch {
    console.error('Database connection unavailable; retrying in 10 seconds. Check MONGO_URI and network access.');
    databaseRetry = setTimeout(connectDatabase, 10000);
    databaseRetry.unref();
  }
}
connectDatabase();
