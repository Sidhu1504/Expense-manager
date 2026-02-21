const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getBudgets, setBudget, updateBudget } = require('../controllers/budgetController');

router.use(authMiddleware);
router.get('/', getBudgets);
router.post('/', setBudget);
router.put('/:id', updateBudget);

module.exports = router;
