const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart } = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, getCart);
router.post('/add', verifyToken, addToCart);
router.post('/sync', verifyToken, syncCart);
router.put('/update/:cartItemId', verifyToken, updateCartItem);
router.delete('/remove/:cartItemId', verifyToken, removeFromCart);
router.delete('/clear', verifyToken, clearCart);

module.exports = router;