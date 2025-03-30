const { Book } = require('../models');

/**
 * Lấy tất cả sách
 * @returns {Promise<Array>} Danh sách sách
 */
const getAllBooks = async () => {
  try {
    return await Book.findAll();
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách sách: ${error.message}`);
  }
};

/**
 * Lấy sách theo ID
 * @param {number} id - ID của sách
 * @returns {Promise<Object>} Thông tin sách
 */
const getBookById = async (id) => {
  try {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new Error('Không tìm thấy sách');
    }
    return book;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin sách: ${error.message}`);
  }
};

/**
 * Lấy sách theo RFID tag
 * @param {string} rfidTag - RFID tag của sách
 * @returns {Promise<Object>} Thông tin sách
 */
const getBookByRfidTag = async (rfidTag) => {
  try {
    const book = await Book.findOne({ where: { rfidTag } });
    if (!book) {
      throw new Error('Không tìm thấy sách với RFID tag này');
    }
    return book;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin sách theo RFID: ${error.message}`);
  }
};

/**
 * Tạo sách mới
 * @param {Object} bookData - Dữ liệu sách mới
 * @returns {Promise<Object>} Sách đã tạo
 */
const createBook = async (bookData) => {
  try {
    return await Book.create(bookData);
  } catch (error) {
    throw new Error(`Lỗi khi tạo sách mới: ${error.message}`);
  }
};

/**
 * Cập nhật sách
 * @param {number} id - ID của sách
 * @param {Object} bookData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Sách đã cập nhật
 */
const updateBook = async (id, bookData) => {
  try {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new Error('Không tìm thấy sách');
    }
    return await book.update(bookData);
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật sách: ${error.message}`);
  }
};

/**
 * Xóa sách
 * @param {number} id - ID của sách
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteBook = async (id) => {
  try {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new Error('Không tìm thấy sách');
    }
    await book.destroy();
    return true;
  } catch (error) {
    throw new Error(`Lỗi khi xóa sách: ${error.message}`);
  }
};

/**
 * Cập nhật số lượng sách có sẵn
 * @param {number} id - ID của sách
 * @param {number} change - Thay đổi số lượng (+1 hoặc -1)
 * @returns {Promise<Object>} Sách đã cập nhật
 */
const updateBookAvailability = async (id, change) => {
  try {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new Error('Không tìm thấy sách');
    }
    
    const newAvailable = book.available + change;
    if (newAvailable < 0) {
      throw new Error('Số lượng sách có sẵn không thể âm');
    }
    
    return await book.update({ available: newAvailable });
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật số lượng sách: ${error.message}`);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  getBookByRfidTag,
  createBook,
  updateBook,
  deleteBook,
  updateBookAvailability
}; 