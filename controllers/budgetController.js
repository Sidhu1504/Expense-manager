const pool = require('../config/db');

const getBudgets = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  try {
    const budgetsResult = await pool.query(
      `SELECT b.*, c.name as category_name,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = b.category_id 
        AND t.user_id = $1
        AND EXTRACT(MONTH FROM t.transaction_date) = $2
        AND EXTRACT(YEAR FROM t.transaction_date) = $3
      WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
      GROUP BY b.id, c.name
      ORDER BY c.name`,
      [userId, month, year]
    );

    const categoriesResult = await pool.query(
      `SELECT * FROM categories WHERE user_id = $1 AND type = 'expense' ORDER BY name`,
      [userId]
    );

    res.render('budgets', {
      user: req.user,
      budgets: budgetsResult.rows,
      categories: categoriesResult.rows,
      filters: { month, year },
      months: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      currentYear: now.getFullYear(),
    });
  } catch (err) {
    console.error('Get budgets error:', err);
    res.render('error', { message: 'Failed to load budgets', user: req.user });
  }
};

const setBudget = async (req, res) => {
  const userId = req.user.id;
  const { category_id, month, year, amount } = req.body;

  if (!category_id || !month || !year || !amount) {
    return res.redirect('/budgets?error=All fields are required');
  }

  try {
    await pool.query(
      `INSERT INTO budgets (user_id, category_id, month, year, amount)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET amount = EXCLUDED.amount`,
      [userId, category_id, parseInt(month), parseInt(year), parseFloat(amount)]
    );
    res.redirect(`/budgets?month=${month}&year=${year}&success=Budget saved`);
  } catch (err) {
    console.error('Set budget error:', err);
    res.redirect('/budgets?error=Failed to save budget');
  }
};

const updateBudget = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const result = await pool.query(
      'UPDATE budgets SET amount=$1 WHERE id=$2 AND user_id=$3',
      [parseFloat(amount), id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

module.exports = { getBudgets, setBudget, updateBudget };
