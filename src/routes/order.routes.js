const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/order.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.post('/checkout', verifyToken, createOrder);
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/my-orders/:id', verifyToken, getOrderById);
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatus);

module.exports = router;