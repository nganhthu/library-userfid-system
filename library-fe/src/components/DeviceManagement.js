import React, { useState, useEffect } from "react";
import "../styles/DeviceManagement.css"; // Tạo file CSS nếu cần

function DeviceManagement() {
  const [devices, setDevices] = useState([]); // Lưu danh sách thiết bị
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gọi API để lấy danh sách thiết bị
    fetch("http://localhost:5000/api/devices")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch devices");
        }
        return response.json();
      })
      .then((data) => {
        setDevices(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDeleteDevice = async (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:5000/api/devices/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Xóa thiết bị thành công!");
          // Cập nhật danh sách thiết bị sau khi xóa
          setDevices(devices.filter((device) => device.id !== id));
        } else {
          alert("Xóa thiết bị thất bại!");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Có lỗi xảy ra!");
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="device-management">
      <h1>Quản lý thiết bị</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên thiết bị</th>
            <th>Loại</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.id}</td>
              <td>{device.name}</td>
              <td>{device.type}</td>
              <td>{device.status}</td>
              <td>
                <button
                  className="btn btn-delete"
                  onClick={() => handleDeleteDevice(device.id)}
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

export default DeviceManagement;