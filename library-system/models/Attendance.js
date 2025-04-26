const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkOutTime: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('check-in', 'check-out'),
    defaultValue: 'check-in'
  },
  faceVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cardVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Thiết lập mối quan hệ
Attendance.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Attendance, { foreignKey: 'userId' });

module.exports = Attendance; 