// File: library-system/models/FaceData.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

/**
 * Model FaceData - lưu trữ dữ liệu khuôn mặt người dùng
 */
const FaceData = sequelize.define('FaceData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  faceEncoding: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
    comment: 'Vector đặc trưng khuôn mặt dưới dạng BLOB'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Dữ liệu khuôn mặt'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'FaceData',
  timestamps: true
});

// Thiết lập mối quan hệ với model User
FaceData.belongsTo(User, { foreignKey: 'userId' });

module.exports = FaceData;
