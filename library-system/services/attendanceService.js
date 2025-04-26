const { Attendance, User } = require('../models');
const userService = require('./userService');
const cardService = require('./cardService');

/**
 * Xử lý quét thẻ RFID
 * @param {string} cardId - ID của thẻ RFID
 * @returns {Promise<Object>} Thông tin người dùng
 */
const processCardScan = async (cardId) => {
  try {
    // Lấy thông tin người dùng từ cardId
    const { user, card } = await userService.getUserByCardId(cardId);
    
    // Cập nhật thời gian sử dụng thẻ gần nhất
    await cardService.updateCardLastUsed(cardId);
    
    return {
      user,
      card
    };
  } catch (error) {
    throw new Error(`Lỗi khi xử lý quét thẻ: ${error.message}`);
  }
};

/**
 * Xử lý xác thực khuôn mặt và check-in/check-out
 * @param {number} userId - ID của người dùng
 * @param {boolean} faceVerified - Kết quả xác thực khuôn mặt
 * @returns {Promise<Object>} Kết quả check-in/check-out
 */
const processFaceAuth = async (userId, faceVerified = true) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    
    // Nếu xác thực khuôn mặt thất bại
    if (!faceVerified) {
      throw new Error('Xác thực khuôn mặt thất bại');
    }
    
    // Kiểm tra xem người dùng đã check-in chưa
    const lastAttendance = await Attendance.findOne({
      where: { userId, checkOutTime: null },
      order: [['createdAt', 'DESC']]
    });
    
    let attendance;
    let action;
    
    if (lastAttendance) {
      // Người dùng đã check-in, thực hiện check-out
      attendance = await lastAttendance.update({
        checkOutTime: new Date(),
        status: 'check-out',
        faceVerified: true,
        cardVerified: true
      });
      action = 'check-out';
    } else {
      // Người dùng chưa check-in, thực hiện check-in
      attendance = await Attendance.create({
        userId,
        checkInTime: new Date(),
        status: 'check-in',
        faceVerified: true,
        cardVerified: true
      });
      action = 'check-in';
    }
    
    return {
      attendance,
      action,
      user
    };
  } catch (error) {
    throw new Error(`Lỗi khi xử lý xác thực khuôn mặt: ${error.message}`);
  }
};

module.exports = {
  processCardScan,
  processFaceAuth
};
