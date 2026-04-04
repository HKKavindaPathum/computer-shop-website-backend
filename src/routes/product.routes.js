const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, getProductsByCategory, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/', getAllProducts);                                      // Public
router.get('/:id', getProductById);                                  // Public
router.get('/category/:categoryId', getProductsByCategory);          // Public
router.post('/', verifyToken, verifyAdmin, createProduct);           // Admin only
router.put('/:id', verifyToken, verifyAdmin, updateProduct);         // Admin only
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);      // Admin only

module.exports = router;