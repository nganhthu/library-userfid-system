/**
 * Khởi tạo kết nối MQTT
 */
require('dotenv').config();
const mqtt = require('mqtt');

/**
 * Thiết lập kết nối MQTT và xử lý tin nhắn
 * @param {object} io - Socket.IO instance
 * @returns {object} Promise
 */
const setupMQTT = async (io) => {
  try {
    // Kết nối MQTT
    const mqttBroker = process.env.MQTT_BROKER || 'broker.hivemq.com';
    const mqttUrl = mqttBroker.startsWith('mqtt://') || mqttBroker.startsWith('mqtts://') 
      ? mqttBroker 
      : `mqtt://${mqttBroker}`;
      
    const mqttOptions = {
      clientId: process.env.MQTT_CLIENT_ID || `library_system_${Math.random().toString(16).substr(2, 8)}`,
      clean: true
    };
    
    // Thêm các thông tin xác thực nếu cần
    if (process.env.MQTT_USERNAME) mqttOptions.username = process.env.MQTT_USERNAME;
    if (process.env.MQTT_PASSWORD) mqttOptions.password = process.env.MQTT_PASSWORD;
    if (process.env.MQTT_PORT) mqttOptions.port = parseInt(process.env.MQTT_PORT);
    
    console.log(`Đang kết nối đến MQTT broker: ${mqttUrl}`);
    const mqttClient = mqtt.connect(mqttUrl, mqttOptions);
    
    // Xử lý sự kiện kết nối
    mqttClient.on('connect', () => {
      console.log("Kết nối MQTT thành công");
      
      // Đăng ký các topic cho thư viện
      const topics = [
        'rfid/user',   // Topic cho thẻ người dùng
        'rfid/book'    // Topic cho sách
      ];
      
      topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`Đã đăng ký topic: ${topic}`);
          } else {
            console.error(`Lỗi khi đăng ký topic ${topic}:`, err);
          }
        });
      });
    });

    // Xử lý tin nhắn MQTT
    mqttClient.on('message', (topic, message) => {
      try {
        console.log(`Nhận tin nhắn từ topic ${topic}: ${message.toString()}`);
        
        // Xử lý theo từng topic
        if (topic === 'rfid/user') {
          handleUserCardScan(message.toString(), io);
        } else if (topic === 'rfid/book') {
          handleBookScan(message.toString(), io);
        }
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn MQTT:', error);
      }
    });
    
    // Xử lý các sự kiện khác
    mqttClient.on('error', (error) => {
      console.error('Lỗi kết nối MQTT:', error);
    });
    
    mqttClient.on('reconnect', () => {
      console.log('Đang kết nối lại MQTT...');
    });
    
    mqttClient.on('close', () => {
      console.log('Kết nối MQTT đã đóng');
    });
    
    return mqttClient;
  } catch (err) {
    console.error("Lỗi khi thiết lập MQTT:", err);
    throw err;
  }
};

// Xử lý khi quét thẻ người dùng
function handleUserCardScan(cardId, io) {
  try {
    console.log(`Đã quét thẻ người dùng: ${cardId}`);
    
    // Gửi thông tin thẻ người dùng đến client
    io.emit('rfid_scanned', { cardId });
    
    // Ở đây bạn có thể thêm xử lý tìm kiếm thông tin người dùng dựa trên cardId
    // Ví dụ: searchUserByCardId(cardId).then(user => io.emit('user-info', user));
  } catch (error) {
    console.error('Lỗi khi xử lý thẻ người dùng:', error);
  }
}

// Xử lý khi quét sách
function handleBookScan(bookId, io) {
  try {
    console.log(`Đã quét sách: ${bookId}`);
    
    // Gửi thông tin sách đến client
    io.emit('book_scanned', { bookId });
    
    // Ở đây bạn có thể thêm xử lý tìm kiếm thông tin sách dựa trên bookId
    // Ví dụ: searchBookById(bookId).then(book => io.emit('book-info', book));
  } catch (error) {
    console.error('Lỗi khi xử lý quét sách:', error);
  }
}

module.exports = { setupMQTT }; 