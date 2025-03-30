import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/BookDetail.css"; // Tạo file CSS nếu cần

function BookDetail() {
  const { id } = useParams(); // Lấy ID từ URL
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API để lấy chi tiết sách
    fetch(`http://localhost:5000/api/books/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch book details");
        }
        return response.json();
      })
      .then((data) => {
        setBook(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="book-detail">
      <h1>Chi tiết sách</h1>
      <div className="book-info">
        <p><strong>ID:</strong> {book.id}</p>
        <p><strong>Tiêu đề:</strong> {book.title}</p>
        <p><strong>Tác giả:</strong> {book.author}</p>
        <p><strong>ISBN:</strong> {book.isbn}</p>
        <p><strong>RFID Tag:</strong> {book.rfidTag}</p>
        <p><strong>Năm xuất bản:</strong> {book.publishedYear}</p>
        <p><strong>Thể loại:</strong> {book.genre}</p>
        <p><strong>Mô tả:</strong> {book.description}</p>
        <p><strong>Số lượng:</strong> {book.quantity}</p>
        <p><strong>Còn lại:</strong> {book.available}</p>
        <p><strong>Ngày tạo:</strong> {new Date(book.createdAt).toLocaleString()}</p>
        <p><strong>Ngày cập nhật:</strong> {new Date(book.updatedAt).toLocaleString()}</p>
      </div>
      <button className="btn btn-back" onClick={() => navigate("/books")}>
        Quay lại danh sách
      </button>
    </div>
  );
}

export default BookDetail;