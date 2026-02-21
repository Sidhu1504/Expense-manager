const pool = require('../config/db');

const getCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
      [userId]
    );
    res.render('categories', { user: req.user, categories: result.rows });
  } catch (err) {
    console.error('Get categories error:', err);
    res.render('error', { message: 'Failed to load categories', user: req.user });
  }
};

const addCategory = async (req, res) => {
  const userId = req.user.id;
  const { name, type } = req.body;

  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.redirect('/categories?error=Invalid category data');
  }

  try {
    await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3)',
      [userId, name.trim(), type]
    );
    res.redirect('/categories?success=Category added');
  } catch (err) {
    console.error('Add category error:', err);
    res.redirect('/categories?error=Failed to add category');
  }
};

const deleteCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id=$1 AND user_id=$2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete category with existing transactions' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

module.exports = { getCategories, addCategory, deleteCategory };
