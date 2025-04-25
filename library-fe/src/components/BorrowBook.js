import React, { useState, useEffect } from "react";
import socket from "../socket";
import "../styles/BorrowBook.css";

function BorrowBook() {
  const [userCard, setUserCard] = useState(null);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Lắng nghe quét thẻ
    socket.on("rfid_scanned", async (data) => {
      const parsedCardData = JSON.parse(data.cardId);
      const cardId = parsedCardData.id;

      try {
        const response = await fetch("http://localhost:3001/api/loans/user-card-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cardId }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUserCard(userData);
          setBorrowedBooks(userData.activeLoans || []);
          setMessage(`Xin chào ${userData.user?.name}, vui lòng quét sách để mượn/trả.`);
        } else {
          setUserCard(null);
          setMessage("Không tìm thấy thông tin thẻ.");
        }
      } catch (error) {
        console.error("Lỗi kết nối:", error);
        setMessage("Không thể kết nối đến máy chủ.");
      }
    });

    // Lắng nghe quét sách
    // socket.on("book_scanned", async (data) => {
    //   try {
    //     console.log("Sách được quét (thô):", data);

    //     const parsedBookData = JSON.parse(data.bookId); // Parse bookId từ RFID scanner
    //     const bookId = parsedBookData.id;


    //     // Gọi API gửi thông tin quét sách
    //     const response = await fetch("http://localhost:3001/api/loans/book-scan", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         userId: userCard.user?.id,
    //         rfidTag: bookId,
    //       }),
    //     });

    //     const result = await response.json();

    //     if (response.ok) {
    //       console.log("Kết quả từ server:", result);

    //       // Gộp sách mới vào danh sách (nếu server trả về chi tiết sách)
    //       if (result.book) {
    //         setBorrowedBooks((prevBooks) => [...prevBooks, result.book]);
    //       }

    //       // Hiển thị message thành công từ server
    //       setMessage(result.message || "Mượn/trả sách thành công!");
    //     } else {
    //       setMessage(result.message || "Mượn/trả sách thất bại!");
    //     }
    //   } catch (error) {
    //     console.error("Lỗi khi xử lý book_scanned:", error);
    //     setMessage("Lỗi khi gửi yêu cầu mượn/trả sách.");
    //   }
    // });

    return () => {
      socket.off("rfid_scanned");
      // socket.off("book_scanned");
    };
  }, []);

  useEffect(() => {
    if (!userCard?.user?.id) return;
  
    const handleBookScanned = async (data) => {
      try {
        console.log("Sách được quét (thô):", data);
        const parsedBookData = JSON.parse(data.bookId);
        const bookId = parsedBookData.id;
        const userId = userCard.user.id;
  
        const response = await fetch("http://localhost:3001/api/loans/book-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            rfidTag: bookId,
          }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          console.log("Kết quả từ server:", result);
  
          if (result.book) {
            setBorrowedBooks((prevBooks) => [...prevBooks, result.book]);
          }
  
          setMessage(result.message || "Mượn/trả sách thành công!");
        } else {
          setMessage(result.message || "Mượn/trả sách thất bại!");
        }
      } catch (error) {
        console.error("Lỗi khi xử lý book_scanned:", error);
        setMessage("Lỗi khi gửi yêu cầu mượn/trả sách.");
      }
    };
  
    socket.on("book_scanned", handleBookScanned);
  
    // Cleanup khi unmount hoặc userId đổi
    return () => {
      socket.off("book_scanned", handleBookScanned);
    };
  }, [userCard?.user?.id]); // ✅ thêm dependency đúng
  

  const handleCompleteBorrow = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/borrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userCard,
          books: borrowedBooks,
        }),
      });

      if (response.ok) {
        alert("Mượn sách thành công!");
        setUserCard(null);
        setBorrowedBooks([]);
        setMessage("");
      } else {
        alert("Mượn sách thất bại!");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra khi mượn sách.");
    }
  };

  return (
    <div className="borrow-book">
      <h1>Mượn Sách</h1>
      {message && <p className="message">{message}</p>}

      <div className="user-info">
        {userCard ? (
          <div>
            <p><strong>Họ Tên:</strong> {userCard.user?.name}</p>
            <p><strong>Email:</strong> {userCard.user?.email}</p>
          </div>
        ) : (
          <p>Vui lòng quét thẻ thành viên...</p>
        )}
      </div>

      <div className="book-info">
        <h2>Danh sách sách mượn:</h2>
        {borrowedBooks.length > 0 ? (
          <table className="borrowed-books-table">
            <thead>
              <tr>
                <th>ID Sách</th>
                <th>Tên Sách</th>
                <th>Tác giả</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
              </tr>
            </thead>
            <tbody>
              {borrowedBooks.map((book, index) => (
                <tr key={index}>
                  <td>{book.bookId || book.id}</td>
                  <td>{book.bookTitle || book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.issueDate ? new Date(book.issueDate).toLocaleDateString() : "-"}</td>
                  <td>{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có sách nào được quét...</p>
        )}
      </div>

      {borrowedBooks.length > 0 && (
        <button className="btn btn-complete" onClick={handleCompleteBorrow}>
          Hoàn tất mượn sách
        </button>
      )}
    </div>
  );
}

export default BorrowBook;
