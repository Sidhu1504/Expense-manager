const pool = require('../config/db');

const getTransactions = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const categoryId = req.query.category || null;

  try {
    let query = `
      SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND EXTRACT(MONTH FROM t.transaction_date) = $2
        AND EXTRACT(YEAR FROM t.transaction_date) = $3
    `;
    const params = [userId, month, year];

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    const result = await pool.query(query, params);

    const categoriesResult = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
      [userId]
    );

    res.render('transactions', {
      user: req.user,
      transactions: result.rows,
      categories: categoriesResult.rows,
      filters: { month, year, categoryId },
      months: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      currentYear: now.getFullYear(),
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.render('error', { message: 'Failed to load transactions', user: req.user });
  }
};

const addTransaction = async (req, res) => {
  const userId = req.user.id;
  const { category_id, amount, description, transaction_date } = req.body;

  if (!category_id || !amount || !transaction_date) {
    return res.redirect('/transactions?error=Missing required fields');
  }

  try {
    await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, category_id, parseFloat(amount), description, transaction_date]
    );
    res.redirect('/transactions?success=Transaction added');
  } catch (err) {
    console.error('Add transaction error:', err);
    res.redirect('/transactions?error=Failed to add transaction');
  }
};

const updateTransaction = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { category_id, amount, description, transaction_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions 
       SET category_id=$1, amount=$2, description=$3, transaction_date=$4
       WHERE id=$5 AND user_id=$6`,
      [category_id, parseFloat(amount), description, transaction_date, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id=$1 AND user_id=$2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

const exportCSV = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  try {
    const result = await pool.query(
      `SELECT 
        t.transaction_date,
        c.name as category,
        c.type,
        t.amount,
        t.description
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND EXTRACT(MONTH FROM t.transaction_date) = $2
        AND EXTRACT(YEAR FROM t.transaction_date) = $3
      ORDER BY t.transaction_date DESC`,
      [userId, month, year]
    );

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const filename = `expenses_${monthNames[month-1]}_${year}.csv`;

    let csv = 'Date,Category,Type,Amount (INR),Description\n';
    for (const row of result.rows) {
      const date = new Date(row.transaction_date).toLocaleDateString('en-IN');
      const desc = (row.description || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${date},${row.category},${row.type},${row.amount},${desc}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.redirect('/transactions?error=Export failed');
  }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction, exportCSV };
