// File: library-system/routes/faceRecognition.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const faceRecognitionService = require('../services/FaceRecognitionService');

// Đảm bảo thư mục tạm tồn tại
const TEMP_DIR = path.join(__dirname, '../temp-uploads');
fs.ensureDirSync(TEMP_DIR);

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function(req, file, cb) {
    cb(null, `face_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file hình ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  }
});

// Tải models khi khởi động
faceRecognitionService.loadModels().then(success => {
  if (success) {
    console.log('Đã tải thành công các models nhận dạng khuôn mặt');
  } else {
    console.warn('Không thể tải models nhận dạng khuôn mặt');
  }
}).catch(error => {
  console.error('Lỗi khi tải models nhận dạng khuôn mặt:', error);
});

// API kiểm tra trạng thái và tải models
router.get('/setup', async (req, res) => {
  try {
    const result = await faceRecognitionService.loadModels();
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Đã tải thành công các models nhận dạng khuôn mặt'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Không thể tải models nhận dạng khuôn mặt'
      });
    }
  } catch (error) {
    console.error('Lỗi khi thiết lập nhận dạng khuôn mặt:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thiết lập nhận dạng khuôn mặt',
      error: error.message
    });
  }
});

// Đăng ký khuôn mặt cho người dùng
router.post('/register/:userId', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Cần có hình ảnh khuôn mặt'
      });
    }

    const userId = req.params.userId;
    const description = req.body.description || 'Dữ liệu khuôn mặt';
    
    // Đăng ký khuôn mặt
    const result = await faceRecognitionService.registerFace(userId, req.file.path, description);
    
    // Xóa file tạm
    fs.removeSync(req.file.path);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lỗi khi xử lý đăng ký khuôn mặt:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký khuôn mặt',
      error: error.message
    });
  }
});

// Check-in bằng khuôn mặt
router.post('/checkin', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Cần có hình ảnh khuôn mặt'
      });
    }
    
    // Thực hiện check-in
    const result = await faceRecognitionService.checkIn(req.file.path);
    
    // Xóa file tạm
    fs.removeSync(req.file.path);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lỗi khi xử lý check-in:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi check-in',
      error: error.message
    });
  }
});

// Check-out bằng khuôn mặt
router.post('/checkout', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Cần có hình ảnh khuôn mặt'
      });
    }
    
    // Thực hiện check-out
    const result = await faceRecognitionService.checkOut(req.file.path);
    
    // Xóa file tạm
    fs.removeSync(req.file.path);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lỗi khi xử lý check-out:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi check-out',
      error: error.message
    });
  }
});

// Lấy trạng thái đăng ký khuôn mặt
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Lấy trạng thái đăng ký khuôn mặt
    const result = await faceRecognitionService.getFaceStatus(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái đăng ký khuôn mặt:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy trạng thái đăng ký khuôn mặt',
      error: error.message
    });
  }
});

// Xóa dữ liệu khuôn mặt
router.delete('/reset/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Xóa dữ liệu khuôn mặt
    const result = await faceRecognitionService.resetFaceData(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu khuôn mặt:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa dữ liệu khuôn mặt',
      error: error.message
    });
  }
});

module.exports = router;