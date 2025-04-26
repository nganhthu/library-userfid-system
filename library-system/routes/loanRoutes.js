const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Xử lý quét thẻ người dùng cho mượn/trả sách
router.post('/user-card-scan', loanController.processUserCardScan);

// Xử lý quét sách
router.post('/book-scan', loanController.processBookScan);

module.exports = router; 