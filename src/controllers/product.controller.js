const db = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// Cloudinary public_id extract කරනවා
const getPublicId = (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/');
    const folderAndFile = urlParts.slice(-2).join('/');
    return folderAndFile.split('.')[0];
  } catch {
    return null;
  }
};

// සියලුම products ගන්නවා (category name එකත් සමග)
const getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.category_name 
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
    `);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Product එකක් ගන්නවා
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query(`
      SELECT p.*, c.category_name 
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(products[0]);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Category වලින් products ගන්නවා
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [products] = await db.query(
      'SELECT * FROM Product WHERE category_id = ?',
      [categoryId]
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Product එකක් හදනවා (Admin only)
const createProduct = async (req, res) => {
  try {
    const { product_name, brand, description, price, stock_quantity, image_url, category_id } = req.body;
    const [result] = await db.query(
      `INSERT INTO Product 
        (product_name, brand, description, price, stock_quantity, image_url, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_name, brand, description, price, stock_quantity, image_url, category_id]
    );
    res.status(201).json({ message: '✅ Product created', productId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Product එකක් update කරනවා (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, brand, description, price, stock_quantity, image_url, category_id } = req.body;

    // පරණ product data ගන්නවා
    const [products] = await db.query('SELECT * FROM Product WHERE product_id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldProduct = products[0];

    // Image URL වෙනස් වෙලා තිබුණොත් පරණ image Cloudinary ඉඳලා delete කරනවා
    if (oldProduct.image_url && image_url && oldProduct.image_url !== image_url) {
      try {
        const public_id = getPublicId(oldProduct.image_url);
        if (public_id) {
          await cloudinary.uploader.destroy(public_id);
          console.log('✅ Old Cloudinary image deleted:', public_id);
        }
      } catch (cloudErr) {
        console.error('⚠️ Cloudinary delete failed:', cloudErr.message);
      }
    }

    await db.query(
      `UPDATE Product SET 
        product_name = ?, brand = ?, description = ?, price = ?, 
        stock_quantity = ?, image_url = ?, category_id = ?
       WHERE product_id = ?`,
      [product_name, brand, description, price, stock_quantity, image_url, category_id, id]
    );

    res.json({ message: '✅ Product updated' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Product එකක් delete කරනවා (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Product එක ගන්නවා
    const [products] = await db.query('SELECT * FROM Product WHERE product_id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Cloudinary image delete කරනවා
    if (product.image_url) {
      try {
        const public_id = getPublicId(product.image_url);
        if (public_id) {
          await cloudinary.uploader.destroy(public_id);
          console.log('✅ Cloudinary image deleted:', public_id);
        }
      } catch (cloudErr) {
        console.error('⚠️ Cloudinary delete failed:', cloudErr.message);
      }
    }

    // DB එකෙන් product delete කරනවා
    await db.query('DELETE FROM Product WHERE product_id = ?', [id]);

    res.json({ message: '✅ Product deleted' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
};