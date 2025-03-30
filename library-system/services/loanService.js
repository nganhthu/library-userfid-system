const { Loan, Book, User, Card } = require('../models');
const bookService = require('./bookService');
const userService = require('./userService');
const cardService = require('./cardService');

/**
 * Lấy tất cả các khoản mượn
 * @returns {Promise<Array>} Danh sách khoản mượn
 */
const getAllLoans = async () => {
  try {
    return await Loan.findAll({
      include: [
        { model: User },
        { model: Book }
      ],
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách khoản mượn: ${error.message}`);
  }
};

/**
 * Lấy khoản mượn theo ID
 * @param {number} id - ID của khoản mượn
 * @returns {Promise<Object>} Thông tin khoản mượn
 */
const getLoanById = async (id) => {
  try {
    const loan = await Loan.findByPk(id, {
      include: [
        { model: User },
        { model: Book }
      ]
    });
    if (!loan) {
      throw new Error('Không tìm thấy khoản mượn');
    }
    return loan;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin khoản mượn: ${error.message}`);
  }
};

/**
 * Lấy các khoản mượn của một người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách khoản mượn
 */
const getLoansByUserId = async (userId) => {
  try {
    return await Loan.findAll({
      where: { userId },
      include: [
        { model: User },
        { model: Book }
      ],
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách khoản mượn của người dùng: ${error.message}`);
  }
};

/**
 * Lấy các khoản mượn đang hoạt động của một người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách khoản mượn đang hoạt động
 */
const getActiveLoans = async (userId) => {
  try {
    return await Loan.findAll({
      where: { 
        userId,
        status: 'borrowed'
      },
      include: [
        { model: User },
        { model: Book }
      ],
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách khoản mượn đang hoạt động: ${error.message}`);
  }
};

/**
 * Xử lý quét thẻ người dùng cho mượn/trả sách
 * @param {string} cardId - ID của thẻ RFID
 * @returns {Promise<Object>} Thông tin người dùng và các khoản mượn đang hoạt động
 */
const processUserCardScan = async (cardId) => {
  try {
    // Lấy thông tin người dùng từ cardId
    const { user, card } = await userService.getUserByCardId(cardId);
    
    // Cập nhật thời gian sử dụng thẻ gần nhất
    await cardService.updateCardLastUsed(cardId);
    
    // Kiểm tra quyền mượn sách
    if (user.role !== 'member' && user.role !== 'admin' && user.role !== 'librarian') {
      throw new Error('Người dùng không có quyền mượn sách');
    }
    
    // Lấy danh sách sách đang mượn
    const activeLoans = await getActiveLoans(user.id);
    
    return {
      user,
      card,
      activeLoans
    };
  } catch (error) {
    throw new Error(`Lỗi khi xử lý quét thẻ người dùng: ${error.message}`);
  }
};

/**
 * Xử lý quét sách
 * @param {number} userId - ID của người dùng
 * @param {string} rfidTag - RFID tag của sách
 * @returns {Promise<Object>} Kết quả mượn/trả sách
 */
const processBookScan = async (userId, rfidTag) => {
  try {
    // Tìm sách trong cơ sở dữ liệu
    const book = await bookService.getBookByRfidTag(rfidTag);
    
    // Tìm người dùng
    const user = await userService.getUserById(userId);
    
    // Kiểm tra xem sách đã được mượn bởi người dùng này chưa
    const existingLoan = await Loan.findOne({
      where: {
        userId: user.id,
        bookId: book.id,
        status: 'borrowed'
      }
    });
    
    let loan;
    let action;
    
    if (existingLoan) {
      // Người dùng đã mượn sách này, thực hiện trả sách
      loan = await existingLoan.update({
        returnDate: new Date(),
        status: 'returned'
      });
      
      // Cập nhật số lượng sách có sẵn
      await bookService.updateBookAvailability(book.id, 1);
      
      action = 'return';
    } else {
      // Kiểm tra xem sách có sẵn không
      if (book.available <= 0) {
        throw new Error('Sách không có sẵn để mượn');
      }
      
      // Tính toán ngày đến hạn (mặc định là 14 ngày)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      // Người dùng chưa mượn sách này, thực hiện mượn sách
      loan = await Loan.create({
        userId: user.id,
        bookId: book.id,
        issueDate: new Date(),
        dueDate,
        status: 'borrowed'
      });
      
      // Cập nhật số lượng sách có sẵn
      await bookService.updateBookAvailability(book.id, -1);
      
      action = 'borrow';
    }
    
    return {
      loan,
      book,
      user,
      action
    };
  } catch (error) {
    throw new Error(`Lỗi khi xử lý quét sách: ${error.message}`);
  }
};

/**
 * Tính toán tiền phạt cho sách trả muộn
 * @param {number} loanId - ID của khoản mượn
 * @returns {Promise<number>} Số tiền phạt
 */
const calculateFine = async (loanId) => {
  try {
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      throw new Error('Không tìm thấy khoản mượn');
    }
    
    // Nếu sách chưa được trả
    if (loan.status !== 'returned') {
      throw new Error('Sách chưa được trả');
    }
    
    // Nếu sách trả đúng hạn
    if (new Date(loan.returnDate) <= new Date(loan.dueDate)) {
      return 0;
    }
    
    // Tính số ngày trễ
    const dueDate = new Date(loan.dueDate);
    const returnDate = new Date(loan.returnDate);
    const diffTime = Math.abs(returnDate - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Tính tiền phạt (giả sử 5000 VND/ngày)
    const fine = diffDays * 5000;
    
    // Cập nhật tiền phạt vào khoản mượn
    await loan.update({ fine });
    
    return fine;
  } catch (error) {
    throw new Error(`Lỗi khi tính toán tiền phạt: ${error.message}`);
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  getLoansByUserId,
  getActiveLoans,
  processUserCardScan,
  processBookScan,
  calculateFine
}; 