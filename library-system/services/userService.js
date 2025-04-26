const { User, Card } = require('../models');

/**
 * Lấy tất cả người dùng
 * @returns {Promise<Array>} Danh sách người dùng
 */
const getAllUsers = async () => {
  try {
    return await User.findAll();
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách người dùng: ${error.message}`);
  }
};

/**
 * Lấy người dùng theo ID
 * @param {number} id - ID của người dùng
 * @returns {Promise<Object>} Thông tin người dùng
 */
const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    return user;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin người dùng: ${error.message}`);
  }
};

/**
 * Lấy người dùng theo email
 * @param {string} email - Email của người dùng
 * @returns {Promise<Object>} Thông tin người dùng
 */
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Không tìm thấy người dùng với email này');
    }
    return user;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin người dùng theo email: ${error.message}`);
  }
};

/**
 * Tạo người dùng mới
 * @param {Object} userData - Dữ liệu người dùng mới
 * @returns {Promise<Object>} Người dùng đã tạo
 */
const createUser = async (userData) => {
  try {
    return await User.create(userData);
  } catch (error) {
    throw new Error(`Lỗi khi tạo người dùng mới: ${error.message}`);
  }
};

/**
 * Cập nhật người dùng
 * @param {number} id - ID của người dùng
 * @param {Object} userData - Dữ liệu cập nhật
 * @returns {Promise<Object>} Người dùng đã cập nhật
 */
const updateUser = async (id, userData) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    return await user.update(userData);
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật người dùng: ${error.message}`);
  }
};

/**
 * Xóa người dùng
 * @param {number} id - ID của người dùng
 * @returns {Promise<boolean>} Kết quả xóa
 */
const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    await user.destroy();
    return true;
  } catch (error) {
    throw new Error(`Lỗi khi xóa người dùng: ${error.message}`);
  }
};

/**
 * Lấy người dùng theo Card ID
 * @param {string} cardId - ID của thẻ
 * @returns {Promise<Object>} Thông tin người dùng và thẻ
 */
const getUserByCardId = async (cardId) => {
  try {
    const card = await Card.findOne({
      where: { cardId, isActive: true },
      include: [{ model: User }]
    });
    
    if (!card) {
      throw new Error('Không tìm thấy thẻ hợp lệ');
    }
    
    return {
      user: card.User,
      card
    };
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin người dùng theo thẻ: ${error.message}`);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getUserByCardId
}; 