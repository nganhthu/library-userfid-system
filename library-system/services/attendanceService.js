const { Attendance, User } = require('../models');
const userService = require('./userService');
const cardService = require('./cardService');

/**
 * Lấy tất cả lịch sử điểm danh
 * @returns {Promise<Array>} Danh sách điểm danh
 */
const getAllAttendances = async () => {
  try {
    return await Attendance.findAll({
      include: [{ model: User }],
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách điểm danh: ${error.message}`);
  }
};

/**
 * Lấy lịch sử điểm danh theo ID
 * @param {number} id - ID của bản ghi điểm danh
 * @returns {Promise<Object>} Thông tin điểm danh
 */
const getAttendanceById = async (id) => {
  try {
    const attendance = await Attendance.findByPk(id, {
      include: [{ model: User }]
    });
    if (!attendance) {
      throw new Error('Không tìm thấy bản ghi điểm danh');
    }
    return attendance;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin điểm danh: ${error.message}`);
  }
};

/**
 * Lấy lịch sử điểm danh của một người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách điểm danh
 */
const getAttendancesByUserId = async (userId) => {
  try {
    return await Attendance.findAll({
      where: { userId },
      include: [{ model: User }],
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy lịch sử điểm danh của người dùng: ${error.message}`);
  }
};

/**
 * Lấy bản ghi điểm danh mới nhất của một người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Object>} Thông tin điểm danh
 */
const getLatestAttendanceByUserId = async (userId) => {
  try {
    return await Attendance.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy bản ghi điểm danh mới nhất: ${error.message}`);
  }
};

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
  getAllAttendances,
  getAttendanceById,
  getAttendancesByUserId,
  getLatestAttendanceByUserId,
  processCardScan,
  processFaceAuth
}; 