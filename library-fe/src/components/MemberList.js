import React, { useEffect, useState } from "react";
import "../styles/MemberList.css"; // Tạo file CSS nếu cần
import { useNavigate } from "react-router-dom";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
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
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  ;

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
          setMembers(members.filter((member) => member.id !== id)); // Cập nhật danh sách
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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="member-list">
      <h1>Danh sách thành viên</h1>
      <button className="btn btn-add" onClick={() => navigate("/members/add")}>
        Thêm thành viên
      </button>
      <button
        className="btn btn-register"
        onClick={() => navigate("/members/register-card")}
      >
        Đăng ký thẻ
      </button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Số điện thoại</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th> {/* Thêm cột Hành động */}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td>{member.phone}</td>
              <td>{member.address}</td>
              <td>{member.isActive ? "Hoạt động" : "Không hoạt động"}</td>
              <td>{new Date(member.createdAt).toLocaleString()}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MemberList;