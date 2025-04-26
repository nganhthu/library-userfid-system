# Hệ thống Quản lý Thư viện

Hệ thống Quản lý Thư viện là một ứng dụng web được xây dựng bằng Express.js và MySQL, cho phép quản lý sách, người dùng và các hoạt động mượn/trả sách trong thư viện. Hệ thống tích hợp với ESP32 và RFID để quét thẻ người dùng và sách, đồng thời sử dụng xác thực khuôn mặt cho việc check-in/check-out.

## Tính năng

- Quản lý sách (thêm, sửa, xóa, tìm kiếm)
- Quản lý người dùng (đăng ký, đăng nhập, phân quyền)
- Quản lý mượn/trả sách qua RFID
- Check-in/check-out qua RFID và xác thực khuôn mặt
- Tính toán tiền phạt cho sách trả muộn
- Giao tiếp thời gian thực qua Socket.IO
- Tích hợp với MQTT để nhận dữ liệu từ ESP32

## Luồng Hoạt Động

### Luồng Check-in/Check-out:
1. Quét thẻ -> ESP32 gửi ID lên HiveMQ
2. Backend nhận được message từ MQTT
3. Backend gửi thông báo đến Frontend qua Socket.IO
4. Frontend hiển thị và yêu cầu người dùng quét mặt
5. Frontend gửi ảnh khuôn mặt đến Backend để xác thực
6. Backend xác thực và thực hiện check-in/check-out
7. Backend gửi kết quả về Frontend để hiển thị

### Luồng Mượn/Trả Sách:
1. Quét thẻ thành viên -> ESP32 gửi ID lên HiveMQ
2. Backend nhận được message từ MQTT, xác thực và kiểm tra
3. Backend gửi thông báo đến Frontend qua Socket.IO
4. Người dùng quét tiếp sách -> ESP32 gửi ID lên HiveMQ
5. Backend nhận được message từ MQTT, xác thực và kiểm tra
6. Backend gửi thông báo đến Frontend qua Socket.IO
7. Frontend hiển thị thông tin sách mượn/trả
8. Frontend gọi API đến Backend để hoàn tất quá trình mượn/trả
9. Backend xử lý và trả về kết quả

## Yêu cầu

- Node.js (v14 trở lên)
- MySQL
- ESP32 với module RFID
- Tài khoản HiveMQ (hoặc MQTT broker khác)

## Cài đặt

1. Clone repository:
```
git clone <repository-url>
cd library-system
```

2. Cài đặt các dependencies:
```
npm install
```

3. Tạo file .env và cấu hình các biến môi trường:
```
PORT=3000
NODE_ENV=development

# Cấu hình MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_system
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# MQTT Configuration
MQTT_BROKER=mqtt://broker.hivemq.com
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=library_system_server
```

4. Tạo cơ sở dữ liệu MySQL:
```
CREATE DATABASE library_system;
```

5. Khởi động ứng dụng:
```
npm start
```

## API Endpoints

### Sách
- GET /api/books - Lấy danh sách tất cả sách
- GET /api/books/:id - Lấy thông tin sách theo ID
- POST /api/books - Tạo sách mới
- PUT /api/books/:id - Cập nhật thông tin sách
- DELETE /api/books/:id - Xóa sách

### Attendance (Check-in/Check-out)
- POST /api/attendance/card-scan - Xử lý quét thẻ RFID
- POST /api/attendance/face-auth - Xử lý xác thực khuôn mặt và check-in/check-out

### Mượn/Trả Sách
- POST /api/loans/user-card-scan - Xử lý quét thẻ người dùng cho mượn/trả sách
- POST /api/loans/book-scan - Xử lý quét sách

## Socket.IO Events

### Server to Client
- `card_scanned` - Khi có thẻ RFID được quét
- `book_scanned` - Khi có sách được quét
- `attendance_update` - Khi có cập nhật về check-in/check-out
- `user_card_scanned` - Khi có thẻ người dùng được quét cho mượn/trả sách
- `book_processed` - Khi sách được xử lý (mượn/trả)

### Client to Server
- `face_auth` - Gửi dữ liệu xác thực khuôn mặt
- `book_scan` - Gửi dữ liệu quét sách

## MQTT Topics

- `library/rfid/card` - Topic nhận ID thẻ RFID từ ESP32
- `library/rfid/book` - Topic nhận ID sách từ ESP32

## Phát triển

Để phát triển thêm, bạn có thể tạo thêm các controller và routes cho các tính năng khác.

## Giấy phép

[MIT](LICENSE) 