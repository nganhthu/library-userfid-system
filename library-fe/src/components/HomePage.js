import React from "react";
import "../styles/HomePage.css"; // Import CSS cho trang chủ

function HomePage() {
  return (
    <div className="home-page">
      {/* Banner */}
      <div className="banner">
        <h1>Chào mừng đến với Hệ thống Thư viện</h1>
        <p>Quản lý sách, thành viên, và thiết bị một cách dễ dàng và hiệu quả.</p>
      </div>

      {/* Thống kê */}
      <div className="statistics">
        <div className="stat-item">
          <h2>500+</h2>
          <p>Sách trong thư viện</p>
        </div>
        <div className="stat-item">
          <h2>200+</h2>
          <p>Thành viên</p>
        </div>
        <div className="stat-item">
          <h2>50+</h2>
          <p>Thiết bị quản lý</p>
        </div>
      </div>

      {/* Liên kết nhanh */}
      <div className="quick-links">
        <h2>Liên kết nhanh</h2>
        <div className="links">
          <a href="/books" className="link-item">Kho sách</a>
          <a href="/members" className="link-item">Danh sách thành viên</a>
          <a href="/check-in-out" className="link-item">Check-in/Check-out</a>
          <a href="/devices" className="link-item">Quản lý thiết bị</a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;