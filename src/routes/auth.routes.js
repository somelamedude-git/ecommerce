const userControllers = require('../controllers/userControllers');
const express = require('express');
require('dotenv').config({ path: '../.env' });
const router = express.Router();

router.post('/register', userControllers.createUser);

module.exports = router