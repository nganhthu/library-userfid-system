const attendanceService = require('../services/attendanceService');
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
    
    // TODO: Thêm logic xác thực khuôn mặt ở đây
    // Giả định xác thực thành công
    const faceVerified = true;
    
    // Xử lý xác thực khuôn mặt và check-in/check-out qua service
    const { attendance, action, user } = await attendanceService.processFaceAuth(userId, faceVerified);
    
    // Gửi thông báo qua Socket.IO
    if (io) {
      io.emit('attendance_update', {
        userId: user.id,
        userName: user.name,
        action,
        time: action === 'check-in' ? attendance.checkInTime : attendance.checkOutTime
      });
    }
    
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

module.exports = {
  processCardScan: exports.processCardScan,
  processFaceAuth: exports.processFaceAuth,
  setIo
}; 