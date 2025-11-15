import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminUserForm.css";
import TopBar from "../Components/TopBar";
import "../App.css";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

function AdminUserForm({ onLogout }) {
  const navigate = useNavigate();
  
  // Get authentication from Zustand store
  const { token, isAuthenticated, logout, isAdmin, canAccessPage } = useAuthStore();
  
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false); // ✅ ADDED: Edit modal state
  const [editingUserId, setEditingUserId] = useState(null); // ✅ ADDED: Track which user is being edited
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "",
    department: "",
    designation: "",
    contactNumber: "",
  });
  const [editUser, setEditUser] = useState({ // ✅ ADDED: State for editing user
    username: "",
    email: "",
    fullName: "",
    role: "",
    department: "",
    designation: "",
    contactNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({}); // ✅ ADDED: Separate errors for edit form

  // ✅ Check authentication and fetch both users and departments
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // Check if user is authenticated
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }

      // Check if user can access users page (admin only)
      if (!canAccessPage('users')) {
        alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
        navigate("/dashboard");
        return;
      }

      await Promise.all([fetchUsers(), fetchDepartments()]);
    };

    checkAuthAndFetchData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Fetch departments for dropdown
  const fetchDepartments = async () => {
    if (!isAuthenticated || !token) return;

    try {
      console.log("📤 Fetching departments for dropdown...");
      
      const res = await fetch(`${BASE_SERVER_URL}/admin/department`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();
      console.log("📥 Departments API response:", data);

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error(data.message || 'Failed to fetch departments');
      }

      // Handle different response structures
      const departmentList = data.success ? data.data : (data.data || data || []);
      const normalizedDepartments = Array.isArray(departmentList) 
        ? departmentList.map((dept) => ({ 
            id: dept._id || dept.id, 
            name: dept.name || dept.workDeptName || dept.departmentName,
            ...dept 
          }))
        : [];

      setDepartments(normalizedDepartments);
      console.log("✅ Departments loaded:", normalizedDepartments);
    } catch (error) {
      console.error("❌ Failed to fetch departments:", error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    if (!isAuthenticated || !token) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_SERVER_URL}/admin/user`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error(data.message || 'Failed to fetch users');
      }

      const normalizedUsers = Array.isArray(data.data)
        ? data.data.map((u) => ({ id: u.id || u._id, ...u }))
        : [];
      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logout();
        navigate("/login");
      } else {
        alert("उपयोगकर्ता लोड करने में त्रुटि: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return '-';
    
    // If departmentId is already an object with name property
    if (typeof departmentId === 'object' && departmentId.name) {
      return departmentId.name;
    }
    
    // Find department by ID
    const department = departments.find(dept => 
      (dept.id === departmentId) || (dept._id === departmentId)
    );
    
    return department ? department.name : departmentId;
  };

  // ✅ UPDATED: Handle input change for both add and edit forms
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ ADDED: Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
    setEditErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ UPDATED: Validation for add form
  const validateForm = () => {
    let tempErrors = {};
    if (!newUser.username.trim()) tempErrors.username = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.email.trim()) tempErrors.email = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.password.trim()) tempErrors.password = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.fullName.trim()) tempErrors.fullName = "यह फ़ील्ड आवश्यक है।";
    if (!newUser.role.trim()) tempErrors.role = "भूमिका आवश्यक है।";
    if (!newUser.department.trim()) tempErrors.department = "विभाग आवश्यक है।";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newUser.email && !emailRegex.test(newUser.email)) {
      tempErrors.email = "वैध ईमेल पता दर्ज करें।";
    }
    
    return tempErrors;
  };

  // ✅ ADDED: Validation for edit form (password not required)
  const validateEditForm = () => {
    let tempErrors = {};
    if (!editUser.username.trim()) tempErrors.username = "यह फ़ील्ड आवश्यक है।";
    if (!editUser.email.trim()) tempErrors.email = "यह फ़ील्ड आवश्यक है।";
    if (!editUser.fullName.trim()) tempErrors.fullName = "यह फ़ील्ड आवश्यक है।";
    if (!editUser.role.trim()) tempErrors.role = "भूमिका आवश्यक है।";
    if (!editUser.department.trim()) tempErrors.department = "विभाग आवश्यक है।";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editUser.email && !emailRegex.test(editUser.email)) {
      tempErrors.email = "वैध ईमेल पता दर्ज करें।";
    }
    
    return tempErrors;
  };

  // Handle add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check authentication before adding user
    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📤 Submitting user data:", newUser);
      
      const res = await fetch(`${BASE_SERVER_URL}/admin/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        
        const message =
          responseData.message ||
          (responseData.errors && responseData.errors.map((e) => e.msg).join(", ")) ||
          "Failed to add user";
        throw new Error(message);
      }

      const addedUser = responseData.data;
      const normalizedUser = { id: addedUser.id || addedUser._id, ...addedUser };
      setUsers((prev) => [...prev, normalizedUser]);

      // Reset form
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
      
      alert("उपयोगकर्ता सफलतापूर्वक जोड़ा गया!");
    } catch (error) {
      console.error("Error adding user:", error);
      alert("उपयोगकर्ता जोड़ने में त्रुटि: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ADDED: Handle edit user (open edit modal)
  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUser({
      username: user.username || "",
      email: user.email || "",
      fullName: user.fullName || "",
      role: user.role || "",
      department: (typeof user.department === 'object' ? user.department._id || user.department.id : user.department) || "",
      designation: user.designation || "",
      contactNumber: user.contactNumber || "",
    });
    setEditErrors({});
    setShowEditUser(true);
  };

  // ✅ ADDED: Handle update user (submit edit form)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    // Check authentication before updating user
    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📤 Updating user data:", editUser);
      
      const res = await fetch(`${BASE_SERVER_URL}/admin/user/${editingUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        
        const message =
          responseData.message ||
          (responseData.errors && responseData.errors.map((e) => e.msg).join(", ")) ||
          "Failed to update user";
        throw new Error(message);
      }

      const updatedUser = responseData.data;
      const normalizedUser = { id: updatedUser.id || updatedUser._id, ...updatedUser };
      
      // Update the user in the list
      setUsers((prev) => prev.map(user => 
        user.id === editingUserId ? normalizedUser : user
      ));

      // Reset edit form
      setEditUser({
        username: "",
        email: "",
        fullName: "",
        role: "",
        department: "",
        designation: "",
        contactNumber: "",
      });
      setShowEditUser(false);
      setEditingUserId(null);
      setEditErrors({});
      
      alert("उपयोगकर्ता सफलतापूर्वक अपडेट किया गया!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("उपयोगकर्ता अपडेट करने में त्रुटि: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDelete = async (id) => {
    if (!window.confirm("क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?")) {
      return;
    }

    // Check authentication before deleting
    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_SERVER_URL}/admin/user/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        
        // ✅ ADDED: Handle specific delete error messages (like user being appointed as engineer)
        const message = responseData.message || "Failed to delete user";
        
        if (res.status === 400 && responseData.details) {
          // Show detailed error message for referential integrity issues
          const details = responseData.details;
          const suggestions = details.suggestions ? details.suggestions.join('\n• ') : '';
          alert(`${message}\n\nसुझाव:\n• ${suggestions}`);
          return;
        }
        
        throw new Error(message);
      }
      
      setUsers((prev) => prev.filter((user) => user.id !== id));
      alert("उपयोगकर्ता सफलतापूर्वक हटाया गया!");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("उपयोगकर्ता हटाने में त्रुटि: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ADDED: Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditUser(false);
    setEditingUserId(null);
    setEditUser({
      username: "",
      email: "",
      fullName: "",
      role: "",
      department: "",
      designation: "",
      contactNumber: "",
    });
    setEditErrors({});
  };

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-user-form">
        <div className="header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
            <div style={{ color: 'orange', marginBottom: '20px' }}>
              प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
            </div>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/login')}
            >
              लॉगिन पेज पर जाएं
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show permission error if user can't access this page
  if (!canAccessPage('users')) {
    return (
      <div className="admin-user-form">
        <div className="header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fa-solid fa-ban" style={{ fontSize: '24px', marginBottom: '10px', color: 'red' }}></i>
            <div style={{ color: 'red', marginBottom: '20px' }}>
              आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।
            </div>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
            >
              डैशबोर्ड पर जाएं
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-user-form">
        <div className="header">
          <TopBar onLogout={onLogout} />
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
                disabled={isLoading}
              >
                {isLoading ? "लोड हो रहा है..." : "नया उपयोगकर्ता जोड़ें"}
              </button>
            </div>

            {/* ✅ ADD USER MODAL */}
            {showAddUser && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button
                    className="modal-close-btn"
                    onClick={() => setShowAddUser(false)}
                    aria-label="Close"
                    disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                    {errors.fullName && (
                      <span className="error-msg">{errors.fullName}</span>
                    )}

                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    >
                      <option value="">भूमिका चुनें</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Administrative Approver">Administrative Approver</option>
                      <option value="Technical Approver">Technical Approver</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Tender Manager">Tender Manager</option>
                      <option value="Work Order Manager">Work Order Manager</option>
                    </select>
                    {errors.role && (
                      <span className="error-msg">{errors.role}</span>
                    )}

                    <select
                      name="department"
                      value={newUser.department}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    >
                      <option value="">-- विभाग चुनें --</option>
                      {departments.map((dept) => (
                        <option key={dept.id || dept._id} value={dept.id || dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <span className="error-msg">{errors.department}</span>
                    )}

                    <input
                      type="text"
                      name="designation"
                      placeholder="पदनाम"
                      value={newUser.designation}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />

                    <input
                      type="text"
                      name="contactNumber"
                      placeholder="संपर्क नंबर"
                      value={newUser.contactNumber}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />

                    <center>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? "जोड़ा जा रहा है..." : "उपयोगकर्ता जोड़ें"}
                      </button>
                    </center>
                  </form>
                </div>
              </div>
            )}

            {/* ✅ ADDED: EDIT USER MODAL */}
            {showEditUser && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button
                    className="modal-close-btn"
                    onClick={handleCancelEdit}
                    aria-label="Close"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                  <h2>उपयोगकर्ता संपादित करें</h2>
                  <form className="user-form" onSubmit={handleUpdateUser}>
                    <input
                      type="text"
                      name="username"
                      placeholder="उपयोगकर्ता नाम"
                      value={editUser.username}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    />
                    {editErrors.username && (
                      <span className="error-msg">{editErrors.username}</span>
                    )}

                    <input
                      type="email"
                      name="email"
                      placeholder="ईमेल"
                      value={editUser.email}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    />
                    {editErrors.email && (
                      <span className="error-msg">{editErrors.email}</span>
                    )}

                    <input
                      type="text"
                      name="fullName"
                      placeholder="पूरा नाम"
                      value={editUser.fullName}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    />
                    {editErrors.fullName && (
                      <span className="error-msg">{editErrors.fullName}</span>
                    )}

                    <select
                      name="role"
                      value={editUser.role}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    >
                      <option value="">भूमिका चुनें</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Administrative Approver">Administrative Approver</option>
                      <option value="Technical Approver">Technical Approver</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Tender Manager">Tender Manager</option>
                      <option value="Work Order Manager">Work Order Manager</option>
                    </select>
                    {editErrors.role && (
                      <span className="error-msg">{editErrors.role}</span>
                    )}

                    <select
                      name="department"
                      value={editUser.department}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    >
                      <option value="">-- विभाग चुनें --</option>
                      {departments.map((dept) => (
                        <option key={dept.id || dept._id} value={dept.id || dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {editErrors.department && (
                      <span className="error-msg">{editErrors.department}</span>
                    )}

                    <input
                      type="text"
                      name="designation"
                      placeholder="पदनाम"
                      value={editUser.designation}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    />

                    <input
                      type="text"
                      name="contactNumber"
                      placeholder="संपर्क नंबर"
                      value={editUser.contactNumber}
                      onChange={handleEditInputChange}
                      disabled={isLoading}
                    />

                    <center>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading}
                        style={{ marginRight: '10px' }}
                      >
                        {isLoading ? "अपडेट हो रहा है..." : "अपडेट करें"}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        रद्द करें
                      </button>
                    </center>
                  </form>
                </div>
              </div>
            )}

            <section className="user-table-section">
              <h2>मौजूदा उपयोगकर्ता</h2>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>लोड हो रहा है...</p>
                </div>
              ) : users.length === 0 ? (
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
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.fullName}</td>
                        <td>{user.role}</td>
                        <td>{getDepartmentName(user.department)}</td>
                        <td>{user.designation}</td>
                        <td>{user.contactNumber}</td>
                        <td>
                          {/* ✅ ADDED: Edit button */}
                          <button
                            className="btn-edit"
                            onClick={() => handleEditUser(user)}
                            disabled={isLoading}
                          >
                            {isLoading ? "..." : "संपादित करें"}
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDelete(user.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? "..." : "हटाएं"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
