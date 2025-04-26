const { Card, User } = require('../models');

/**
 * Lấy tất cả thẻ
 * @returns {Promise<Array>} Danh sách thẻ
 */
const getAllCards = async () => {
  try {
    return await Card.findAll({
      include: [{ model: User }]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách thẻ: ${error.message}`);
  }
};

/**
 * Lấy thẻ theo ID
 * @param {number} id - ID của thẻ
 * @returns {Promise<Object>} Thông tin thẻ
 */
const getCardById = async (id) => {
  try {
    const card = await Card.findByPk(id, {
      include: [{ model: User }]
    });
    if (!card) {
      throw new Error('Không tìm thấy thẻ');
    }
    return card;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin thẻ: ${error.message}`);
  }
};

/**
 * Lấy thẻ theo Card ID
 * @param {string} cardId - ID của thẻ RFID
 * @returns {Promise<Object>} Thông tin thẻ
 */
const getCardByCardId = async (cardId) => {
  try {
    const card = await Card.findOne({
      where: { cardId },
      include: [{ model: User }]
    });
    if (!card) {
      throw new Error('Không tìm thấy thẻ với ID này');
    }
    return card;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin thẻ theo Card ID: ${error.message}`);
  }
};

/**
 * Lấy tất cả thẻ của một người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách thẻ
 */
const getCardsByUserId = async (userId) => {
  try {
    return await Card.findAll({
      where: { userId },
      include: [{ model: User }]
    });
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách thẻ của người dùng: ${error.message}`);
  }
};

/**
 * Tạo thẻ mới
 * @param {Object} cardData - Dữ liệu thẻ mới
 * @returns {Promise<Object>} Thẻ đã tạo
 */
const createCard = async (cardData) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findByPk(cardData.userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }
    
    // Kiểm tra xem cardId đã tồn tại chưa
    const existingCard = await Card.findOne({
      where: { cardId: cardData.cardId }
    });
    
    if (existingCard) {
      throw new Error('Card ID đã tồn tại');
    }
    
    return await Card.create(cardData);
  } catch (error) {
    throw new Error(`Lỗi khi tạo thẻ mới: ${error.message}`);
  }
};

/**
 * Cập nhật thẻ
 * @param {number} id - ID của thẻ
 * @param {Object} cardData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Thẻ đã cập nhật
 */
const updateCard = async (id, cardData) => {
  try {
    const card = await Card.findByPk(id);
    if (!card) {
      throw new Error('Không tìm thấy thẻ');
    }
    
    // Nếu có cập nhật userId, kiểm tra xem người dùng có tồn tại không
    if (cardData.userId) {
      const user = await User.findByPk(cardData.userId);
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }
    }
    
    // Nếu có cập nhật cardId, kiểm tra xem cardId đã tồn tại chưa
    if (cardData.cardId && cardData.cardId !== card.cardId) {
      const existingCard = await Card.findOne({
        where: { cardId: cardData.cardId }
      });
      
      if (existingCard) {
        throw new Error('Card ID đã tồn tại');
      }
    }
    
    return await card.update(cardData);
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật thẻ: ${error.message}`);
  }
};

/**
 * Xóa thẻ
 * @param {number} id - ID của thẻ
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteCard = async (id) => {
  try {
    const card = await Card.findByPk(id);
    if (!card) {
      throw new Error('Không tìm thấy thẻ');
    }
    await card.destroy();
    return true;
  } catch (error) {
    throw new Error(`Lỗi khi xóa thẻ: ${error.message}`);
  }
};

/**
 * Cập nhật thời gian sử dụng thẻ gần nhất
 * @param {string} cardId - ID của thẻ RFID
 * @returns {Promise<Object>} Thẻ đã cập nhật
 */
const updateCardLastUsed = async (cardId) => {
  try {
    const card = await Card.findOne({ where: { cardId } });
    if (!card) {
      throw new Error('Không tìm thấy thẻ');
    }
    return await card.update({ lastUsed: new Date() });
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật thời gian sử dụng thẻ: ${error.message}`);
  }
};

module.exports = {
  getAllCards,
  getCardById,
  getCardByCardId,
  getCardsByUserId,
  createCard,
  updateCard,
  deleteCard,
  updateCardLastUsed
}; 