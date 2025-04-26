import React, { useState, useEffect } from "react";
import socket from "../socket"; // Import socket
import "../styles/ReturnBook.css"; // Tạo file CSS nếu cần

function ReturnBook() {
  const [userCard, setUserCard] = useState(null); // Lưu thông tin thẻ thành viên
  // eslint-disable-next-line
  const [scannedBook, setScannedBook] = useState(null); // Lưu thông tin sách được quét
  const [returnedBooks, setReturnedBooks] = useState([]); // Danh sách sách trả
  const [message, setMessage] = useState(""); // Thông báo từ backend

  useEffect(() => {
    // Lắng nghe sự kiện quét thẻ thành viên
    socket.on("user_card_scanned", (data) => {
      console.log("Thẻ thành viên được quét:", data);
      setUserCard(data); // Cập nhật thông tin thẻ thành viên
      setMessage(`Thẻ thành viên được quét: ${data.name}`);
    });

    // Lắng nghe sự kiện quét sách
    socket.on("book_scanned", (data) => {
      console.log("Sách được quét:", data);
      setScannedBook(data); // Cập nhật thông tin sách được quét
      setReturnedBooks((prevBooks) => [...prevBooks, data]); // Thêm sách vào danh sách trả
      setMessage(`Sách được quét: ${data.title}`);
    });

    // Cleanup khi component bị unmount
    return () => {
      socket.off("user_card_scanned");
      socket.off("book_scanned");
    };
  }, []);

  const handleCompleteReturn = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userCard,
          books: returnedBooks,
        }),
      });

      if (response.ok) {
        alert("Trả sách thành công!");
        setUserCard(null);
        setScannedBook(null);
        setReturnedBooks([]);
        setMessage("");
      } else {
        alert("Trả sách thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  return (
    <div className="return-book">
      <h1>Trả Sách</h1>
      {message && <p className="message">{message}</p>}
      <div className="user-info">
        {userCard ? (
          <div>
            <p><strong>Thẻ thành viên:</strong> {userCard.name}</p>
            <p><strong>ID:</strong> {userCard.id}</p>
          </div>
        ) : (
          <p>Vui lòng quét thẻ thành viên...</p>
        )}
      </div>
      <div className="book-info">
        <h2>Danh sách sách trả:</h2>
        {returnedBooks.length > 0 ? (
          <ul>
            {returnedBooks.map((book, index) => (
              <li key={index}>
                <strong>{book.title}</strong> - {book.author}
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có sách nào được quét...</p>
        )}
      </div>
      {returnedBooks.length > 0 && (
        <button className="btn btn-complete" onClick={handleCompleteReturn}>
          Hoàn tất trả sách
        </button>
      )}
    </div>
  );
}

export default ReturnBook;