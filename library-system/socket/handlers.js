/**
 * Xử lý các sự kiện Socket.IO
 */

const attendanceService = require('../services/attendanceService');
const loanService = require('../services/loanService');
const { ATTENDANCE_UPDATE, BOOK_PROCESSED } = require('./events');
const { activeScans, clearActiveUserAfterTimeout } = require('../mqtt/handlers');

/**
 * Xử lý sự kiện xác thực khuôn mặt
 * @param {object} data - Dữ liệu xác thực khuôn mặt
 * @param {object} io - Socket.IO instance
 * @param {object} socket - Socket instance
 */
async function handleFaceAuth(data, io, socket) {
  try {
    console.log('Nhận dữ liệu xác thực khuôn mặt:', data);
    
    const { userId, faceImage } = data;
    
    // TODO: Thêm logic xác thực khuôn mặt ở đây
    // Giả định xác thực thành công
    const faceVerified = true;
    
    // Xử lý xác thực khuôn mặt và check-in/check-out
    const { attendance, action, user } = await attendanceService.processFaceAuth(userId, faceVerified);
    
    // Gửi thông báo qua Socket.IO
    io.emit(ATTENDANCE_UPDATE, {
      userId: user.id,
      userName: user.name,
      action,
      time: action === 'check-in' ? attendance.checkInTime : attendance.checkOutTime
    });
    
    // Xóa thông tin quét sau khi xử lý
    clearActiveUserAfterTimeout(userId);
    
    // Phản hồi cho client gửi yêu cầu
    if (socket) {
      socket.emit('face_auth_result', {
        success: true,
        message: `${action === 'check-in' ? 'Check-in' : 'Check-out'} thành công`,
        attendance,
        action
      });
    }
    
    console.log(`Người dùng ${user.name} (${user.id}) đã ${action} thành công`);
    
  } catch (error) {
    console.error('Lỗi khi xử lý xác thực khuôn mặt:', error);
    
    // Phản hồi lỗi cho client gửi yêu cầu
    if (socket) {
      socket.emit('face_auth_result', {
        success: false,
        message: error.message
      });
    }
  }
}

/**
 * Xử lý sự kiện quét sách
 * @param {object} data - Dữ liệu quét sách
 * @param {object} io - Socket.IO instance
 * @param {object} socket - Socket instance
 */
async function handleBookScan(data, io, socket) {
  try {
    console.log('Nhận dữ liệu quét sách:', data);
    
    const { userId, rfidTag } = data;
    
    // Kiểm tra xem người dùng có đang trong phiên quét không
    const userScan = activeScans.get(userId);
    if (!userScan || userScan.scanType !== 'loan') {
      throw new Error('Không tìm thấy phiên quét hợp lệ cho người dùng này');
    }
    
    // Xử lý quét sách
    const { loan, book, user, action } = await loanService.processBookScan(userId, rfidTag);
    
    // Gửi thông báo qua Socket.IO
    io.emit(BOOK_PROCESSED, {
      userId: user.id,
      userName: user.name,
      bookId: book.id,
      bookTitle: book.title,
      action
    });
    
    // Xóa thông tin quét sau khi xử lý
    clearActiveUserAfterTimeout(userId);
    
    // Phản hồi cho client gửi yêu cầu
    if (socket) {
      socket.emit('book_scan_result', {
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
    }
    
    console.log(`Người dùng ${user.name} (${user.id}) đã ${action === 'borrow' ? 'mượn' : 'trả'} sách "${book.title}" (${book.id})`);
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét sách:', error);
    
    // Phản hồi lỗi cho client gửi yêu cầu
    if (socket) {
      socket.emit('book_scan_result', {
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = {
  handleFaceAuth,
  handleBookScan
}; 