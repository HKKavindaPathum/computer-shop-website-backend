const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/', getAllCategories);                                    // Public
router.post('/', verifyToken, verifyAdmin, createCategory);          // Admin only
router.put('/:id', verifyToken, verifyAdmin, updateCategory);        // Admin only
router.delete('/:id', verifyToken, verifyAdmin, deleteCategory);     // Admin only

module.exports = router;