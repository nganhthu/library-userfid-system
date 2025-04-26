/**
 * Khởi tạo Socket.IO
 */

const { handleFaceAuth, handleBookScan } = require('./handlers');
const { FACE_AUTH, BOOK_SCAN } = require('./events');

/**
 * Thiết lập Socket.IO và xử lý các sự kiện
 * @param {object} io - Socket.IO instance
 * @returns {object} Socket.IO instance
 */
function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('Người dùng đã kết nối:', socket.id);
    
    // Xử lý sự kiện ngắt kết nối
    socket.on('disconnect', () => {
      console.log('Người dùng đã ngắt kết nối:', socket.id);
    });
    
    // Xử lý sự kiện xác thực khuôn mặt
    socket.on(FACE_AUTH, (data) => {
      handleFaceAuth(data, io, socket);
    });
    
    // Xử lý sự kiện quét sách
    socket.on(BOOK_SCAN, (data) => {
      handleBookScan(data, io, socket);
    });
  });

  return io;
}

module.exports = { setupSocketIO }; 