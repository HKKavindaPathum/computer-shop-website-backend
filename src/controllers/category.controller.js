const db = require('../config/db');

// සියලුම categories ගන්නවා
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM Category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Category එකක් හදනවා
const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO Category (category_name, description) VALUES (?, ?)',
      [category_name, description]
    );
    res.status(201).json({ message: '✅ Category created', categoryId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Category එකක් update කරනවා
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;
    await db.query(
      'UPDATE Category SET category_name = ?, description = ? WHERE category_id = ?',
      [category_name, description, id]
    );
    res.json({ message: '✅ Category updated' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

// Category එකක් delete කරනවා
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Category WHERE category_id = ?', [id]);
    res.json({ message: '✅ Category deleted' });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };