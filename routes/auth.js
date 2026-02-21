const express = require('express');
const router = express.Router();
const { showRegister, showLogin, register, login, logout } = require('../controllers/authController');

router.get('/register', showRegister);
router.post('/register', register);
router.get('/login', showLogin);
router.post('/login', login);
router.get('/logout', logout);

module.exports = router;
