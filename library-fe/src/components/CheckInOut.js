import React, { useState, useEffect, useCallback } from "react";
import socket from "../socket"; // Import socket để nhận thông báo từ Backend
import "../styles/CheckInOut.css"; // Import CSS

function CheckInOut() {
  const [rfidId, setRfidId] = useState(null); // Lưu ID thẻ RFID
  const [message, setMessage] = useState(""); // Thông báo từ Backend
  const [faceImage, setFaceImage] = useState(null); // Ảnh khuôn mặt người dùng
  const [result, setResult] = useState(""); // Kết quả Check-in/Check-out
  const [attendanceList, setAttendanceList] = useState([]); // Danh sách thành viên ra vào thư viện
  const [loading, setLoading] = useState(false); // Trạng thái loading

  // THÊM MỚI: State cho phân trang và tìm kiếm
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredAttendanceList, setFilteredAttendanceList] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  
  // THÊM MỚI: State cho tìm kiếm
  const [searchField, setSearchField] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inputSearchTerm, setInputSearchTerm] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  
  // THÊM MỚI: State cho sắp xếp
  const [sortField, setSortField] = useState("checkInTime");
  const [sortDirection, setSortDirection] = useState("desc");

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

  // Lấy danh sách thành viên ra vào thư viện từ API
  const fetchAttendanceList = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/attendance/attendances");
      if (response.ok) {
        const responseData = await response.json();
        console.log("API Response:", responseData); // Debug: Kiểm tra dữ liệu trả về
        
        // Kiểm tra cấu trúc dữ liệu trả về từ API và lấy dữ liệu đúng
        let attendanceData = [];
        
        if (responseData && responseData.success && Array.isArray(responseData.data)) {
          // Đúng cấu trúc API: { success, message, data }
          attendanceData = responseData.data;
          console.log("Lấy dữ liệu từ responseData.data:", attendanceData.length, "bản ghi");
        } else if (Array.isArray(responseData)) {
          // Trường hợp API trả về trực tiếp mảng dữ liệu
          attendanceData = responseData;
          console.log("Lấy dữ liệu từ mảng responseData:", attendanceData.length, "bản ghi");
        } else {
          console.error("Định dạng dữ liệu không đúng:", responseData);
          attendanceData = [];
        }
        
        // Log mẫu dữ liệu đầu tiên để kiểm tra cấu trúc
        if (attendanceData.length > 0) {
          console.log("Mẫu dữ liệu bản ghi đầu tiên:", attendanceData[0]);
        }
        
        setAttendanceList(attendanceData);
        setFilteredAttendanceList(attendanceData); // Khởi tạo danh sách lọc ban đầu
        setTotalPages(Math.ceil(attendanceData.length / itemsPerPage));
      } else {
        console.error("Không thể lấy danh sách điểm danh:", response.status);
        setAttendanceList([]);
        setFilteredAttendanceList([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching attendance list:", error);
      setAttendanceList([]);
      setFilteredAttendanceList([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Thêm useEffect để cập nhật filteredAttendanceList khi attendanceList thay đổi
  useEffect(() => {
    if (Array.isArray(attendanceList)) {
      // Chỉ cập nhật khi không trong chế độ tìm kiếm
      if (!isSearched) {
        setFilteredAttendanceList(attendanceList);
        setTotalPages(Math.ceil(attendanceList.length / itemsPerPage));
      }
    }
  }, [attendanceList, isSearched, itemsPerPage]);

  useEffect(() => {
    // Lấy danh sách ban đầu khi component được tải
    fetchAttendanceList();

    // Lắng nghe thông báo từ Backend qua Socket.IO
    socket.on("rfid_scanned", async (data) => {
      try {
        console.log("RFID scanned event received:", data); // Debug: nhận sự kiện quét RFID
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
      console.log("Check in/out result received:", data); // Debug: nhận kết quả checkin/checkout
      setResult(data.message); // Hiển thị kết quả Check-in/Check-out
      
      // Cập nhật lại danh sách thành viên sau khi có người check-in hoặc check-out
      fetchAttendanceList();
    });

    // Lắng nghe sự kiện cập nhật danh sách từ backend
    socket.on("attendance_updated", () => {
      console.log("Attendance updated event received"); // Debug: nhận sự kiện cập nhật
      fetchAttendanceList();
    });

    return () => {
      socket.off("rfid_scanned");
      socket.off("check_in_out_result");
      socket.off("attendance_updated");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // THÊM MỚI: Kiểm tra chuỗi có chứa từ khóa không (không phân biệt dấu)
  const containsSearchTerm = (text, term) => {
    if (!text || !term) return false;
    
    // Chuẩn hóa chuỗi (loại bỏ dấu, chuyển thành chữ thường)
    const textNormalized = normalizeSearchString(removeVietnameseAccents(String(text).toLowerCase()));
    const termNormalized = normalizeSearchString(removeVietnameseAccents(term.toLowerCase()));
    
    return textNormalized.includes(termNormalized);
  };

  // THÊM MỚI: Hàm lọc danh sách điểm danh theo từ khóa
  const filterAttendanceList = useCallback((list, field, term) => {
    if (!term.trim() || !Array.isArray(list)) {
      return list || []; // Nếu không có từ khóa hoặc list không phải mảng, trả về list hoặc mảng rỗng
    }

    const searchTermNormalized = normalizeSearchString(term);

    return list.filter((item) => {
      // Tìm kiếm theo trường cụ thể
      if (field !== "all") {
        // Xử lý các trường của User
        if (field === "name") {
          return containsSearchTerm(item.User?.name, searchTermNormalized);
        } else if (field === "email") {
          return containsSearchTerm(item.User?.email, searchTermNormalized);
        } else if (field === "role") {
          // Role không có trong dữ liệu trả về
          return false;
        } else if (field === "status") {
          // Xử lý trường status
          const statusText = item.status === 'check-in' ? 'đang trong thư viện' : 'đã rời thư viện';
          return containsSearchTerm(statusText, searchTermNormalized);
        } else if (field === "rfidId") {
          // Lấy cardId từ User.Cards nếu có
          const cardId = getCardId(item.User);
          return containsSearchTerm(cardId, searchTermNormalized);
        } else if (field === "checkInTime") {
          return containsSearchTerm(new Date(item.checkInTime).toLocaleString(), searchTermNormalized);
        } else if (field === "checkOutTime") {
          if (!item.checkOutTime) {
            return containsSearchTerm("chưa check-out", searchTermNormalized);
          }
          return containsSearchTerm(new Date(item.checkOutTime).toLocaleString(), searchTermNormalized);
        }
      } 
      
      // Tìm kiếm trong tất cả các trường
      // Tìm trong thông tin User
      const userContainsSearchTerm = 
        containsSearchTerm(item.User?.name, searchTermNormalized) ||
        containsSearchTerm(item.User?.email, searchTermNormalized);
      
      // Lấy cardId từ cấu trúc đúng
      const cardId = getCardId(item.User);
                     
      // Tìm trong các trường của Attendance
      const attendanceContainsSearchTerm = 
        containsSearchTerm(cardId, searchTermNormalized) ||
        containsSearchTerm(new Date(item.checkInTime).toLocaleString(), searchTermNormalized) ||
        (item.checkOutTime && containsSearchTerm(new Date(item.checkOutTime).toLocaleString(), searchTermNormalized)) ||
        (!item.checkOutTime && containsSearchTerm("chưa check-out", searchTermNormalized)) ||
        (item.status === 'check-in' && containsSearchTerm("đang trong thư viện", searchTermNormalized)) ||
        (item.status === 'check-out' && containsSearchTerm("đã rời thư viện", searchTermNormalized));
      
      return userContainsSearchTerm || attendanceContainsSearchTerm;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // THÊM MỚI: Hàm xử lý tìm kiếm - ĐÃ SỬA để giống MemberList
  const handleSearch = () => {
    const term = inputSearchTerm.trim().replace(/\s+/g, ' '); // Chuẩn hóa từ khóa tìm kiếm
    setSearchTerm(term); // Lưu từ khóa tìm kiếm
    
    // Đảm bảo attendanceList là mảng
    const list = Array.isArray(attendanceList) ? attendanceList : [];
    
    if (!term) {
      // Nếu không có từ khóa, hiển thị tất cả thành viên
      setFilteredAttendanceList(list);
      setIsSearched(false);
    } else {
      // Thực hiện tìm kiếm
      const results = filterAttendanceList(list, searchField, term);
      setFilteredAttendanceList(results);
      setIsSearched(true);
    }
    
    // Cập nhật số trang và quay về trang đầu tiên
    setTotalPages(Math.ceil((term ? filterAttendanceList(list, searchField, term).length : list.length) / itemsPerPage));
    setCurrentPage(1);
  };

  // THÊM MỚI: Xử lý reset tìm kiếm
  const handleResetFilters = () => {
    setInputSearchTerm(""); // Xóa nội dung đang nhập
    setSearchTerm(""); // Xóa từ khóa tìm kiếm
    setSearchField("all");
    
    // Đảm bảo attendanceList là mảng
    const list = Array.isArray(attendanceList) ? attendanceList : [];
    setFilteredAttendanceList(list);
    setTotalPages(Math.ceil(list.length / itemsPerPage));
    setCurrentPage(1);
    setIsSearched(false);
  };

  // THÊM MỚI: Xử lý sắp xếp
  const handleSort = useCallback((field) => {
    // Nếu nhấp vào cùng một cột, đảo ngược hướng sắp xếp
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  }, [sortField, sortDirection]);
  
  // THÊM MỚI: Tìm vị trí xuất hiện của từ khóa trong chuỗi
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

  // THÊM MỚI: Hàm để highlight từ khóa tìm kiếm trong chuỗi văn bản
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

  // THÊM MỚI: Xử lý khi nhấn Enter trong ô tìm kiếm
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // THÊM MỚI: Tạo biểu tượng sắp xếp
  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    if (sortDirection === "asc") return <span className="sort-icon active">↑</span>;
    return <span className="sort-icon active">↓</span>;
  };

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
        
        // Cập nhật lại danh sách thành viên sau khi xác thực thành công
        fetchAttendanceList();
        
        // Reset form sau khi xác thực thành công
        setTimeout(() => {
          setRfidId(null);
          setFaceImage(null);
          setResult("");
        }, 3000);
      } else {
        alert("Xác thực khuôn mặt thất bại!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Có lỗi xảy ra khi xác thực khuôn mặt!");
    }
  };

  // Hàm định dạng thời gian
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Chưa xác định";
    
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Hàm lấy card ID từ cấu trúc đối tượng User
  const getCardId = (user) => {
    if (!user) return "Không có thông tin";
    
    // Kiểm tra nếu Cards là một mảng (cấu trúc từ API)
    if (Array.isArray(user.Cards) && user.Cards.length > 0) {
      return user.Cards[0].cardId || "Chưa có thẻ";
    }
    
    // Trường hợp cũ
    if (Array.isArray(user.Card) && user.Card.length > 0) {
      return user.Card[0].cardId || "Chưa có thẻ";
    }
    
    // Nếu Card là một đối tượng
    if (user.Card && user.Card.cardId) {
      return user.Card.cardId;
    }
    
    return "Chưa có thẻ";
  };
  
  // THÊM MỚI: Sắp xếp danh sách - ĐẢM BẢO filteredAttendanceList là mảng
  const sortedAttendanceList = Array.isArray(filteredAttendanceList) ? 
    [...filteredAttendanceList].sort((a, b) => {
      // Xác định giá trị để so sánh
      let valueA, valueB;
      
      // Xử lý các trường khác nhau
      if (sortField.startsWith("User.")) {
        const userField = sortField.split(".")[1];
        valueA = a.User ? a.User[userField] : null;
        valueB = b.User ? b.User[userField] : null;
      } else if (sortField === "checkInTime" || sortField === "checkOutTime") {
        valueA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        valueB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }
      
      // So sánh các giá trị
      if (valueA === null || valueA === undefined) return sortDirection === "asc" ? -1 : 1;
      if (valueB === null || valueB === undefined) return sortDirection === "asc" ? 1 : -1;
      
      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    }) : [];
  
  // THÊM MỚI: Tính chỉ số bắt đầu và kết thúc của bản ghi trên trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAttendanceList.slice(indexOfFirstItem, indexOfLastItem);

  // THÊM MỚI: Hàm chuyển trang - định nghĩa ở một vị trí
  const paginate = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  return (
    <div className="check-in-out-container">
      <div className="check-in-out">
        <h1>Hệ thống Check-in/Check-out Thư Viện</h1>
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
      
      {/* Bảng danh sách thành viên ra vào thư viện */}
      <div className="attendance-list-container">
        <h2>Danh sách thành viên ra vào thư viện</h2>
        
        {/* THÊM MỚI: Khu vực tìm kiếm giống MemberList */}
        <div className="search-container">
          <div className="search-field">
            <label htmlFor="searchField">Tìm kiếm theo:</label>
            <select 
              id="searchField" 
              value={searchField} 
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="name">Tên thành viên</option>
              <option value="email">Email</option>
              <option value="rfidId">Mã thẻ RFID</option>
              <option value="checkInTime">Thời gian vào</option>
              <option value="checkOutTime">Thời gian ra</option>
              <option value="status">Trạng thái</option>
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
            <button className="btn btn-reset" onClick={handleResetFilters}>
              Đặt lại
            </button>
          </div>
        </div>

        {/* THÊM MỚI: Hiển thị kết quả tìm kiếm */}
        {isSearched && searchTerm && (
          <div className="search-results">
            <p>Kết quả tìm kiếm cho "<span className="search-term">{searchTerm}</span>": {filteredAttendanceList.length} bản ghi</p>
          </div>
        )}

        {/* THÊM MỚI: Phần điều chỉnh số lượng bản ghi trên mỗi trang */}
        <div className="pagination-controls">
          <div className="items-per-page">
            <label htmlFor="itemsPerPage">Số bản ghi mỗi trang: </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
                setTotalPages(Math.ceil((filteredAttendanceList || []).length / Number(e.target.value)));
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="sortable">
                    STT
                  </th>
                  <th onClick={() => handleSort("User.id")} className="sortable">
                    Mã thành viên {renderSortIcon("User.id")}
                  </th>
                  <th onClick={() => handleSort("rfidId")} className="sortable">
                    Mã thẻ RFID {renderSortIcon("rfidId")}
                  </th>
                  <th onClick={() => handleSort("User.name")} className="sortable">
                    Họ tên {renderSortIcon("User.name")}
                  </th>
                  <th onClick={() => handleSort("User.email")} className="sortable">
                    Email {renderSortIcon("User.email")}
                  </th>
                  <th onClick={() => handleSort("checkInTime")} className="sortable">
                    Thời gian vào {renderSortIcon("checkInTime")}
                  </th>
                  <th onClick={() => handleSort("checkOutTime")} className="sortable">
                    Thời gian ra {renderSortIcon("checkOutTime")}
                  </th>
                  <th onClick={() => handleSort("status")} className="sortable">
                    Trạng thái {renderSortIcon("status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={index} className={item.status === 'check-in' ? 'check-in-row' : 'check-out-row'}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{isSearched ? highlightSearchTerm(item.User?.id, searchTerm) : item.User?.id}</td>
                      <td>{isSearched ? highlightSearchTerm(getCardId(item.User), searchTerm) : getCardId(item.User)}</td>
                      <td>{isSearched ? highlightSearchTerm(item.User?.name, searchTerm) : item.User?.name}</td>
                      <td>{isSearched ? highlightSearchTerm(item.User?.email, searchTerm) : item.User?.email}</td>
                      <td>
                      {isSearched 
                          ? highlightSearchTerm(formatDateTime(item.checkInTime), searchTerm) 
                          : formatDateTime(item.checkInTime)
                        }
                      </td>
                      <td>
                        {item.checkOutTime 
                          ? (isSearched 
                              ? highlightSearchTerm(formatDateTime(item.checkOutTime), searchTerm)
                              : formatDateTime(item.checkOutTime))
                          : (isSearched 
                              ? highlightSearchTerm("Chưa check-out", searchTerm)
                              : "Chưa check-out")
                        }
                      </td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {isSearched 
                            ? highlightSearchTerm(item.status === 'check-in' ? 'Đang trong thư viện' : 'Đã rời thư viện', searchTerm)
                            : (item.status === 'check-in' ? 'Đang trong thư viện' : 'Đã rời thư viện')
                          }
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      {isSearched 
                        ? "Không tìm thấy bản ghi phù hợp với điều kiện tìm kiếm."
                        : "Chưa có dữ liệu điểm danh."
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* THÊM MỚI: Thanh phân trang giống MemberList */}
        {filteredAttendanceList.length > 0 && (
          <div className="pagination">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1 || sortedAttendanceList.length === 0}
              className="pagination-button"
            >
              &laquo;
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1 || sortedAttendanceList.length === 0}
              className="pagination-button"
            >
              &lt;
            </button>
            
            <div className="page-info">
              Trang {currentPage} / {totalPages || 1}
            </div>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || sortedAttendanceList.length === 0}
              className="pagination-button"
            >
              &gt;
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages || sortedAttendanceList.length === 0}
              className="pagination-button"
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckInOut;