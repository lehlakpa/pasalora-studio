function fields(body) {
  const { name, category, image = '', description = '', price, compareAt = 0, stock, imageSettings = { fit: 'cover', x: 50, y: 50 } } = body || {};
  if (typeof description !== 'string' || description.length > 5000 || typeof name !== 'string' || !name.trim() || name.length > 120 || typeof category !== 'string' || !category.trim() || category.length > 80 || typeof image !== 'string' || (image && !/^https:\/\//.test(image)) || !Number.isFinite(price) || price < 0 || price > 1e8 || !Number.isFinite(compareAt) || compareAt < 0 || !Number.isInteger(stock) || stock < 0 || stock > 1e6) return null;
  if (!imageSettings || !['cover', 'contain'].includes(imageSettings.fit) || ![imageSettings.x, imageSettings.y].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) return null;
  return { imageSettings: { fit: imageSettings.fit, x: imageSettings.x, y: imageSettings.y }, name: name.trim(), category: category.trim(), image, description: description.trim(), price, compareAt, stock };
}
module.exports = { fields };
