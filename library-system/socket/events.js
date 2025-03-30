/**
 * Định nghĩa các Socket.IO events
 */

// Events từ server đến client
const CARD_SCANNED = 'card_scanned';
const CARD_SCAN_ERROR = 'card_scan_error';
const BOOK_SCANNED = 'book_scanned';
const BOOK_SCAN_ERROR = 'book_scan_error';
const ATTENDANCE_UPDATE = 'attendance_update';
const USER_CARD_SCANNED = 'user_card_scanned';
const BOOK_PROCESSED = 'book_processed';

// Events từ client đến server
const FACE_AUTH = 'face_auth';
const BOOK_SCAN = 'book_scan';

module.exports = {
  // Server to client
  CARD_SCANNED,
  CARD_SCAN_ERROR,
  BOOK_SCANNED,
  BOOK_SCAN_ERROR,
  ATTENDANCE_UPDATE,
  USER_CARD_SCANNED,
  BOOK_PROCESSED,
  
  // Client to server
  FACE_AUTH,
  BOOK_SCAN
}; 