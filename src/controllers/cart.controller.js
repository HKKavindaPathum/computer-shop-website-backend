const db = require('../config/db');

// Cart එක ගන්නවා
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [carts] = await db.query(
      'SELECT * FROM Cart WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.json({ cart: null, items: [], total: 0 });
    }

    const cart = carts[0];

    const [items] = await db.query(`
      SELECT 
        ci.cart_item_id,
        ci.quantity,
        p.product_id,
        p.product_name,
        p.brand,
        p.price,
        p.image_url,
        (ci.quantity * p.price) AS subtotal
      FROM CartItem ci
      JOIN Product p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `, [cart.cart_id]);

    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ cart, items, total });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Cart එකට item එකක් දානවා
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { product_id, quantity } = req.body;

    const [products] = await db.query(
      'SELECT * FROM Product WHERE product_id = ?',
      [product_id]
    );
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    let [carts] = await db.query(
      'SELECT * FROM Cart WHERE user_id = ?',
      [userId]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await db.query(
        'INSERT INTO Cart (user_id) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].cart_id;
    }

    const [existingItems] = await db.query(
      'SELECT * FROM CartItem WHERE cart_id = ? AND product_id = ?',
      [cartId, product_id]
    );

    if (existingItems.length > 0) {
      await db.query(
        'UPDATE CartItem SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
        [quantity, cartId, product_id]
      );
    } else {
      await db.query(
        'INSERT INTO CartItem (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, product_id, quantity]
      );
    }

    res.json({ message: '✅ Item added to cart' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Cart item quantity update කරනවා
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const [items] = await db.query(`
      SELECT ci.* FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cartItemId, userId]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await db.query(
      'UPDATE CartItem SET quantity = ? WHERE cart_item_id = ?',
      [quantity, cartItemId]
    );

    res.json({ message: '✅ Cart item updated' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Cart item එකක් delete කරනවා
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;

    const [items] = await db.query(`
      SELECT ci.* FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = ? AND c.user_id = ?
    `, [cartItemId, userId]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await db.query('DELETE FROM CartItem WHERE cart_item_id = ?', [cartItemId]);

    res.json({ message: '✅ Item removed from cart' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Cart එක clear කරනවා
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [carts] = await db.query(
      'SELECT * FROM Cart WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      return res.json({ message: 'Cart is already empty' });
    }

    await db.query('DELETE FROM CartItem WHERE cart_id = ?', [carts[0].cart_id]);

    res.json({ message: '✅ Cart cleared' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// localStorage cart එක DB එකට sync කරනවා
const syncCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.json({ message: 'Nothing to sync' });
    }

    let [carts] = await db.query(
      'SELECT * FROM Cart WHERE user_id = ?',
      [userId]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await db.query(
        'INSERT INTO Cart (user_id) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].cart_id;
    }

    for (const item of items) {
      const [existing] = await db.query(
        'SELECT * FROM CartItem WHERE cart_id = ? AND product_id = ?',
        [cartId, item.productId]
      );

      if (existing.length > 0) {
        await db.query(
          'UPDATE CartItem SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
          [item.qty, cartId, item.productId]
        );
      } else {
        await db.query(
          'INSERT INTO CartItem (cart_id, product_id, quantity) VALUES (?, ?, ?)',
          [cartId, item.productId, item.qty]
        );
      }
    }

    res.json({ message: '✅ Cart synced successfully' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart };