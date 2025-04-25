import React, { useState } from "react";
import socket from "../socket"; // Import socket
import "../styles/AddBookRFID.css"; // Tạo file CSS nếu cần
import { useNavigate } from "react-router-dom";

function AddBookRFID() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "",
    publishedYear: "",
    quantity: 1,
    description: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gửi thông tin sách đến backend
      const response = await fetch("http://localhost:3001/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Đang ghi dữ liệu vào thẻ RFID...");
        // Lắng nghe thông báo từ WebSocket
        socket.on("book_registered", (data) => {
          setMessage("Thêm sách thành công!");
          setTimeout(() => {
            navigate("/books"); // Quay lại danh sách sách sau khi thêm thành công
          }, 2000);
        });
      } else {
        alert("Thêm sách thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <div className="add-book-rfid">
      <h1>Thêm sách quẹt thẻ RFID</h1>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tiêu đề:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Tác giả:</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>ISBN:</label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Thể loại:</label>
          <input
            type="text"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Năm xuất bản:</label>
          <input
            type="number"
            name="publishedYear"
            value={formData.publishedYear}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Số lượng:</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Mô tả:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <button type="submit" className="btn btn-submit">
          Thêm sách
        </button>
      </form>
    </div>
  );
}

export default AddBookRFID;