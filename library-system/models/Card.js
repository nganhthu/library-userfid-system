const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cardId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

// Thiết lập mối quan hệ
Card.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Card, { foreignKey: 'userId' });

module.exports = Card; 