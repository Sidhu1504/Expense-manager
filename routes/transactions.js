const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  exportCSV
} = require('../controllers/transactionController');

router.use(authMiddleware);

router.get('/', getTransactions);
router.get('/export', exportCSV);
router.post('/', addTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
