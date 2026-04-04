const db = require('../config/db');

// Order එකක් හදනවා (Checkout)
const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { shipping_address, payment_method } = req.body;

    // Cart එක ගන්නවා
    const [carts] = await connection.query(
      'SELECT * FROM Cart WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const cartId = carts[0].cart_id;

    // Cart items ගන්නවා
    const [items] = await connection.query(`
      SELECT ci.*, p.price, p.stock_quantity, p.product_name
      FROM CartItem ci
      JOIN Product p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `, [cartId]);

    if (items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Total calculate කරනවා
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Stock check කරනවා
    for (const item of items) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${item.product_name}`
        });
      }
    }

    // Order එක හදනවා
    const [orderResult] = await connection.query(`
      INSERT INTO \`Order\` (user_id, total_amount, shipping_address, status)
      VALUES (?, ?, ?, 'pending')
    `, [userId, totalAmount, shipping_address]);

    const orderId = orderResult.insertId;

    // Order items හදනවා + stock update කරනවා
    for (const item of items) {
      await connection.query(`
        INSERT INTO OrderItem (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.price]);

      // Stock reduce කරනවා
      await connection.query(`
        UPDATE Product SET stock_quantity = stock_quantity - ?
        WHERE product_id = ?
      `, [item.quantity, item.product_id]);
    }

    // Payment record හදනවා
    await connection.query(`
      INSERT INTO Payment (order_id, payment_method, amount, payment_status)
      VALUES (?, ?, ?, 'pending')
    `, [orderId, payment_method, totalAmount]);

    // Cart clear කරනවා
    await connection.query('DELETE FROM CartItem WHERE cart_id = ?', [cartId]);

    await connection.commit();

    res.status(201).json({
      message: '✅ Order placed successfully',
      orderId,
      totalAmount
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: '❌ Server error', error: err.message });
  } finally {
    connection.release();
  }
};

// User ගේ සියලුම orders ගන්නවා
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [orders] = await db.query(`
      SELECT o.*, p.payment_method, p.payment_status
      FROM \`Order\` o
      LEFT JOIN Payment p ON o.order_id = p.order_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `, [userId]);

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Order එකේ details ගන්නවා
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [orders] = await db.query(`
      SELECT o.*, p.payment_method, p.payment_status
      FROM \`Order\` o
      LEFT JOIN Payment p ON o.order_id = p.order_id
      WHERE o.order_id = ? AND o.user_id = ?
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Order items ගන්නවා
    const [items] = await db.query(`
      SELECT oi.*, p.product_name, p.brand, p.image_url
      FROM OrderItem oi
      JOIN Product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({ order: orders[0], items });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Admin - සියලුම orders ගන්නවා
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name, u.email, p.payment_method, p.payment_status
      FROM \`Order\` o
      JOIN User u ON o.user_id = u.user_id
      LEFT JOIN Payment p ON o.order_id = p.order_id
      ORDER BY o.order_date DESC
    `);

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Admin - Order status update කරනවා
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query(
      'UPDATE `Order` SET status = ? WHERE order_id = ?',
      [status, id]
    );

    // Delivered වුනොත් payment status complete කරනවා
    if (status === 'delivered') {
      await db.query(
        'UPDATE Payment SET payment_status = ? WHERE order_id = ?',
        ['completed', id]
      );
    }

    res.json({ message: '✅ Order status updated' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };