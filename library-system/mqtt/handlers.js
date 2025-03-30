/**
 * Xử lý các tin nhắn MQTT
 */

const cardService = require('../services/cardService');
const bookService = require('../services/bookService');
const { CARD_SCANNED, CARD_SCAN_ERROR, BOOK_SCANNED, BOOK_SCAN_ERROR } = require('../socket/events');

// Lưu trạng thái hiện tại
const activeUsers = new Map(); // Map cardId -> userId
const activeScans = new Map(); // Map userId -> { scanType, timestamp }

/**
 * Xử lý quét thẻ RFID
 * @param {string} cardId - ID của thẻ RFID
 * @param {object} io - Socket.IO instance
 */
async function handleCardScan(cardId, io) {
  try {
    // Xử lý sơ bộ: Xác thực thẻ
    const { user, card } = await cardService.getUserByCardId(cardId);
    
    // Cập nhật thời gian sử dụng thẻ gần nhất
    await cardService.updateCardLastUsed(cardId);
    
    // Lưu thông tin người dùng đang hoạt động
    activeUsers.set(cardId, user.id);
    
    // Xác định loại quét (check-in/check-out hoặc mượn/trả sách)
    // Giả định: Nếu người dùng có role là 'member', đây là quét mượn/trả sách
    const scanType = user.role === 'member' ? 'loan' : 'attendance';
    
    // Lưu loại quét
    activeScans.set(user.id, { 
      scanType, 
      timestamp: Date.now(),
      cardId
    });
    
    // Gửi thông báo qua Socket.IO
    io.emit(CARD_SCANNED, { 
      cardId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      scanType
    });
    
    console.log(`Người dùng ${user.name} (${user.id}) đã quét thẻ ${cardId} cho ${scanType}`);
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét thẻ:', error);
    io.emit(CARD_SCAN_ERROR, { message: error.message });
  }
}

/**
 * Xử lý quét sách
 * @param {string} rfidTag - RFID tag của sách
 * @param {object} io - Socket.IO instance
 */
async function handleBookScan(rfidTag, io) {
  try {
    // Lấy thông tin sách
    const book = await bookService.getBookByRfidTag(rfidTag);
    
    // Gửi thông báo qua Socket.IO
    io.emit(BOOK_SCANNED, { 
      rfidTag,
      bookId: book.id,
      title: book.title,
      author: book.author,
      available: book.available
    });
    
    console.log(`Sách "${book.title}" (${book.id}) đã được quét với RFID ${rfidTag}`);
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét sách:', error);
    io.emit(BOOK_SCAN_ERROR, { message: error.message });
  }
}

/**
 * Xóa thông tin người dùng đang hoạt động sau một khoảng thời gian
 * @param {string} userId - ID của người dùng
 * @param {number} timeout - Thời gian timeout (ms)
 */
function clearActiveUserAfterTimeout(userId, timeout = 60000) {
  setTimeout(() => {
    const userScan = activeScans.get(userId);
    if (userScan) {
      activeScans.delete(userId);
      console.log(`Đã xóa thông tin quét của người dùng ${userId} sau ${timeout}ms`);
    }
  }, timeout);
}

module.exports = {
  handleCardScan,
  handleBookScan,
  activeUsers,
  activeScans,
  clearActiveUserAfterTimeout
}; 