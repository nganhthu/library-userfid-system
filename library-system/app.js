const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/database');
const { syncModels } = require('./models');

// Import các module MQTT và Socket.IO
const { setupMQTT } = require('./mqtt');
const { setupSocketIO } = require('./socket');

// Import controllers
const attendanceController = require('./controllers/attendanceController');
const loanController = require('./controllers/loanController');

// Cấu hình dotenv
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối cơ sở dữ liệu và đồng bộ hóa mô hình
const initializeDatabase = async () => {
  await connectDB();
  await syncModels();
};

initializeDatabase();

// Thiết lập Socket.IO
setupSocketIO(io);

// Thiết lập MQTT
// const mqttClient = setupMQTT(io);

// Thiết lập Socket.IO cho các controller
attendanceController.setIo(io);
loanController.setIo(io);

// Import routes
const bookRoutes = require('./routes/bookRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const loanRoutes = require('./routes/loanRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng đến với Hệ thống Thư viện API' });
});

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);

// Định nghĩa port
const PORT = process.env.PORT || 3000;

// Khởi động server
server.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});

// Xuất các đối tượng cần thiết
module.exports = { app, io }; //mqttClient 