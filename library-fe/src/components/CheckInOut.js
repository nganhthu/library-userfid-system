import React, { useState, useEffect } from "react";
import socket from "../socket"; // Import socket để nhận thông báo từ Backend
import "../styles/CheckInOut.css"; // Import CSS

function CheckInOut() {
  const [rfidId, setRfidId] = useState(null); // Lưu ID thẻ RFID
  const [message, setMessage] = useState(""); // Thông báo từ Backend
  const [faceImage, setFaceImage] = useState(null); // Ảnh khuôn mặt người dùng
  const [result, setResult] = useState(""); // Kết quả Check-in/Check-out

  useEffect(() => {
    // Lắng nghe thông báo từ Backend qua Socket.IO
    socket.on("rfid_scanned", async (data) => {
      try {
        // Gọi API xử lý quét thẻ RFID
        const response = await fetch("http://localhost:5000/api/attendance/card-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rfidId: data.rfidId }),
        });

        if (response.ok) {
          setRfidId(data.rfidId); // Lưu ID thẻ RFID
          setMessage("Vui lòng quét khuôn mặt để xác thực.");
        } else {
          setMessage("Quét thẻ RFID thất bại!");
        }
      } catch (error) {
        console.error("Error:", error);
        setMessage("Có lỗi xảy ra khi quét thẻ RFID!");
      }
    });

    socket.on("check_in_out_result", (data) => {
      setResult(data.message); // Hiển thị kết quả Check-in/Check-out
    });

    return () => {
      socket.off("rfid_scanned");
      socket.off("check_in_out_result");
    };
  }, []);

  const handleFaceScan = async (e) => {
    e.preventDefault();
    if (!faceImage) {
      alert("Vui lòng tải lên ảnh khuôn mặt!");
      return;
    }

    const formData = new FormData();
    formData.append("rfidId", rfidId);
    formData.append("faceImage", faceImage);

    try {
      // Gọi API xử lý xác thực khuôn mặt
      const response = await fetch("http://localhost:5000/api/attendance/face-auth", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.message); // Hiển thị kết quả từ Backend
      } else {
        alert("Xác thực khuôn mặt thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra khi xác thực khuôn mặt!");
    }
  };

  return (
    <div className="check-in-out">
      <h1>Check-in/Check-out</h1>
      <div className="rfid-box">
        <label>Quẹt thẻ RFID:</label>
        <div className="rfid-display">
          {rfidId ? rfidId : "Vui lòng quẹt thẻ vào ô này"}
        </div>
      </div>
      {!rfidId && !result && (
        <p className="instructions">Vui lòng quét thẻ RFID để bắt đầu.</p>
      )}
      {rfidId && !result && (
        <p className="instructions">Thẻ RFID đã được quét. Vui lòng quét khuôn mặt để xác thực.</p>
      )}
      {message && <p className="message">{message}</p>}
      {rfidId && !result && (
        <form onSubmit={handleFaceScan}>
          <div className="form-group">
            <label>Quét khuôn mặt:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFaceImage(e.target.files[0])}
              required
            />
          </div>
          <button type="submit" className="btn btn-submit">
            Xác thực
          </button>
        </form>
      )}
      {result && <p className="result">{result}</p>}
    </div>
  );
}

export default CheckInOut;