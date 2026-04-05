const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Image upload කරනවා
router.post('/', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file නෑ' });
    }
    res.json({
      message: '✅ Image uploaded successfully',
      url: req.file.path
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Upload failed', error: err.message });
  }
});

// Image delete කරනවා
router.delete('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { public_id } = req.body;
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: '✅ Image deleted' });
  } catch (err) {
    res.status(500).json({ message: '❌ Delete failed', error: err.message });
  }
});

module.exports = router;