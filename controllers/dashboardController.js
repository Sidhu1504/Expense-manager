const pool = require('../config/db');

const getDashboard = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    // Monthly summary for last 6 months
    const summaryResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', transaction_date) AS month,
        SUM(CASE WHEN c.type='income' THEN t.amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN c.type='expense' THEN t.amount ELSE 0 END) AS total_expense
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6`,
      [userId]
    );

    // Budget alert query for current month
    const budgetAlertResult = await pool.query(
      `SELECT 
        c.name,
        COALESCE(SUM(t.amount), 0) as spent,
        b.amount as budget
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.user_id = $1
        AND EXTRACT(MONTH FROM t.transaction_date) = $2
        AND EXTRACT(YEAR FROM t.transaction_date) = $3
      WHERE b.user_id = $1
        AND b.month = $2
        AND b.year = $3
      GROUP BY c.name, b.amount`,
      [userId, currentMonth, currentYear]
    );

    // Category-wise spending current month
    const categorySpendResult = await pool.query(
      `SELECT 
        c.name,
        c.type,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND EXTRACT(MONTH FROM t.transaction_date) = $2
        AND EXTRACT(YEAR FROM t.transaction_date) = $3
      GROUP BY c.name, c.type
      ORDER BY total DESC`,
      [userId, currentMonth, currentYear]
    );

    // Recent 5 transactions
    const recentResult = await pool.query(
      `SELECT t.*, c.name as category_name, c.type as category_type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 5`,
      [userId]
    );

    // Current month totals
    const currentSummary = summaryResult.rows.find(r => {
      const d = new Date(r.month);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }) || { total_income: 0, total_expense: 0 };

    res.render('dashboard', {
      user: req.user,
      summary: summaryResult.rows,
      budgetAlerts: budgetAlertResult.rows,
      categorySpend: categorySpendResult.rows,
      recentTransactions: recentResult.rows,
      currentMonth,
      currentYear,
      currentSummary,
      formatINR: (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount),
    });
  } catch (err) {
    console.error('Dashboard FULL error:', err.message, err.stack);
    res.render('error', { message: 'Dashboard error: ' + err.message, user: req.user });
  }
  };

module.exports = { getDashboard };
