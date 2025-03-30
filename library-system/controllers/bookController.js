const bookService = require('../services/bookService');

// Lấy tất cả sách
exports.getAllBooks = async (req, res) => {
  try {
    const books = await bookService.getAllBooks();
    res.status(200).json(books);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sách:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Lấy sách theo ID
exports.getBookById = async (req, res) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    res.status(200).json(book);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sách:', error);
    if (error.message === 'Không tìm thấy sách') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Tạo sách mới
exports.createBook = async (req, res) => {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    console.error('Lỗi khi tạo sách mới:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Cập nhật sách
exports.updateBook = async (req, res) => {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.status(200).json(book);
  } catch (error) {
    console.error('Lỗi khi cập nhật sách:', error);
    if (error.message === 'Không tìm thấy sách') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Xóa sách
exports.deleteBook = async (req, res) => {
  try {
    await bookService.deleteBook(req.params.id);
    res.status(200).json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa sách:', error);
    if (error.message === 'Không tìm thấy sách') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
}; 