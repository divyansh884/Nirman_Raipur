import React, { useState, useEffect } from "react";
import "./AdminUserForm.css";
import TopBar from "../Components/TopBar";
import "../App.css";

function AdminUserForm() {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "",           // must match backend allowed roles
    department: "",     // must be a valid department ObjectId string
    designation: "",
    contactNumber: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const authToken = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:3000/api/admin/user", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        const normalizedUsers = Array.isArray(data.data)
          ? data.data.map((u) => ({ id: u.id || u._id, ...u }))
          : [];
        setUsers(normalizedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!newUser.username.trim()) tempErrors.username = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.email.trim()) tempErrors.email = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.password.trim()) tempErrors.password = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.fullName.trim()) tempErrors.fullName = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.role.trim()) tempErrors.role = "भूमिका आवश्यक है।";
    if (!newUser.department.trim()) tempErrors.department = "विभाग आवश्यक है।";
    // Additional validations (e.g. contact number format) can be added here
    return tempErrors;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/admin/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newUser),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const message =
          responseData.message ||
          (responseData.errors && responseData.errors.map((e) => e.msg).join(", ")) ||
          "Failed to add user";
        throw new Error(message);
      }

      const addedUser = responseData.data;
      const normalizedUser = { id: addedUser.id || addedUser._id, ...addedUser };
      setUsers((prev) => [...prev, normalizedUser]);

      setNewUser({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "",
        department: "",
        designation: "",
        contactNumber: "",
      });
      setShowAddUser(false);
      setErrors({});
    } catch (error) {
      console.error("Error adding user:", error);
      alert(error.message); // Show error to user
    }
  };

  const handleDelete = async (id) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:3000/api/admin/user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("User deletion failed");
    }
  };

  return (
    <>
      <div className="admin-user-form">
        <div className="header">
          <TopBar />
        </div>

        <br />

        <div className="page-container">
          <header className="page-header">
            <h1>पंजीकरण पृष्ठ</h1>
          </header>

          <main className="main-content">
            <div className="controls">
              <button
                onClick={() => setShowAddUser(true)}
                className="btn-primary"
              >
                नया उपयोगकर्ता जोड़ें
              </button>
            </div>

            {showAddUser && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button
                    className="modal-close-btn"
                    onClick={() => setShowAddUser(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2>नया उपयोगकर्ता जोड़ें</h2>
                  <form className="user-form" onSubmit={handleAddUser}>
                    <input
                      type="text"
                      name="username"
                      placeholder="उपयोगकर्ता नाम"
                      value={newUser.username}
                      onChange={handleInputChange}
                    />
                    {errors.username && (
                      <span className="error-msg">{errors.username}</span>
                    )}

                    <input
                      type="email"
                      name="email"
                      placeholder="ईमेल"
                      value={newUser.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <span className="error-msg">{errors.email}</span>
                    )}

                    <input
                      type="password"
                      name="password"
                      placeholder="पासवर्ड"
                      value={newUser.password}
                      onChange={handleInputChange}
                    />
                    {errors.password && (
                      <span className="error-msg">{errors.password}</span>
                    )}

                    <input
                      type="text"
                      name="fullName"
                      placeholder="पूरा नाम"
                      value={newUser.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && (
                      <span className="error-msg">{errors.fullName}</span>
                    )}

                    <input
                      type="text"
                      name="role"
                      placeholder="भूमिका"
                      value={newUser.role}
                      onChange={handleInputChange}
                    />
                    {errors.role && (
                      <span className="error-msg">{errors.role}</span>
                    )}

                    <input
                      type="text"
                      name="department"
                      placeholder="विभाग"
                      value={newUser.department}
                      onChange={handleInputChange}
                    />
                    {errors.department && (
                      <span className="error-msg">{errors.department}</span>
                    )}

                    <input
                      type="text"
                      name="designation"
                      placeholder="पदनाम"
                      value={newUser.designation}
                      onChange={handleInputChange}
                    />

                    <input
                      type="text"
                      name="contactNumber"
                      placeholder="संपर्क नंबर"
                      value={newUser.contactNumber}
                      onChange={handleInputChange}
                    />

                    <center>
                      <button type="submit" className="btn-primary">
                        उपयोगकर्ता जोड़ें
                      </button>
                    </center>
                  </form>
                </div>
              </div>
            )}

            <section className="user-table-section">
              <h2>मौजूदा उपयोगकर्ता</h2>
              {users.length === 0 ? (
                <p className="empty-text">
                  कोई उपयोगकर्ता उपलब्ध नहीं है। ऊपर नया उपयोगकर्ता जोड़ें।
                </p>
              ) : (
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>उपयोगकर्ता नाम</th>
                      <th>ईमेल</th>
                      <th>पूरा नाम</th>
                      <th>भूमिका</th>
                      <th>विभाग</th>
                      <th>पदनाम</th>
                      <th>संपर्क नंबर</th>
                      <th>क्रियाएँ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(
                      ({
                        id,
                        username,
                        email,
                        fullName,
                        role,
                        department,
                        designation,
                        contactNumber,
                      }) => (
                        <tr key={id}>
                          <td>{username}</td>
                          <td>{email}</td>
                          <td>{fullName}</td>
                          <td>{role}</td>
                          <td>{department?.name || department}</td>
                          <td>{designation}</td>
                          <td>{contactNumber}</td>
                          <td>
                            <button
                              className="btn-danger"
                              onClick={() => handleDelete(id)}
                            >
                              हटाएं
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminUserForm;
