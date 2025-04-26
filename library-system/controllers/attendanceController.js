const { User } = require('../models');
const { Attendance } = require('../models');
const { Card } = require('../models');
const attendanceService = require('../services/attendanceService');
const { compareFaces } = require('../utils/faceCompare');
let io;

// Thiết lập Socket.IO
const setIo = (socketIo) => {
  io = socketIo;
};

// Xử lý quét thẻ RFID
exports.processCardScan = async (req, res) => {
  try {
    const { cardId } = req.body;
    
    // Xử lý quét thẻ qua service
    const { user, card } = await attendanceService.processCardScan(cardId);
    
    // Trả về thông tin người dùng để xác thực khuôn mặt
    res.status(200).json({
      success: true,
      message: 'Quét thẻ thành công, vui lòng xác thực khuôn mặt',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Lỗi khi xử lý quét thẻ:', error);
    res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server' 
    });
  }
};

// Xử lý xác thực khuôn mặt và check-in/check-out
exports.processFaceAuth = async (req, res) => {
  try {
    const { userId, faceImage } = req.body;
    console.log("userId",userId);
    
    if (!userId || !faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu userId hoặc faceImage'
      });
    }

    // Tìm người dùng
    const user = await User.findByPk(userId);
    if (!user || !user.image) {
      throw new Error('Không tìm thấy người dùng hoặc ảnh khuôn mặt');
    }

    // So sánh khuôn mặt (ảnh từ cloud URL)
    const faceVerified = await compareFaces(user.image, faceImage);
    if (!faceVerified) {
      throw new Error('Xác thực khuôn mặt thất bại');
    }

    // Xử lý xác thực khuôn mặt và check-in/check-out qua service
    const { attendance, action, checkedUser } = await attendanceService.processFaceAuth(userId, true);

    // Gửi thông báo qua Socket.IO
    // if (io) {
    //   io.emit('attendance_update', {
    //     userId: checkedUser.id,
    //     userName: checkedUser.name,
    //     action,
    //     time: action === 'check-in' ? attendance.checkInTime : attendance.checkOutTime
    //   });
    // }
    
    res.status(200).json({
      success: true,
      message: `${action === 'check-in' ? 'Check-in' : 'Check-out'} thành công`,
      attendance,
      action
    });
    
  } catch (error) {
    console.error('Lỗi khi xử lý xác thực khuôn mặt:', error);
    
    if (error.message === 'Xác thực khuôn mặt thất bại') {
      return res.status(401).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ 
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



/**
 * Lấy danh sách vào ra thư viện
 */
exports.getAttendanceList = async (req, res) => {
  try {
    const attendances = await Attendance.findAll({
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'image'],
        include: [{
          model: Card,
          attributes: ['cardId'],
          where: { isActive: true },  // chỉ lấy thẻ đang hoạt động nếu muốn
          required: false             // tránh lỗi nếu user chưa có thẻ
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách vào ra thành công',
      data: attendances
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vào ra:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách vào ra'
    });
  }
};


module.exports = {
  processCardScan: exports.processCardScan,
  processFaceAuth: exports.processFaceAuth,
  getAttendanceList: exports.getAttendanceList,
  setIo
};
