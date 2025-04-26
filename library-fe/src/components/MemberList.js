import React, { useEffect, useState } from "react";
import "../styles/MemberList.css"; // Tạo file CSS nếu cần
import { useNavigate } from "react-router-dom";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  // State cho sắp xếp
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // State cho tìm kiếm
  const [searchField, setSearchField] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inputSearchTerm, setInputSearchTerm] = useState("");
  const [isSearched, setIsSearched] = useState(false);

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
    // Gọi API để lấy danh sách thành viên
    fetch("http://localhost:5000/api/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        return response.json();
      })
      .then((data) => {
        setMembers(data);
        setFilteredMembers(data);
        setLoading(false);
        // Tính toán tổng số trang
        setTotalPages(Math.ceil(data.length / membersPerPage));
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [membersPerPage]);

  const handleEditMember = (id) => {
    navigate(`/members/update/${id}`); // Chuyển hướng đến trang cập nhật thành viên
  };

  const handleDeleteMember = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa thành viên này?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Xóa thành viên thành công!");
          // Cập nhật danh sách thành viên sau khi xóa
          const updatedMembers = members.filter((member) => member.id !== id);
          setMembers(updatedMembers);
          
          // Nếu đang tìm kiếm, cập nhật lại kết quả tìm kiếm
          if (isSearched) {
            const filteredUpdatedMembers = filterMembers(updatedMembers, searchField, searchTerm);
            setFilteredMembers(filteredUpdatedMembers);
            setTotalPages(Math.ceil(filteredUpdatedMembers.length / membersPerPage));
            
            // Kiểm tra nếu trang hiện tại không còn dữ liệu thì quay lại trang trước đó
            if (currentPage > Math.ceil(filteredUpdatedMembers.length / membersPerPage)) {
              setCurrentPage(Math.max(1, currentPage - 1));
            }
          } else {
            // Nếu không tìm kiếm, hiển thị lại tất cả thành viên
            setFilteredMembers(updatedMembers);
            setTotalPages(Math.ceil(updatedMembers.length / membersPerPage));
            
            // Kiểm tra trang hiện tại
            if (currentPage > Math.ceil(updatedMembers.length / membersPerPage)) {
              setCurrentPage(Math.max(1, currentPage - 1));
            }
          }
        } else {
          alert("Xóa thành viên thất bại!");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra!");
      }
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/members/${id}`); // Chuyển hướng đến trang chi tiết thành viên
  };

  // Hàm kiểm tra chuỗi có chứa từ khóa không (không phân biệt dấu)
  const containsSearchTerm = (text, term) => {
    if (!text || !term) return false;
    
    // Chuẩn hóa chuỗi (loại bỏ dấu, chuyển thành chữ thường)
    const textNormalized = normalizeSearchString(removeVietnameseAccents(String(text).toLowerCase()));
    const termNormalized = normalizeSearchString(removeVietnameseAccents(term.toLowerCase()));
    
    return textNormalized.includes(termNormalized);
  };

  // Hàm lọc thành viên theo từ khóa
  const filterMembers = (membersArray, field, term) => {
    if (!term.trim()) {
      return membersArray; // Nếu không có từ khóa, trả về tất cả thành viên
    }

    const searchTermNormalized = normalizeSearchString(term);

    return membersArray.filter((member) => {
      // Tìm kiếm theo trường cụ thể
      if (field !== "all") {
        // Xử lý trường hợp đặc biệt: isActive là boolean
        if (field === "isActive") {
          const valueStr = member[field] ? "hoạt động" : "không hoạt động";
          return containsSearchTerm(valueStr, searchTermNormalized);
        }
        
        // Xử lý trường hợp đặc biệt: createdAt là ngày
        if (field === "createdAt") {
          const dateStr = new Date(member[field]).toLocaleString();
          return containsSearchTerm(dateStr, searchTermNormalized);
        }
        
        const value = member[field];
        // Kiểm tra giá trị có tồn tại không
        if (value === undefined || value === null) return false;
        // Tìm kiếm thông thường
        return containsSearchTerm(value, searchTermNormalized);
      } 
      
      // Tìm kiếm trong tất cả các trường
      return Object.keys(member).some(key => {
        // Trường hợp đặc biệt: isActive
        if (key === "isActive") {
          const valueStr = member[key] ? "hoạt động" : "không hoạt động";
          return containsSearchTerm(valueStr, searchTermNormalized);
        }
        
        // Trường hợp đặc biệt: createdAt
        if (key === "createdAt") {
          const dateStr = new Date(member[key]).toLocaleString();
          return containsSearchTerm(dateStr, searchTermNormalized);
        }
        
        // Chỉ tìm kiếm trong các trường có giá trị là chuỗi hoặc số
        if (member[key] !== null && (typeof member[key] === "string" || typeof member[key] === "number")) {
          return containsSearchTerm(member[key], searchTermNormalized);
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
      // Nếu không có từ khóa, hiển thị tất cả thành viên
      setFilteredMembers(members);
      setIsSearched(false);
    } else {
      // Thực hiện tìm kiếm
      const results = filterMembers(members, searchField, term);
      setFilteredMembers(results);
      setIsSearched(true);
      
      // Debug thông tin tìm kiếm
      console.log(`Đã tìm kiếm với từ khóa "${term}" trong trường "${searchField}"`);
      console.log(`Tìm thấy ${results.length} kết quả`);
    }
    
    // Cập nhật số trang và quay về trang đầu tiên
    setTotalPages(Math.ceil((term ? filterMembers(members, searchField, term).length : members.length) / membersPerPage));
    setCurrentPage(1);
  };

  // Xử lý reset tìm kiếm
  const handleResetSearch = () => {
    setInputSearchTerm(""); // Xóa nội dung đang nhập
    setSearchTerm(""); // Xóa từ khóa tìm kiếm
    setSearchField("all");
    setFilteredMembers(members);
    setTotalPages(Math.ceil(members.length / membersPerPage));
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

  // Sắp xếp thành viên
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    // Xác định giá trị để so sánh
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Xử lý các trường hợp đặc biệt
    if (sortField === "id") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    } else if (sortField === "isActive") {
      // Sắp xếp theo trạng thái
      valueA = a[sortField] ? 1 : 0;
      valueB = b[sortField] ? 1 : 0;
    } else if (sortField === "createdAt") {
      // Sắp xếp theo ngày
      valueA = new Date(a[sortField]).getTime();
      valueB = new Date(b[sortField]).getTime();
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

  // Tính chỉ số bắt đầu và kết thúc của thành viên trên trang hiện tại
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = sortedMembers.slice(indexOfFirstMember, indexOfLastMember);

  // Xử lý chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Xử lý thay đổi số lượng thành viên trên mỗi trang
  const handleMembersPerPageChange = (e) => {
    setMembersPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset về trang đầu tiên
  };

  // Xử lý khi nhấn Enter trong ô tìm kiếm
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Tạo biểu tượng sắp xếp
  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="sort-icon">⇅</span>;
    if (sortDirection === "asc") return <span className="sort-icon active">↑</span>;
    return <span className="sort-icon active">↓</span>;
  };

  // Tìm vị trí xuất hiện của từ khóa trong chuỗi (không phân biệt dấu)
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
    <div className="member-list">
      <h1>Danh sách thành viên</h1>
      
      <div className="member-list-actions">
        <button className="btn btn-add" onClick={() => navigate("/members/add")}>
          Thêm thành viên
        </button>
        <button
          className="btn btn-register"
          onClick={() => navigate("/members/register-card")}
        >
          Đăng ký thẻ
        </button>
      </div>

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
            <option value="name">Tên</option>
            <option value="email">Email</option>
            <option value="role">Vai trò</option>
            <option value="phone">Số điện thoại</option>
            <option value="address">Địa chỉ</option>
            <option value="isActive">Trạng thái</option>
            <option value="createdAt">Ngày tạo</option>
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
          <p>Kết quả tìm kiếm cho "<span className="search-term">{searchTerm}</span>": {filteredMembers.length} thành viên</p>
        </div>
      )}

      {/* Phần điều chỉnh số lượng thành viên trên mỗi trang */}
      <div className="pagination-controls">
        <div className="members-per-page">
          <label htmlFor="membersPerPage">Số thành viên mỗi trang: </label>
          <select
            id="membersPerPage"
            value={membersPerPage}
            onChange={handleMembersPerPageChange}
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
            <th onClick={() => handleSort("name")} className="sortable">
              Tên {renderSortIcon("name")}
            </th>
            <th onClick={() => handleSort("email")} className="sortable">
              Email {renderSortIcon("email")}
            </th>
            <th onClick={() => handleSort("role")} className="sortable">
              Vai trò {renderSortIcon("role")}
            </th>
            <th onClick={() => handleSort("phone")} className="sortable">
              Số điện thoại {renderSortIcon("phone")}
            </th>
            <th onClick={() => handleSort("address")} className="sortable">
              Địa chỉ {renderSortIcon("address")}
            </th>
            <th onClick={() => handleSort("isActive")} className="sortable">
              Trạng thái {renderSortIcon("isActive")}
            </th>
            <th onClick={() => handleSort("createdAt")} className="sortable">
              Ngày tạo {renderSortIcon("createdAt")}
            </th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentMembers.length > 0 ? (
            currentMembers.map((member) => (
              <tr key={member.id}>
                <td>{isSearched ? highlightSearchTerm(member.id, searchTerm) : member.id}</td>
                <td>{isSearched ? highlightSearchTerm(member.name, searchTerm) : member.name}</td>
                <td>{isSearched ? highlightSearchTerm(member.email, searchTerm) : member.email}</td>
                <td>{isSearched ? highlightSearchTerm(member.role, searchTerm) : member.role}</td>
                <td>{isSearched ? highlightSearchTerm(member.phone, searchTerm) : member.phone}</td>
                <td>{isSearched ? highlightSearchTerm(member.address, searchTerm) : member.address}</td>
                <td>
                  {isSearched 
                    ? highlightSearchTerm(member.isActive ? "Hoạt động" : "Không hoạt động", searchTerm) 
                    : (member.isActive ? "Hoạt động" : "Không hoạt động")
                  }
                </td>
                <td>
                  {isSearched 
                    ? highlightSearchTerm(new Date(member.createdAt).toLocaleString(), searchTerm) 
                    : new Date(member.createdAt).toLocaleString()
                  }
                </td>
                <td>
                  <button
                    className="btn btn-view"
                    onClick={() => handleViewDetails(member.id)}
                  >
                    Xem
                  </button>
                  <button
                    className="btn btn-edit"
                    onClick={() => handleEditMember(member.id)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="no-results">
                Không tìm thấy thành viên phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Thanh phân trang */}
      <div className="pagination">
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1 || sortedMembers.length === 0}
          className="pagination-button"
        >
          &laquo;
        </button>
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1 || sortedMembers.length === 0}
          className="pagination-button"
        >
          &lt;
        </button>
        
        <div className="page-info">
          Trang {currentPage} / {totalPages || 1}
        </div>
        
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages || sortedMembers.length === 0}
          className="pagination-button"
        >
          &gt;
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages || sortedMembers.length === 0}
          className="pagination-button"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}

export default MemberList;