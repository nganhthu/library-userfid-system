import React, { useEffect, useState } from "react";
import "../styles/BookList.css";
import { useNavigate } from "react-router-dom";

function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line
  const [waitingForRFID, setWaitingForRFID] = useState(false); // Khai báo biến trạng thái
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API để lấy danh sách sách
    fetch("http://localhost:3001/api/books")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }
        return response.json();
      })
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDeleteBook = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa sách này?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:3001/api/books/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Xóa sách thành công!");
          // Cập nhật danh sách sách sau khi xóa
          setBooks(books.filter((book) => book.id !== id));
        } else {
          alert("Xóa sách thất bại!");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra!");
      }
    } else {
      navigate("/books");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="book-list">
      <h1>Danh sách sách</h1>
      <div className="book-list-actions">
        <button className="btn btn-add" onClick={() => navigate("/add-book")}>
          Thêm sách thủ công
        </button>
        <button className="btn btn-add" onClick={() => navigate("/add-book-rfid")}>
          Thêm sách quẹt RFID
        </button>
      </div>
      {waitingForRFID && (
        <div className="rfid-waiting">
          <p>Vui lòng quẹt thẻ RFID...</p>
          <div className="spinner"></div> {/* Hiệu ứng chờ */}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tiêu đề</th>
            <th>Tác giả</th>
            <th>ISBN</th>
            <th>Thể loại</th>
            <th>Năm xuất bản</th>
            <th>Số lượng</th>
            <th>Còn lại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.isbn}</td>
              <td>{book.genre}</td>
              <td>{book.publishedYear}</td>
              <td>{book.quantity}</td>
              <td>{book.available}</td>
              <td>
                <button
                  className="btn btn-view"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  Xem
                </button>
                <button
                  className="btn btn-edit"
                  onClick={() => navigate(`/books/update/${book.id}`)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => handleDeleteBook(book.id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookList;