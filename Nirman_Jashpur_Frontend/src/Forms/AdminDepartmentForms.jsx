import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../Components/TopBar";
import "./AdminDepartmentForms.css";
import useAuthStore from '../Store/useAuthStore.js';

function AdminDepartmentForms({ onLogout }) {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();

  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDept, setCurrentDept] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }
    //   if (!canAccessPage('departments')) {
    //     alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
    //     navigate("/dashboard");
    //     return;
    //   }
      await fetchDepartments();
    };
    checkAuthAndFetch();
  }, [isAuthenticated, token, canAccessPage, navigate]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/admin/department/departments", {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDept(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!currentDept.name.trim()) tempErrors.name = "यह फ़ील्ड आवश्यक है।";
    if (!currentDept.description.trim()) tempErrors.description = "यह फ़ील्ड आवश्यक है।";
    return tempErrors;
  };

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
      const res = await fetch("http://localhost:3000/api/admin/department/departments", {
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

//   if (!canAccessPage('departments')) {
//     return (
//       <div className="admin-page-container">
//         <div className="admin-page-header">
//           <TopBar onLogout={onLogout} />
//         </div>
//         <div className="admin-main-content" style={{ textAlign: "center", padding: "50px" }}>
//           <i className="fa-solid fa-ban" style={{ fontSize: 24, color: "red", marginBottom: 10 }} />
//           <div style={{ color: "red", marginBottom: 20 }}>आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।</div>
//           <button className="admin-btn-primary" onClick={() => navigate("/dashboard")}>डैशबोर्ड पर जाएं</button>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header"><TopBar onLogout={onLogout} /></div>
      <div className="admin-main-content">
        <header className="admin-page-header"><h1>डिपार्टमेंट पृष्ठ</h1></header>
        <main>
          <div className="admin-controls">
            <button className="admin-btn-primary" onClick={() => setShowDeptModal(true)} disabled={isLoading}>
              {isLoading ? "लोड हो रहा है..." : "नया विभाग जोड़ें"}
            </button>
          </div>
          {showDeptModal && (
            <div className="admin-modal-overlay">
              <div className="admin-modal-content">
                <button
                  className="admin-modal-close-btn"
                  aria-label="Close"
                  onClick={() => { setShowDeptModal(false); setErrors({}); }}
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
                    विभाग जोड़ें
                  </button>
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
                  </tr>
                </thead>
                <tbody>
                  {departments.map(({ id, name, description }) => (
                    <tr key={id}>
                      <td>{name}</td>
                      <td>{description}</td>
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

export default AdminDepartmentForms;
