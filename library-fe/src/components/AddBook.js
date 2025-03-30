import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddBook.css"; // Tạo file CSS nếu cần

function AddBook() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    rfidTag: "",
    publishedYear: "",
    genre: "",
    description: "",
    quantity: "",
    available: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Thêm sách thành công!");
        navigate("/books"); // Quay lại trang danh sách sách
      } else {
        alert("Thêm sách thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <div className="add-book">
      <h1>Thêm sách mới</h1>
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
          <label>RFID Tag:</label>
          <input
            type="text"
            name="rfidTag"
            value={formData.rfidTag}
            onChange={handleChange}
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
          <label>Thể loại:</label>
          <input
            type="text"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
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
          <label>Còn lại:</label>
          <input
            type="number"
            name="available"
            value={formData.available}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-submit">
          Thêm sách
        </button>
      </form>
    </div>
  );
}

export default AddBook;