import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import HomePage from "./components/HomePage"; 
import BorrowBook from "./components/BorrowBook";
import ReturnBook from "./components/ReturnBook";
import BookList from "./components/BookList";
import AddBook from "./components/AddBook";
import BookDetail from "./components/BookDetail"; 
import BookUpdate from "./components/BookUpdate";
import MemberList from "./components/MemberList";
import UserDetail from "./components/UserDetail"; 
import UserUpdate from "./components/UserUpdate";
import MemberAdd from "./components/MemberAdd"; 
import CardRegister from "./components/CardRegister";
import AddBookRFID from "./components/AddBookRFID"; 
import CheckInOut from "./components/CheckInOut";
import DeviceManagement from "./components/DeviceManagement";
import "./App.css"; // Import file CSS
import logo from "./images/logo.png"; // Import logo
import profileIcon from "./images/profile-icon.png"; // Import ảnh profile




function App() {
  
  return (
    <Router>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <img src={logo} alt="Library Logo" />
          <h2>Library</h2>
        </div>
        <div className="navbar-links">
          <Link to="/">Trang chủ</Link>
          <Link to="/books">Kho sách</Link>
          <Link to="/members">Danh sách thành viên</Link>
          <Link to="/check-in-out">Check-in/Check-out</Link>
          <Link to="/borrow">Mượn sách</Link>
          <Link to="/return">Trả sách</Link>
          <Link to="/devices">Quản lý thiết bị</Link>
          
        </div>
        <div className="navbar-profile">
          <img src={profileIcon} alt="Profile" />
        </div>
      </nav>

      {/* Nội dung trang */}
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/books/update/:id" element={<BookUpdate />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/add-book-rfid" element={<AddBookRFID />} />
          <Route path="/borrow" element={<BorrowBook />} />
          <Route path="/return" element={<ReturnBook />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/:id" element={<UserDetail />} />
          <Route path="/members/update/:id" element={<UserUpdate />} />
          <Route path="/members/add" element={<MemberAdd />} />
          <Route path="/members/register-card" element={<CardRegister />} />
          <Route path="/check-in-out" element={<CheckInOut />} /> 
          <Route path="/devices" element={<DeviceManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
