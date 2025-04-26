import React, { useEffect, useState } from "react";
import "../styles/BookList.css";
import { useNavigate } from "react-router-dom";

function BookList() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line
  const [waitingForRFID, setWaitingForRFID] = useState(false);
  const navigate = useNavigate();
  
  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  // State cho sắp xếp
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // State cho tìm kiếm
  const [searchField, setSearchField] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inputSearchTerm, setInputSearchTerm] = useState(""); // State mới để lưu giá trị đang nhập
  const [isSearched, setIsSearched] = useState(false); // State để kiểm tra đã tìm kiếm chưa

  // Hàm chuyển chuỗi tiếng Việt có dấu thành không dấu
  const removeVietnameseAccents = (str) => {
    if (!str) return '';
    
    return str.normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
             .replace(/đ/g, 'd').replace(/Đ/g, 'D'); // Đổi đ/Đ thành d/D
  };

  // Hàm chuẩn hóa chuỗi tìm kiếm (chỉ trim khoảng trắng thừa ở đầu/cuối và giữa các từ)
  const normalizeSearchString = (str) => {
    if (!str) return '';
    
    // Loại bỏ khoảng trắng ở đầu và cuối chuỗi, thay thế nhiều khoảng trắng liên tiếp bằng một khoảng trắng
    return str.trim().replace(/\s+/g, ' ');
  };

  useEffect(() => {
    // Gọi API để lấy danh sách sách
    fetch("http://localhost:5000/api/books")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }
        return response.json();
      })
      .then((data) => {
        setBooks(data);
        setFilteredBooks(data);
        setLoading(false);
        // Tính toán tổng số trang
        setTotalPages(Math.ceil(data.length / booksPerPage));
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [booksPerPage]);

  const handleDeleteBook = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa sách này?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:5000/api/books/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Xóa sách thành công!");
          // Cập nhật danh sách sách sau khi xóa
          const updatedBooks = books.filter((book) => book.id !== id);
          setBooks(updatedBooks);
          
          // Nếu đang tìm kiếm, cập nhật lại kết quả tìm kiếm
          if (isSearched) {
            const filteredUpdatedBooks = filterBooks(updatedBooks, searchField, searchTerm);
            setFilteredBooks(filteredUpdatedBooks);
            setTotalPages(Math.ceil(filteredUpdatedBooks.length / booksPerPage));
            
            // Kiểm tra nếu trang hiện tại không còn dữ liệu (trang cuối) thì quay lại trang trước đó
            if (currentPage > Math.ceil(filteredUpdatedBooks.length / booksPerPage)) {
              setCurrentPage(Math.max(1, currentPage - 1));
            }
          } else {
            // Nếu không tìm kiếm, hiển thị lại tất cả sách
            setFilteredBooks(updatedBooks);
            setTotalPages(Math.ceil(updatedBooks.length / booksPerPage));
            
            // Kiểm tra trang hiện tại
            if (currentPage > Math.ceil(updatedBooks.length / booksPerPage)) {
              setCurrentPage(Math.max(1, currentPage - 1));
            }
          }
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

  // Hàm kiểm tra chuỗi có chứa từ khóa không (không phân biệt dấu, giữ nguyên khoảng trắng)
  const containsSearchTerm = (text, term) => {
    if (!text || !term) return false;
    
    // Chuẩn hóa chuỗi (loại bỏ dấu, chuyển thành chữ thường, giữ nguyên khoảng trắng)
    const textNormalized = normalizeSearchString(removeVietnameseAccents(String(text).toLowerCase()));
    const termNormalized = normalizeSearchString(removeVietnameseAccents(term.toLowerCase()));
    
    return textNormalized.includes(termNormalized);
  };

  // Hàm lọc sách - Đảm bảo tìm kiếm chính xác chuỗi (không phân biệt dấu, giữ nguyên khoảng trắng)
  const filterBooks = (booksArray, field, term) => {
    if (!term.trim()) {
      return booksArray; // Nếu không có từ khóa, trả về tất cả sách
    }

    const searchTermNormalized = normalizeSearchString(term);

    return booksArray.filter((book) => {
      // Tìm kiếm theo trường cụ thể
      if (field !== "all") {
        const value = book[field];
        // Kiểm tra giá trị có tồn tại không
        if (value === undefined || value === null) return false;
        // Sử dụng hàm containsSearchTerm để kiểm tra
        return containsSearchTerm(value, searchTermNormalized);
      } 
      
      // Tìm kiếm trong tất cả các trường
      return Object.keys(book).some(key => {
        // Chỉ tìm kiếm trong các trường có giá trị là chuỗi hoặc số
        if (book[key] !== null && (typeof book[key] === "string" || typeof book[key] === "number")) {
          return containsSearchTerm(book[key], searchTermNormalized);
        }
        return false;
      });
    });
  };

  // Xử lý sự kiện tìm kiếm
  const handleSearch = () => {
    const term = inputSearchTerm.trim().replace(/\s+/g, ' '); // Chuẩn hóa từ khóa tìm kiếm
    setSearchTerm(term); // Lưu từ khóa tìm kiếm
    
    if (!term) {
      // Nếu không có từ khóa, hiển thị tất cả sách
      setFilteredBooks(books);
      setIsSearched(false);
    } else {
      // Thực hiện tìm kiếm
      const results = filterBooks(books, searchField, term);
      setFilteredBooks(results);
      setIsSearched(true);
      
      // Debug thông tin tìm kiếm
      console.log(`Đã tìm kiếm với từ khóa "${term}" trong trường "${searchField}"`);
      console.log(`Tìm thấy ${results.length} kết quả`);
    }
    
    // Cập nhật số trang và quay về trang đầu tiên
    setTotalPages(Math.ceil((term ? filterBooks(books, searchField, term).length : books.length) / booksPerPage));
    setCurrentPage(1);
  };

  // Xử lý reset tìm kiếm
  const handleResetSearch = () => {
    setInputSearchTerm(""); // Xóa nội dung đang nhập
    setSearchTerm(""); // Xóa từ khóa tìm kiếm
    setSearchField("all");
    setFilteredBooks(books);
    setTotalPages(Math.ceil(books.length / booksPerPage));
    setCurrentPage(1);
    setIsSearched(false);
  };

  // Xử lý sắp xếp
  const handleSort = (field) => {
    // Nếu nhấp vào cùng một cột, đảo ngược hướng sắp xếp
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Sắp xếp sách
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    // Xác định giá trị để so sánh (chuyển đổi sang số nếu cần)
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Xử lý các trường hợp đặc biệt như số nguyên hoặc số
    if (sortField === "id" || sortField === "publishedYear" || sortField === "quantity" || sortField === "available") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    
    // So sánh các giá trị
    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Tính chỉ số bắt đầu và kết thúc của sách trên trang hiện tại
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);

  // Xử lý chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Xử lý thay đổi số lượng sách trên mỗi trang
  const handleBooksPerPageChange = (e) => {
    setBooksPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi số lượng sách trên trang
  };

  // Tạo biểu tượng sắp xếp
  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    if (sortDirection === "asc") return <span className="sort-icon active">↑</span>;
    return <span className="sort-icon active">↓</span>;
  };

  // Xử lý khi nhấn Enter trong ô tìm kiếm
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Tìm vị trí xuất hiện của từ khóa trong chuỗi (không phân biệt dấu, giữ nguyên khoảng trắng)
  const findTermPositions = (text, term) => {
    if (!text || !term) return [];
    
    const textStr = String(text);
    const textNormalized = removeVietnameseAccents(textStr.toLowerCase());
    const termNormalized = removeVietnameseAccents(term.toLowerCase());
    
    const positions = [];
    let lastIndex = 0;
    let index = textNormalized.indexOf(termNormalized, lastIndex);
    
    while (index !== -1) {
      positions.push({
        start: index,
        end: index + termNormalized.length
      });
      lastIndex = index + 1;
      index = textNormalized.indexOf(termNormalized, lastIndex);
    }
    
    return positions;
  };

  // Hàm để highlight từ khóa tìm kiếm trong chuỗi văn bản
  const highlightSearchTerm = (text, term) => {
    if (!isSearched || !term || typeof text !== 'string') return text;
    
    const textStr = String(text);
    const positions = findTermPositions(textStr, term);
    
    if (positions.length === 0) return textStr;
    
    let result = [];
    let lastEnd = 0;
    
    positions.forEach((pos, index) => {
      // Thêm phần văn bản trước từ khóa
      if (pos.start > lastEnd) {
        result.push(textStr.substring(lastEnd, pos.start));
      }
      
      // Thêm phần từ khóa được highlight
      result.push(
        <span key={index} className="highlight-search-term">
          {textStr.substring(pos.start, pos.end)}
        </span>
      );
      
      lastEnd = pos.end;
    });
    
    // Thêm phần văn bản còn lại sau từ khóa cuối cùng
    if (lastEnd < textStr.length) {
      result.push(textStr.substring(lastEnd));
    }
    
    return result;
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

      {/* Phần tìm kiếm */}
      <div className="search-container">
        <div className="search-field">
          <label htmlFor="searchField">Tìm kiếm theo:</label>
          <select 
            id="searchField" 
            value={searchField} 
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="id">ID</option>
            <option value="title">Tiêu đề</option>
            <option value="author">Tác giả</option>
            <option value="isbn">ISBN</option>
            <option value="genre">Thể loại</option>
            <option value="publishedYear">Năm xuất bản</option>
          </select>
        </div>
        <div className="search-input">
          <input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={inputSearchTerm}
            onChange={(e) => setInputSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="btn btn-search" onClick={handleSearch}>
            Tìm kiếm
          </button>
          <button className="btn btn-reset" onClick={handleResetSearch}>
            Đặt lại
          </button>
        </div>
      </div>

      {/* Hiển thị kết quả tìm kiếm */}
      {isSearched && searchTerm && (
        <div className="search-results">
          <p>Kết quả tìm kiếm cho "<span className="search-term">{searchTerm}</span>": {filteredBooks.length} sách</p>
        </div>
      )}

      {/* Phần điều chỉnh số lượng sách trên mỗi trang */}
      <div className="pagination-controls">
        <div className="books-per-page">
          <label htmlFor="booksPerPage">Số sách mỗi trang: </label>
          <select
            id="booksPerPage"
            value={booksPerPage}
            onChange={handleBooksPerPageChange}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("id")} className="sortable">
              ID {renderSortIcon("id")}
            </th>
            <th onClick={() => handleSort("title")} className="sortable">
              Tiêu đề {renderSortIcon("title")}
            </th>
            <th onClick={() => handleSort("author")} className="sortable">
              Tác giả {renderSortIcon("author")}
            </th>
            <th onClick={() => handleSort("isbn")} className="sortable">
              ISBN {renderSortIcon("isbn")}
            </th>
            <th onClick={() => handleSort("genre")} className="sortable">
              Thể loại {renderSortIcon("genre")}
            </th>
            <th onClick={() => handleSort("publishedYear")} className="sortable">
              Năm xuất bản {renderSortIcon("publishedYear")}
            </th>
            <th onClick={() => handleSort("quantity")} className="sortable">
              Số lượng {renderSortIcon("quantity")}
            </th>
            <th onClick={() => handleSort("available")} className="sortable">
              Còn lại {renderSortIcon("available")}
            </th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentBooks.length > 0 ? (
            currentBooks.map((book) => (
              <tr key={book.id}>
                <td>{isSearched ? highlightSearchTerm(book.id, searchTerm) : book.id}</td>
                <td>{isSearched ? highlightSearchTerm(book.title, searchTerm) : book.title}</td>
                <td>{isSearched ? highlightSearchTerm(book.author, searchTerm) : book.author}</td>
                <td>{isSearched ? highlightSearchTerm(book.isbn, searchTerm) : book.isbn}</td>
                <td>{isSearched ? highlightSearchTerm(book.genre, searchTerm) : book.genre}</td>
                <td>{isSearched ? highlightSearchTerm(book.publishedYear, searchTerm) : book.publishedYear}</td>
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
            ))
          ) : (
            <tr>
              <td colSpan="9" className="no-results">
                Không tìm thấy sách phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Thanh phân trang */}
      <div className="pagination">
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1 || sortedBooks.length === 0}
          className="pagination-button"
        >
          &laquo;
        </button>
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1 || sortedBooks.length === 0}
          className="pagination-button"
        >
          &lt;
        </button>
        
        <div className="page-info">
          Trang {currentPage} / {totalPages || 1}
        </div>
        
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages || sortedBooks.length === 0}
          className="pagination-button"
        >
          &gt;
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages || sortedBooks.length === 0}
          className="pagination-button"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}

export default BookList;
