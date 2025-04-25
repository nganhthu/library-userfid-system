import React, { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "../styles/CheckInOut.css";

function CheckInOut() {
  const [cardId, setCardId] = useState(null); // Lưu ID thẻ RFID
  const [message, setMessage] = useState(""); // Thông báo chung
  const [faceImage, setFaceImage] = useState(null); // Ảnh khuôn mặt dạng base64
  const [result, setResult] = useState(""); // Kết quả check-in/out
  const [userInfo, setUserInfo] = useState(null); // Thông tin người dùng sau khi quét thẻ
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý sự kiện từ socket
  useEffect(() => {
    socket.on("rfid_scanned", async (data) => {
      console.log("Received data:", data);
      const parsedCardData = JSON.parse(data.cardId);
      const card = parsedCardData.id;
      console.log("Thẻ RFID quét:", card);
      setCardId(card);
      setUserInfo(null);
      setResult("");
      setFaceImage(null);
      setMessage("Đang kiểm tra thẻ RFID...");

      try {
        const response = await fetch("http://localhost:3001/api/attendance/card-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: card }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("API Response:", data);

          if (data.success) {
            const user = data.user;
            console.log("User info", user);
            setUserInfo(user);
            setMessage("Thẻ hợp lệ. Vui lòng xác thực khuôn mặt.");
          } else {
            setMessage(data.message || "Có lỗi xảy ra.");
          }
        } else {
          setMessage("Thẻ không hợp lệ hoặc không tìm thấy người dùng.");
        }
      } catch (error) {
        console.error("Lỗi khi gọi API card-scan:", error);
        setMessage("Có lỗi xảy ra khi kiểm tra thẻ.");
      }
    });

    socket.on("check_in_out_result", (data) => {
      setResult(data.message);
    });

    return () => {
      socket.off("rfid_scanned");
      socket.off("check_in_out_result");
    };
  }, []);

  // Khởi động camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (error) {
      console.error("Lỗi khi truy cập camera:", error);
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // Chụp ảnh từ video
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
  
      // Chuyển canvas thành blob thay vì base64
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
  
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", "chillnet"); // Thay bằng preset trong Cloudinary
  
        try {
          const response = await fetch("https://api.cloudinary.com/v1_1/dmgmnyu6k/image/upload", {
            method: "POST",
            body: formData,
          });
  
          const data = await response.json();
          console.log("Upload thành công:", data);
          setFaceImage(data.secure_url); // Dùng URL ảnh
        } catch (err) {
          console.error("Lỗi upload ảnh:", err);
          alert("Không thể upload ảnh lên Cloudinary.");
        }
      }, "image/jpeg");
    }
  };
  

  // Tắt camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  // Xử lý xác thực khuôn mặt
  const handleFaceScan = async (e) => {
    e.preventDefault();
    if (!faceImage) {
      alert("Vui lòng chụp ảnh khuôn mặt.");
      return;
    }
  
    setIsLoading(true); // Bật loading
  
    try {
      const response = await fetch("http://localhost:3001/api/attendance/face-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userInfo.id, faceImage }),
      });
  
      const data = await response.json();
      setResult(data.message);
      setMessage("");
      stopCamera();
    } catch (error) {
      console.error("Lỗi xác thực khuôn mặt:", error);
      alert("Có lỗi khi xác thực khuôn mặt.");
    } finally {
      setIsLoading(false); // Tắt loading
    }
  };
  
  

  return (
    <div className="check-in-out">
      <h1>Check-in/Check-out</h1>

      <div className="rfid-box">
        <label>Quẹt thẻ RFID:</label>
        <div className="rfid-display">
          {cardId || "Vui lòng quét thẻ vào ô này"}
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      {userInfo && !result && (
        <div className="user-info">
          <p>
            <strong>Họ tên:</strong> {userInfo.name}
          </p>
          <p>
            <strong>Email:</strong> {userInfo.email}
          </p>
        </div>
      )}

      {userInfo && !result && (
        <div className="face-scan">
          <label>Quét khuôn mặt:</label>
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              style={{ display: isCameraOn ? "block" : "none", width: "100%", maxWidth: "400px",transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {faceImage && (
              <img
                src={faceImage}
                alt="Captured face"
                style={{ width: "100%", maxWidth: "400px", marginTop: "10px" }}
              />
            )}
          </div>
          <div className="camera-controls">
            {!isCameraOn ? (
              <button type="button" onClick={startCamera} className="btn btn-camera">
                Mở camera
              </button>
            ) : (
              <>
                <button type="button" onClick={captureImage} className="btn btn-camera">
                  Chụp ảnh
                </button>
                <button type="button" onClick={stopCamera} className="btn btn-camera">
                  Tắt camera
                </button>
              </>
            )}
          </div>
          <form onSubmit={handleFaceScan}>
            <button type="submit" className="btn btn-submit" disabled={!faceImage}>
              Xác thực
            </button>
          </form>
        </div>
      )}

      {result && <p className="result">{result}</p>}
      {isLoading && (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>Đang xác thực khuôn mặt...</p>
  </div>
)}

    </div>
  );
}

export default CheckInOut;