import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../Components/TopBar";
import "./AdminDepartmentForms.css";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

function AdminDepartmentForms({ onLogout }) {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();

  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // ✅ ADDED: Edit modal state
  const [editingId, setEditingId] = useState(null); // ✅ ADDED: Track which department is being edited
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // ✅ ADDED: Update loading state
  const [isDeleting, setIsDeleting] = useState(null); // ✅ ADDED: Track which department is being deleted
  
  const [currentDept, setCurrentDept] = useState({ name: "", description: "" });
  const [editDept, setEditDept] = useState({ name: "", description: "" }); // ✅ ADDED: State for editing department
  
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({}); // ✅ ADDED: Separate errors for edit form

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }
      // if (!canAccessPage('departments')) {
      //   alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
      //   navigate("/dashboard");
      //   return;
      // }
      await fetchDepartments();
    };
    checkAuthAndFetch();
  }, [isAuthenticated, token, canAccessPage, navigate]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_SERVER_URL}/admin/department`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error(data.message || "Failed to fetch departments");
      }
      const normalized = Array.isArray(data.data)
        ? data.data.map(d => ({ id: d.id || d._id, ...d }))
        : [];
      setDepartments(normalized);
    } catch (err) {
      alert("विभाग लोड करने में त्रुटि: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Handle input change for add form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDept(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // ✅ ADDED: Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditDept(prev => ({ ...prev, [name]: value }));
    setEditErrors(prev => ({ ...prev, [name]: "" }));
  };

  // ✅ UPDATED: Validation for add form
  const validateForm = () => {
    const tempErrors = {};
    if (!currentDept.name.trim()) tempErrors.name = "यह फ़ील्ड आवश्यक है।";
    if (!currentDept.description.trim()) tempErrors.description = "यह फ़ील्ड आवश्यक है।";
    return tempErrors;
  };

  // ✅ ADDED: Validation for edit form
  const validateEditForm = () => {
    const tempErrors = {};
    if (!editDept.name.trim()) tempErrors.name = "यह फ़ील्ड आवश्यक है।";
    if (!editDept.description.trim()) tempErrors.description = "यह फ़ील्ड आवश्यक है।";
    return tempErrors;
  };

  // Handle add department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_SERVER_URL}/admin/department`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(currentDept),
      });
      const responseData = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        const msg = responseData.message || (responseData.errors?.map(e => e.msg).join(", ")) || "Failed to add department";
        throw new Error(msg);
      }
      const addedDept = responseData.data;
      setDepartments(prev => [...prev, { id: addedDept.id || addedDept._id, ...addedDept }]);
      setCurrentDept({ name: "", description: "" });
      setShowDeptModal(false);
      setErrors({});
      alert("विभाग सफलतापूर्वक जोड़ा गया!");
    } catch (error) {
      alert("विभाग जोड़ने में त्रुटि: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ADDED: Handle edit department (open edit modal)
  const handleEditDepartment = (dept) => {
    setEditingId(dept.id);
    setEditDept({
      name: dept.name || "",
      description: dept.description || "",
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  // ✅ ADDED: Handle update department (submit edit form)
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }

    try {
      setIsUpdating(true);
      console.log("📤 Updating department data:", editDept);
      
      const res = await fetch(`${BASE_SERVER_URL}/admin/department/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editDept),
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
          "Failed to update department";
        throw new Error(message);
      }

      const updatedDept = responseData.data;
      const normalizedDept = { id: updatedDept.id || updatedDept._id, ...updatedDept };
      
      // Update the department in the list
      setDepartments((prev) => prev.map(dept => 
        dept.id === editingId ? normalizedDept : dept
      ));

      // Reset edit form
      setEditDept({ name: "", description: "" });
      setShowEditModal(false);
      setEditingId(null);
      setEditErrors({});
      
      alert("विभाग सफलतापूर्वक अपडेट किया गया!");
    } catch (error) {
      console.error("Error updating department:", error);
      alert("विभाग अपडेट करने में त्रुटि: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ ADDED: Handle delete department
  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`क्या आप वाकई "${name}" विभाग को हटाना चाहते हैं?`)) {
      return;
    }

    if (!isAuthenticated || !token) {
      logout();
      navigate("/login");
      return;
    }

    try {
      setIsDeleting(id);
      const res = await fetch(`${BASE_SERVER_URL}/admin/department/${id}`, {
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
        
        // ✅ ADDED: Handle specific delete error messages (like department being used in work proposals)
        const message = responseData.message || "Failed to delete department";
        
        if (res.status === 400 && responseData.details) {
          // Show detailed error message for referential integrity issues
          const details = responseData.details;
          const suggestions = details.suggestions ? details.suggestions.join('\n• ') : '';
          alert(`${message}\n\nसुझाव:\n• ${suggestions}`);
          return;
        }
        
        throw new Error(message);
      }
      
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      alert("विभाग सफलतापूर्वक हटाया गया!");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("विभाग हटाने में त्रुटि: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // ✅ ADDED: Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditDept({ name: "", description: "" });
    setEditErrors({});
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="admin-main-content" style={{ textAlign: "center", padding: "50px" }}>
          <i className="fa-solid fa-lock" style={{ fontSize: 24, color: "orange", marginBottom: 10 }} />
          <div style={{ color: "orange", marginBottom: 20 }}>प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।</div>
          <button className="admin-btn-primary" onClick={() => navigate("/login")}>लॉगिन पेज पर जाएं</button>
        </div>
      </div>
    );
  }

  // if (!canAccessPage('departments')) {
  //   return (
  //     <div className="admin-page-container">
  //       <div className="admin-page-header">
  //         <TopBar onLogout={onLogout} />
  //       </div>
  //       <div className="admin-main-content" style={{ textAlign: "center", padding: "50px" }}>
  //         <i className="fa-solid fa-ban" style={{ fontSize: 24, color: "red", marginBottom: 10 }} />
  //         <div style={{ color: "red", marginBottom: 20 }}>आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।</div>
  //         <button className="admin-btn-primary" onClick={() => navigate("/dashboard")}>डैशबोर्ड पर जाएं</button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="admin-page-container">
      <div className="header"><TopBar onLogout={onLogout} /></div>
      <div className="admin-main-content">
        <header className="admin-page-header"><h1>डिपार्टमेंट पृष्ठ</h1></header>
        <main>
          <div className="admin-controls">
            <button className="admin-btn-primary" onClick={() => setShowDeptModal(true)} disabled={isLoading}>
              {isLoading ? "लोड हो रहा है..." : "नया विभाग जोड़ें"}
            </button>
          </div>

          {/* ✅ ADD DEPARTMENT MODAL */}
          {showDeptModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content">
                <button
                  className="admin-modal-close-btn"
                  aria-label="Close"
                  onClick={() => { 
                    setShowDeptModal(false); 
                    setCurrentDept({ name: "", description: "" });
                    setErrors({}); 
                  }}
                  disabled={isLoading}
                >
                  ×
                </button>
                <h2>नया विभाग जोड़ें</h2>
                <form className="admin-user-form" onSubmit={handleAddDepartment}>
                  <input
                    type="text"
                    name="name"
                    placeholder="विभाग का नाम"
                    value={currentDept.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.name && <span className="admin-error-msg">{errors.name}</span>}
                  
                  <textarea
                    name="description"
                    placeholder="विभाग का विवरण"
                    rows={4}
                    value={currentDept.description}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.description && <span className="admin-error-msg">{errors.description}</span>}
                  
                  <button type="submit" className="admin-btn-primary" disabled={isLoading}>
                    {isLoading ? "जोड़ा जा रहा है..." : "विभाग जोड़ें"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ✅ ADDED: EDIT DEPARTMENT MODAL */}
          {showEditModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content">
                <button
                  className="admin-modal-close-btn"
                  aria-label="Close"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  ×
                </button>
                <h2>विभाग संपादित करें</h2>
                <form className="admin-user-form" onSubmit={handleUpdateDepartment}>
                  <input
                    type="text"
                    name="name"
                    placeholder="विभाग का नाम"
                    value={editDept.name}
                    onChange={handleEditInputChange}
                    disabled={isUpdating}
                  />
                  {editErrors.name && <span className="admin-error-msg">{editErrors.name}</span>}
                  
                  <textarea
                    name="description"
                    placeholder="विभाग का विवरण"
                    rows={4}
                    value={editDept.description}
                    onChange={handleEditInputChange}
                    disabled={isUpdating}
                  />
                  {editErrors.description && <span className="admin-error-msg">{editErrors.description}</span>}
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="submit" 
                      className="admin-btn-primary" 
                      disabled={isUpdating}
                      style={{ flex: 1 }}
                    >
                      {isUpdating ? "अपडेट हो रहा है..." : "अपडेट करें"}
                    </button>
                    <button 
                      type="button" 
                      className="admin-btn-secondary" 
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                      style={{ flex: 1 }}
                    >
                      रद्द करें
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <section className="admin-user-table-section" style={{ marginTop: 40 }}>
            <h2>विभाग सूची</h2>
            {isLoading ? (
              <p style={{ textAlign: "center", padding: 20 }}>लोड हो रहा है...</p>
            ) : departments.length === 0 ? (
              <p className="admin-empty-text">कोई विभाग उपलब्ध नहीं है। ऊपर नया विभाग जोड़ें।</p>
            ) : (
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>विभाग का नाम</th>
                    <th>विवरण</th>
                    <th>क्रियाएँ</th> {/* ✅ ADDED: Actions column */}
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.name}</td>
                      <td>{dept.description}</td>
                      <td>
                        {/* ✅ ADDED: Edit button */}
                        <button
                          className="btn-edit"
                          onClick={() => handleEditDepartment(dept)}
                          disabled={isUpdating || isDeleting === dept.id}
                          style={{ marginRight: '5px' }}
                        >
                          {isUpdating ? "..." : "संपादित करें"}
                        </button>
                        
                        {/* ✅ ADDED: Delete button */}
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          disabled={isDeleting === dept.id || isUpdating}
                        >
                          {isDeleting === dept.id ? "हटाया जा रहा है..." : "हटाएं"}
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
  );
}

export default AdminDepartmentForms; // ✅ FIXED: Removed duplicate export
