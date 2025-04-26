const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Lấy tất cả sách
router.get('/', bookController.getAllBooks);

// Lấy sách theo ID
router.get('/:id', bookController.getBookById);

// Tạo sách mới
router.post('/', bookController.createBook);

// Cập nhật sách
router.put('/:id', bookController.updateBook);

// Xóa sách
router.delete('/:id', bookController.deleteBook);

module.exports = router; 