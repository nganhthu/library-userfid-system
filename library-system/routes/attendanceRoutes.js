const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Xử lý quét thẻ RFID
router.post('/card-scan', attendanceController.processCardScan);

// Xử lý xác thực khuôn mặt và check-in/check-out
router.post('/face-auth', attendanceController.processFaceAuth);

module.exports = router; 