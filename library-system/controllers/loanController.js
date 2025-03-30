const { User, Book, Loan, Card } = require('../models');
const loanService = require('../services/loanService');
let io;

// Thiết lập Socket.IO
const setIo = (socketIo) => {
  io = socketIo;
};

// Xử lý quét thẻ người dùng cho mượn/trả sách
exports.processUserCardScan = async (req, res) => {
  try {
    const { cardId } = req.body;
    
    // Xử lý quét thẻ người dùng qua service
    const { user, card, activeLoans } = await loanService.processUserCardScan(cardId);
    
    // Gửi thông báo qua Socket.IO
    if (io) {
      io.emit('user_card_scanned', {
        userId: user.id,
        userName: user.name,
        activeLoans: activeLoans.map(loan => ({
          id: loan.id,
          bookTitle: loan.Book.title,
          issueDate: loan.issueDate,
          dueDate: loan.dueDate
        }))
      });
    }
    
    // Trả về thông tin người dùng
    res.status(200).json({
      success: true,
      message: 'Quét thẻ thành công, vui lòng quét sách',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      activeLoans: activeLoans.map(loan => ({
        id: loan.id,
        bookId: loan.bookId,
        bookTitle: loan.Book.title,
        issueDate: loan.issueDate,
        dueDate: loan.dueDate
      }))
    });
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét thẻ người dùng:', error);
    
    if (error.message.includes('Không tìm thấy') || error.message.includes('không hợp lệ')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('không có quyền')) {
      return res.status(403).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi server' 
    });
  }
};

// Xử lý quét sách
exports.processBookScan = async (req, res) => {
  try {
    const { userId, rfidTag } = req.body;
    
    // Xử lý quét sách qua service
    const { loan, book, user, action } = await loanService.processBookScan(userId, rfidTag);
    
    // Gửi thông báo qua Socket.IO
    if (io) {
      io.emit('book_processed', {
        userId: user.id,
        userName: user.name,
        bookId: book.id,
        bookTitle: book.title,
        action
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${action === 'borrow' ? 'Mượn' : 'Trả'} sách thành công`,
      loan,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        available: book.available
      },
      action
    });
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét sách:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('không có sẵn')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi server' 
    });
  }
};

module.exports = {
  processUserCardScan: exports.processUserCardScan,
  processBookScan: exports.processBookScan,
  setIo
}; 