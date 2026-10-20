module.exports = (error, req, res, next) => {
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 8 MB' : 'Request could not be processed. Please check your input and retry.' });
};
