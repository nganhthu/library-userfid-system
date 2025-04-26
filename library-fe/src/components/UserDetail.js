import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/UserDetail.css"; // Tạo file CSS nếu cần

function UserDetail() {
  const { id } = useParams(); // Lấy ID từ URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API để lấy thông tin chi tiết thành viên
    fetch(`http://localhost:5000/api/users/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data.data); // Lưu thông tin thành viên
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
    <div className="user-detail">
      <h1>Chi tiết thành viên</h1>
      <div className="user-info">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Tên:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Vai trò:</strong> {user.role}</p>
        <p><strong>Số điện thoại:</strong> {user.phone}</p>
        <p><strong>Địa chỉ:</strong> {user.address}</p>
        <p><strong>Trạng thái:</strong> {user.isActive ? "Hoạt động" : "Không hoạt động"}</p>
        <p><strong>Ngày tạo:</strong> {new Date(user.createdAt).toLocaleString()}</p>
        <p><strong>Ngày cập nhật:</strong> {new Date(user.updatedAt).toLocaleString()}</p>
      </div>
      <div className="user-cards">
        <h2>Thẻ liên kết:</h2>
        {user.cards && user.cards.length > 0 ? (
          <ul>
            {user.cards.map((card) => (
              <li key={card.id}>
                <p><strong>ID thẻ:</strong> {card.cardId}</p>
                <p><strong>Trạng thái:</strong> {card.isActive ? "Hoạt động" : "Không hoạt động"}</p>
                <p><strong>Lần sử dụng cuối:</strong> {new Date(card.lastUsed).toLocaleString()}</p>
                <p><strong>Ngày tạo:</strong> {new Date(card.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có thẻ liên kết.</p>
        )}
      </div>
      <button className="btn btn-back" onClick={() => navigate("/members")}>
        Quay lại danh sách thành viên
      </button>
    </div>
  );
}

export default UserDetail;