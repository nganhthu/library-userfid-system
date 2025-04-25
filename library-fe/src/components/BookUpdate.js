import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/BookUpdate.css"; // Tạo file CSS nếu cần

function BookUpdate() {
  const { id } = useParams(); // Lấy ID từ URL
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API để lấy thông tin sách hiện tại
    fetch(`http://localhost:3001/api/books/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch book details");
        }
        return response.json();
      })
      .then((data) => {
        setFormData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/api/books/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Cập nhật sách thành công!");
        navigate("/books"); // Quay lại trang danh sách sách
      } else {
        alert("Cập nhật sách thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="book-update">
      <h1>Cập nhật sách</h1>
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
          Cập nhật sách
        </button>
      </form>
    </div>
  );
}

export default BookUpdate;