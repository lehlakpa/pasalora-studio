const { cloudinary, configured } = require('../config/cloudinary');
module.exports = async (req, res) => {
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
};
