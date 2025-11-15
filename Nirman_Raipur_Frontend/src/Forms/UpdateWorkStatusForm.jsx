import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./UpdateWorkStatusForm.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function UpdateWorkStatusForm({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();
  
  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();
  
  // State management
  const [currentStatus, setCurrentStatus] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [workData, setWorkData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Status options
  const statusOptions = [
    "Work In Progress",
    "Work Completed", 
    "Work Cancelled",
    "Work Stopped",
    "Work Not Started"
  ];

  // ✅ Status colors for better UI
  const getStatusColor = (status) => {
    switch (status) {
      case "Work In Progress": return "#007bff";
      case "Work Completed": return "#28a745";
      case "Work Cancelled": return "#dc3545";
      case "Work Stopped": return "#fd7e14";
      case "Work Not Started": return "#6c757d";
      default: return "#6c757d";
    }
  };

  // ✅ Set Page Title and Check Authentication
  useEffect(() => {
    document.title = "निर्माण | कार्य स्थिति अपडेट";
    
    if (!workId) {
      alert("कार्य ID नहीं मिला। कृपया वापस जाएं।");
      navigate(-1);
      return;
    }
    
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate("/login");
      return;
    }

    fetchWorkData();
  }, [workId, navigate, isAuthenticated, token]);

  // ✅ FIXED: Fetch current work data with correct data structure
  const fetchWorkData = async () => {
    try {
      setIsLoading(true);
      console.log("📡 Fetching work data for ID:", workId);

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("📥 Full API response:", response.data);
      
      // ✅ FIXED: Access the nested data structure correctly
      const work = response.data.data; // Access data.data instead of just data
      console.log("📊 Work data extracted:", work);
      
      if (!work) {
        throw new Error("No work data found in response");
      }
      
      setWorkData(work);
      setCurrentStatus(work.currentStatus || "");
      setNewStatus(work.currentStatus || "");

    } catch (error) {
      console.error("❌ Error fetching work data:", error);
      
      if (error.response?.status === 401) {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        logout();
        navigate("/login");
      } else if (error.response?.status === 404) {
        alert("कार्य प्रस्ताव नहीं मिला।");
        navigate(-1);
      } else {
        alert("डेटा लोड करने में त्रुटि हुई।");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle status change
  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
    if (errors.newStatus) {
      setErrors(prev => ({ ...prev, newStatus: '' }));
    }
  };

  // ✅ Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!newStatus.trim()) {
      newErrors.newStatus = 'नई कार्य स्थिति चुनना आवश्यक है';
    }
    
    if (newStatus === currentStatus) {
      newErrors.newStatus = 'कृपया वर्तमान स्थिति से अलग स्थिति चुनें';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle status update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isAuthenticated || !token) {
      alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
      navigate("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("📤 Updating work status from", currentStatus, "to", newStatus);

      const response = await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}`,
        { currentStatus: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      console.log("✅ Status updated successfully:", response.data);
      
      // Update local state
      setCurrentStatus(newStatus);
      setWorkData(prev => ({ ...prev, currentStatus: newStatus }));
      
      alert(`कार्य स्थिति सफलतापूर्वक "${newStatus}" में बदल दी गई!`);

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (error) {
      console.error("❌ Status update error:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            alert(`डेटा त्रुटि: ${data.message || 'अवैध डेटा'}`);
            break;
          case 401:
            alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
            logout();
            navigate("/login");
            break;
          case 403:
            alert("आपको इस कार्य को करने की अनुमति नहीं है।");
            break;
          case 404:
            alert("कार्य प्रस्ताव नहीं मिला।");
            navigate(-1);
            break;
          default:
            alert(`सर्वर त्रुटि (${status}): ${data.message || 'अज्ञात त्रुटि'}`);
        }
      } else if (error.request) {
        alert("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।");
      } else {
        alert("स्थिति अपडेट करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      logout();
      navigate("/");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="update-work-status-container">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>कार्य स्थिति अपडेट</h2>
          </div>
        </div>
        <div className="update-work-status-wrap">
          <section className="update-work-status-panel">
            <div className="update-work-status-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
              <div style={{ color: 'orange', marginBottom: '20px' }}>
                प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
              </div>
              <button className="update-work-status-btn update-work-status-btn-primary" onClick={() => navigate('/login')}>
                <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="update-work-status-container">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>कार्य स्थिति अपडेट - Work ID: {workId}</h2>
          </div>
        </div>
        <div className="update-work-status-wrap">
          <section className="update-work-status-panel">
            <div className="update-work-status-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <div>डेटा लोड हो रहा है...</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="update-work-status-container">
      {/* Top bar */}
      <div className="header">
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>कार्य स्थिति अपडेट - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form card */}
      <div className="update-work-status-wrap">
        <section className="update-work-status-panel">
          <div className="update-work-status-panel-header">
            <h3>कार्य स्थिति अपडेट करें</h3>
          </div>
          
          <form className="update-work-status-body" onSubmit={handleUpdateStatus}>
            {/* Work Information */}
            {workData && (
              <div className="update-work-status-info-card">
                <h4>कार्य जानकारी</h4>
                <div className="update-work-status-info-grid">
                  <div className="update-work-status-info-item">
                    <label>कार्य का नाम:</label>
                    <span>{workData.nameOfWork || 'N/A'}</span>
                  </div>
                  <div className="update-work-status-info-item">
                    <label>सीरियल नंबर:</label>
                    <span>{workData.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="update-work-status-info-item">
                    <label>योजना:</label>
                    <span>{workData.scheme?.name || 'N/A'}</span>
                  </div>
                  <div className="update-work-status-info-item">
                    <label>विभाग:</label>
                    <span>{workData.workDepartment?.name || 'N/A'}</span>
                  </div>
                  <div className="update-work-status-info-item">
                    <label>नियुक्त इंजीनियर:</label>
                    <span>{workData.appointedEngineer?.fullName || 'N/A'}</span>
                  </div>
                  <div className="update-work-status-info-item">
                    <label>शहर:</label>
                    <span>{workData.city?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Status Display */}
            <div className="update-work-status-section">
              <div className="update-work-status-current-status">
                <h4>वर्तमान स्थिति</h4>
                <div 
                  className="update-work-status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(currentStatus),
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {currentStatus || 'स्थिति निर्धारित नहीं'}
                </div>
              </div>

              {/* New Status Selection */}
              <div className="update-work-status-new-status">
                <label className="update-work-status-form-label">
                  नई कार्य स्थिति <span className="update-work-status-req">*</span>
                </label>
                <select
                  name="newStatus"
                  value={newStatus}
                  onChange={handleStatusChange}
                  className={`update-work-status-form-input ${errors.newStatus ? 'error' : ''}`}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">-- नई स्थिति चुनें --</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.newStatus && (
                  <span className="update-work-status-error-text">{errors.newStatus}</span>
                )}
              </div>

              {/* Preview of new status */}
              {newStatus && newStatus !== currentStatus && (
                <div className="update-work-status-preview">
                  <h5>नई स्थिति:</h5>
                  <div 
                    className="update-work-status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(newStatus),
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '15px',
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {newStatus}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation message */}
            {newStatus && newStatus !== currentStatus && (
              <div className="update-work-status-confirmation">
                <div className="update-work-status-alert update-work-status-alert-info">
                  <i className="fa-solid fa-info-circle"></i>
                  कार्य स्थिति "<strong>{currentStatus}</strong>" से "<strong>{newStatus}</strong>" में बदल जाएगी।
                </div>
              </div>
            )}

            <div className="update-work-status-actions">
              <button 
                type="submit" 
                className="update-work-status-btn update-work-status-btn-primary"
                disabled={isSubmitting || !newStatus || newStatus === currentStatus}
              >
                {isSubmitting ? "अपडेट हो रहा है..." : "स्थिति अपडेट करें"}
              </button>
              <button
                type="button"
                className="update-work-status-btn update-work-status-btn-ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                रद्द करें
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
