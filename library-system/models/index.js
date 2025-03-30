const { sequelize } = require('../config/database');
const Book = require('./Book');
const User = require('./User');
const Loan = require('./Loan');
const Card = require('./Card');
const Attendance = require('./Attendance');

// Đồng bộ hóa tất cả các mô hình với cơ sở dữ liệu
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Đồng bộ hóa mô hình thành công');
  } catch (error) {
    console.error('Không thể đồng bộ hóa mô hình:', error);
    process.exit(1);
  }
};

module.exports = {
  Book,
  User,
  Loan,
  Card,
  Attendance,
  syncModels
}; 