// File: library-system/services/faceRecognitionService.js

const faceapi = require('face-api.js');
const { Canvas, Image } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const User = require('../models/User');
const FaceData = require('../models/FaceData');
const Attendance = require('../models/Attendance');
const { Op } = require('sequelize');

// Cấu hình face-api.js sử dụng canvas
faceapi.env.monkeyPatch({ Canvas, Image });

// URL để tải models face-api.js từ CDN
const MODELS_URI = 'https://justadudewhohacks.github.io/face-api.js/models';

// Đường dẫn thư mục
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const TEMP_DIR = path.join(__dirname, '../temp-uploads');

// Đảm bảo thư mục tồn tại
fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(path.join(UPLOADS_DIR, 'faces'));
fs.ensureDirSync(path.join(UPLOADS_DIR, 'attendance'));

// Ngưỡng so sánh khuôn mặt (thấp hơn = nghiêm ngặt hơn)
const FACE_MATCH_THRESHOLD = 0.5;

class FaceRecognitionService {
  constructor() {
    this.modelsLoaded = false;
  }

  /**
   * Tải models face-api từ CDN
   */
  async loadModels() {
    try {
      if (this.modelsLoaded) {
        return true;
      }

      // Tải models từ CDN
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URI);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URI);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URI);
      
      console.log('Đã tải thành công các models nhận dạng khuôn mặt từ CDN');
      this.modelsLoaded = true;
      return true;
    } catch (error) {
      console.error('Lỗi khi tải models từ CDN:', error);
      return false;
    }
  }

  /**
   * Phát hiện khuôn mặt trong ảnh
   * @param {string} imagePath - Đường dẫn đến ảnh
   */
  async detectFace(imagePath) {
    try {
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      // Tải ảnh
      const img = await this._loadImage(imagePath);
      
      // Phát hiện khuôn mặt
      const detections = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detections) {
        return {
          success: false,
          message: 'Không phát hiện khuôn mặt trong ảnh'
        };
      }
      
      return {
        success: true,
        detection: detections,
        descriptor: Array.from(detections.descriptor)
      };
    } catch (error) {
      console.error('Lỗi khi phát hiện khuôn mặt:', error);
      return {
        success: false,
        message: `Lỗi khi phát hiện khuôn mặt: ${error.message}`
      };
    }
  }

  /**
   * Đăng ký khuôn mặt cho người dùng
   * @param {number} userId - ID người dùng
   * @param {string} imagePath - Đường dẫn đến ảnh
   * @param {string} description - Mô tả (tùy chọn)
   */
  async registerFace(userId, imagePath, description = 'Dữ liệu khuôn mặt') {
    try {
      // Kiểm tra người dùng tồn tại
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy người dùng'
        };
      }

      // Phát hiện khuôn mặt
      const detectionResult = await this.detectFace(imagePath);
      if (!detectionResult.success) {
        return detectionResult;
      }

      // Lưu ảnh khuôn mặt vào thư mục uploads/faces
      const facesDir = path.join(UPLOADS_DIR, 'faces');
      const fileName = `face_${userId}_${Date.now()}${path.extname(imagePath)}`;
      const destPath = path.join(facesDir, fileName);
      await fs.copy(imagePath, destPath);

      // Tìm hoặc tạo bản ghi dữ liệu khuôn mặt
      let faceData = await FaceData.findOne({
        where: { userId: userId }
      });
      
      // Lấy hoặc tạo mảng descriptors
      let descriptors = [];
      if (faceData) {
        // Nếu đã có dữ liệu khuôn mặt, parse từ BLOB
        try {
          const existingData = faceData.faceEncoding.toString();
          if (existingData) {
            descriptors = JSON.parse(existingData);
          }
        } catch (e) {
          console.error('Lỗi khi phân tích dữ liệu khuôn mặt:', e);
        }
        
        // Thêm descriptor mới
        descriptors.push(detectionResult.descriptor);
        
        // Cập nhật bản ghi
        faceData.faceEncoding = Buffer.from(JSON.stringify(descriptors));
        faceData.description = description;
        faceData.updatedAt = new Date();
        await faceData.save();
      } else {
        // Tạo mới dữ liệu khuôn mặt
        descriptors = [detectionResult.descriptor];
        await FaceData.create({
          userId: userId,
          faceEncoding: Buffer.from(JSON.stringify(descriptors)),
          description: description
        });
      }

      return {
        success: true,
        message: 'Đăng ký khuôn mặt thành công',
        totalFaces: descriptors.length
      };
    } catch (error) {
      console.error('Lỗi khi đăng ký khuôn mặt:', error);
      return {
        success: false,
        message: `Lỗi khi đăng ký khuôn mặt: ${error.message}`
      };
    }
  }

  /**
   * So sánh khuôn mặt với dữ liệu đã đăng ký
   * @param {Array} faceDescriptor - Vector đặc trưng khuôn mặt
   */
  async compareFaces(faceDescriptor) {
    try {
      // Lấy tất cả dữ liệu khuôn mặt
      const allFaceData = await FaceData.findAll();
      
      if (allFaceData.length === 0) {
        return {
          success: false,
          message: 'Không có dữ liệu khuôn mặt để so sánh'
        };
      }
      
      // Chuẩn bị dữ liệu khuôn mặt cho việc so sánh
      const labeledDescriptors = [];
      
      for (const faceData of allFaceData) {
        try {
          // Parse descriptor từ BLOB
          const encodingString = faceData.faceEncoding.toString();
          const descriptors = JSON.parse(encodingString);
          
          if (descriptors && descriptors.length > 0) {
            const faceDescriptors = descriptors.map(d => new Float32Array(d));
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(faceData.userId.toString(), faceDescriptors)
            );
          }
        } catch (e) {
          console.error(`Lỗi khi phân tích dữ liệu khuôn mặt cho người dùng ${faceData.userId}:`, e);
        }
      }
      
      if (labeledDescriptors.length === 0) {
        return {
          success: false,
          message: 'Không có dữ liệu khuôn mặt hợp lệ để so sánh'
        };
      }
      
      // Tạo face matcher
      const faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors, 
        FACE_MATCH_THRESHOLD
      );
      
      // Tìm sự phù hợp tốt nhất
      const match = faceMatcher.findBestMatch(new Float32Array(faceDescriptor));
      
      if (match.label === 'unknown') {
        return {
          success: false,
          message: 'Không nhận diện được khuôn mặt'
        };
      }
      
      return {
        success: true,
        userId: match.label,
        confidence: 1 - match.distance // Chuyển khoảng cách thành độ tin cậy
      };
    } catch (error) {
      console.error('Lỗi khi so sánh khuôn mặt:', error);
      return {
        success: false,
        message: `Lỗi khi so sánh khuôn mặt: ${error.message}`
      };
    }
  }

  /**
   * Check-in bằng khuôn mặt
   * @param {string} imagePath - Đường dẫn đến ảnh
   */
  async checkIn(imagePath) {
    try {
      // Phát hiện khuôn mặt
      const detectionResult = await this.detectFace(imagePath);
      if (!detectionResult.success) {
        return detectionResult;
      }
      
      // So sánh với khuôn mặt đã đăng ký
      const matchResult = await this.compareFaces(detectionResult.descriptor);
      if (!matchResult.success) {
        return matchResult;
      }
      
      // Lấy thông tin người dùng
      const user = await User.findByPk(matchResult.userId);
      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        };
      }
      
      // Kiểm tra đã check-in trong ngày chưa
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const existingAttendance = await Attendance.findOne({
        where: {
          userId: matchResult.userId,
          checkinTime: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });
      
      if (existingAttendance) {
        return {
          success: false,
          message: 'Bạn đã check-in hôm nay rồi'
        };
      }
      
      // Lưu ảnh điểm danh
      const attendanceDir = path.join(UPLOADS_DIR, 'attendance');
      const fileName = `checkin_${matchResult.userId}_${Date.now()}${path.extname(imagePath)}`;
      const destPath = path.join(attendanceDir, fileName);
      await fs.copy(imagePath, destPath);
      
      // Tạo bản ghi điểm danh
      const attendance = await Attendance.create({
        userId: matchResult.userId,
        checkinTime: new Date(),
        status: 'present',
        faceVerified: true
      });
      
      return {
        success: true,
        message: 'Check-in thành công',
        user: {
          id: user.id,
          name: user.name
        },
        time: attendance.checkinTime,
        confidence: Math.round(matchResult.confidence * 100) + '%'
      };
    } catch (error) {
      console.error('Lỗi khi check-in:', error);
      return {
        success: false,
        message: `Lỗi khi check-in: ${error.message}`
      };
    }
  }

  /**
   * Check-out bằng khuôn mặt
   * @param {string} imagePath - Đường dẫn đến ảnh
   */
  async checkOut(imagePath) {
    try {
      // Phát hiện khuôn mặt
      const detectionResult = await this.detectFace(imagePath);
      if (!detectionResult.success) {
        return detectionResult;
      }
      
      // So sánh với khuôn mặt đã đăng ký
      const matchResult = await this.compareFaces(detectionResult.descriptor);
      if (!matchResult.success) {
        return matchResult;
      }
      
      // Lấy thông tin người dùng
      const user = await User.findByPk(matchResult.userId);
      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        };
      }
      
      // Tìm bản ghi check-in trong ngày
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const attendance = await Attendance.findOne({
        where: {
          userId: matchResult.userId,
          checkinTime: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          },
          checkoutTime: null
        }
      });
      
      if (!attendance) {
        return {
          success: false,
          message: 'Bạn chưa check-in hoặc đã check-out rồi'
        };
      }
      
      // Lưu ảnh điểm danh
      const attendanceDir = path.join(UPLOADS_DIR, 'attendance');
      const fileName = `checkout_${matchResult.userId}_${Date.now()}${path.extname(imagePath)}`;
      const destPath = path.join(attendanceDir, fileName);
      await fs.copy(imagePath, destPath);
      
      // Cập nhật bản ghi điểm danh
      attendance.checkoutTime = new Date();
      await attendance.save();
      
      return {
        success: true,
        message: 'Check-out thành công',
        user: {
          id: user.id,
          name: user.name
        },
        time: attendance.checkoutTime,
        confidence: Math.round(matchResult.confidence * 100) + '%'
      };
    } catch (error) {
      console.error('Lỗi khi check-out:', error);
      return {
        success: false,
        message: `Lỗi khi check-out: ${error.message}`
      };
    }
  }

  /**
   * Lấy trạng thái đăng ký khuôn mặt
   * @param {number} userId - ID người dùng
   */
  async getFaceStatus(userId) {
    try {
      const faceData = await FaceData.findOne({
        where: { userId }
      });
      
      if (!faceData || !faceData.faceEncoding) {
        return {
          success: true,
          registered: false,
          message: 'Người dùng chưa đăng ký khuôn mặt'
        };
      }
      
      // Số lượng khuôn mặt tối thiểu cần thiết
      const MIN_REQUIRED_FACES = 3;
      
      // Parse dữ liệu khuôn mặt
      let descriptors = [];
      try {
        descriptors = JSON.parse(faceData.faceEncoding.toString());
      } catch (e) {
        console.error('Lỗi khi phân tích dữ liệu khuôn mặt:', e);
      }
      
      // Kiểm tra số lượng mẫu đã đăng ký
      const totalFaces = descriptors.length;
      const hasEnoughFaces = totalFaces >= MIN_REQUIRED_FACES;
      
      return {
        success: true,
        registered: true,
        complete: hasEnoughFaces,
        totalFaces,
        requiredFaces: MIN_REQUIRED_FACES,
        message: hasEnoughFaces 
          ? 'Đã đăng ký đủ số lượng khuôn mặt' 
          : `Cần đăng ký thêm ${MIN_REQUIRED_FACES - totalFaces} khuôn mặt`
      };
    } catch (error) {
      console.error('Lỗi khi lấy trạng thái đăng ký khuôn mặt:', error);
      return {
        success: false,
        message: `Lỗi khi lấy trạng thái đăng ký khuôn mặt: ${error.message}`
      };
    }
  }

  /**
   * Xóa dữ liệu khuôn mặt
   * @param {number} userId - ID người dùng
   */
  async resetFaceData(userId) {
    try {
      const faceData = await FaceData.findOne({
        where: { userId }
      });
      
      if (!faceData) {
        return {
          success: false,
          message: 'Không tìm thấy dữ liệu khuôn mặt'
        };
      }
      
      // Xóa bản ghi từ database
      await faceData.destroy();
      
      return {
        success: true,
        message: 'Đã xóa dữ liệu khuôn mặt thành công'
      };
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu khuôn mặt:', error);
      return {
        success: false,
        message: `Lỗi khi xóa dữ liệu khuôn mặt: ${error.message}`
      };
    }
  }

  /**
   * Tải ảnh từ đường dẫn
   * @param {string} imagePath - Đường dẫn đến ảnh
   * @private
   */
  async _loadImage(imagePath) {
    const img = new Image();
    const buffer = await fs.readFile(imagePath);
    img.src = buffer;
    return img;
  }
}

module.exports = new FaceRecognitionService();