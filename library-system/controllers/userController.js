const userService = require('../services/userService');
const cardService = require('../services/cardService');

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách người dùng'
    });
  }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    // Lấy danh sách thẻ của người dùng
    const cards = await cardService.getCardsByUserId(user.id);
    
    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        cards
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    
    if (error.message.includes('Không tìm thấy người dùng')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin người dùng'
    });
  }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, role, address, isActive, cardId } = req.body;
    
    // Tách cardId ra khỏi userData
    const userData = { name, email, phone, role, address, isActive };
    
    // Gọi service để tạo người dùng
    const newUser = await userService.createUser(userData);
    
    // Nếu có cardId, tạo thẻ cho người dùng
    let card = null;
    if (cardId) {
      try {
        card = await cardService.createCard({
          userId: newUser.id,
          cardId: cardId,
          isActive: true,
          lastUsed: new Date()
        });
      } catch (cardError) {
        // Nếu lỗi khi tạo thẻ, vẫn trả về người dùng đã tạo thành công
        // nhưng kèm thông báo lỗi thẻ
        return res.status(201).json({
          success: true,
          message: 'Tạo người dùng thành công nhưng không thể tạo thẻ: ' + cardError.message,
          data: newUser,
          cardError: cardError.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: newUser,
      card: card
    });
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    
    if (error.message.includes('đã tồn tại') || error.message.includes('đã được sử dụng')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo người dùng'
    });
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', error);
    
    if (error.message.includes('Không tìm thấy người dùng')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông tin người dùng'
    });
  }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    
    if (error.message.includes('Không tìm thấy người dùng')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa người dùng'
    });
  }
}; 