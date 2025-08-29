import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js'; // Import Zustand store

export default function TechnicalApprovalPage({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state
  const [form, setForm] = useState({
    technicalApprovalNumber: "",
    technicalApprovalDate: "",
    amountSanctioned: "",
    forwardingDate: "",
    remarks: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "निर्माण | तकनीकी स्वीकृति";

    // Check authentication on component mount
    const checkAuth = () => {
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }
    };

    checkAuth();
  }, [isAuthenticated, token, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "document") {
      setForm((prev) => ({ ...prev, document: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.technicalApprovalNumber.trim()) {
      newErrors.technicalApprovalNumber = 'तकनीकी स्वीकृति क्रमांक आवश्यक है';
    }
    
    if (!form.amountSanctioned || parseFloat(form.amountSanctioned) <= 0) {
      newErrors.amountSanctioned = 'वैध राशि दर्ज करें';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      logout(); // Use Zustand logout function
      navigate("/");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check authentication using Zustand store
    if (!isAuthenticated || !token) {
      alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ AUTOMATICALLY ADD "action": "approve" when submit button is clicked
      const payload = {
        action: "approve", // ← This is AUTOMATICALLY added - no user input needed!
        approvalNumber: form.technicalApprovalNumber,
        amountOfTechnicalSanction: parseFloat(form.amountSanctioned),
        remarks: form.remarks || ""
      };

      // 🔍 DEBUG: Log the payload to verify "action" field is included
      console.log("📤 Sending payload to backend:", payload);
      console.log("✅ Action field automatically added:", payload.action);

      // ✅ Updated API call using token from Zustand store
      const response = await axios.post(
        `http://localhost:3000/api/work-proposals/${workId}/technical-approval`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Use token from Zustand store
          },
        }
      );

      // Handle document upload separately if needed
      if (form.document) {
        try {
          const fileFormData = new FormData();
          fileFormData.append("document", form.document);
          console.log("📁 Document will be handled separately:", form.document.name);
        } catch (fileError) {
          console.warn("⚠️ Document upload failed:", fileError);
          // Don't fail the main submission for document upload issues
        }
      }

      // Success handling
      console.log("✅ Technical approval submitted successfully:", response.data);
      alert("तकनीकी स्वीकृति सफलतापूर्वक सहेजी गई!");
      
      // Reset form
      setForm({
        technicalApprovalNumber: "",
        technicalApprovalDate: "",
        amountSanctioned: "",
        forwardingDate: "",
        remarks: "",
        document: null,
      });
      
      // Clear file input
      const fileInput = document.getElementById("documentUpload");
      if (fileInput) {
        fileInput.value = "";
      }

      // Navigate back
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err) {
      console.error("❌ Technical approval submission error:", err);
      
      // Handle different error scenarios
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.message || "सबमिट करने में त्रुटि हुई";
        
        if (status === 401) {
          alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
          logout(); // Use Zustand logout function
          navigate("/login");
        } else if (status === 403) {
          alert("आपको इस कार्य को करने की अनुमति नहीं है।");
        } else if (status === 404) {
          alert("कार्य प्रस्ताव नहीं मिला। कृपया वैध कार्य ID सुनिश्चित करें।");
        } else if (status === 400) {
          alert(`डेटा त्रुटि: ${errorMessage}`);
        } else {
          alert(`त्रुटि: ${errorMessage}`);
        }
      } else if (err.request) {
        alert("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।");
      } else {
        alert("सबमिट करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>तकनीकी स्वीकृति</h2>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
              <div style={{ color: 'orange', marginBottom: '20px' }}>
                प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="workorder-page">
      {/* Top bar */}
      <div className="header">
        <TopBar onLogout={onLogout} />

        <div className="subbar">
          <span className="dot" />
          <h2>तकनीकी स्वीकृति जोड़ें - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>तकनीकी स्वीकृति</h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  तकनीकी स्वीकृति क्रमांक <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="technicalApprovalNumber"
                  className={`form-input ${errors.technicalApprovalNumber ? 'error' : ''}`}
                  placeholder="TA-CIVIL-2025-045"
                  value={form.technicalApprovalNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.technicalApprovalNumber && (
                  <span className="error-text">{errors.technicalApprovalNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  तकनीकी स्वीकृति दिनांक
                </label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    name="technicalApprovalDate"
                    className="form-input"
                    value={form.technicalApprovalDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="cal-ic" aria-hidden="true">
                    📅
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  तकनीकी स्वीकृति राशि (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amountSanctioned"
                  className={`form-input ${errors.amountSanctioned ? 'error' : ''}`}
                  placeholder="14200000"
                  value={form.amountSanctioned}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.amountSanctioned && (
                  <span className="error-text">{errors.amountSanctioned}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">प्रेषण दिनांक</label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    name="forwardingDate"
                    className="form-input"
                    value={form.forwardingDate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="cal-ic" aria-hidden="true">
                    📅
                  </span>
                </div>
              </div>

              {/* File upload - Optional (for future enhancement) */}
              <div className="form-group file-input-wrapper">
                <label>दस्तावेज़ संलग्न करें (वैकल्पिक):</label>
                <input
                  type="file"
                  name="document"
                  id="documentUpload"
                  className="file-input"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="documentUpload" className="custom-file-label">
                  फ़ाइल चुनें
                </label>
                <span className="file-name">
                  {form.document ? form.document.name : "कोई फ़ाइल चयनित नहीं"}
                </span>
                <small className="help-text">
                  नोट: दस्तावेज़ अपलोड अलग से संभाला जाएगा
                </small>
              </div>
            </div>

            <div className="form-group full">
              <label className="form-label">टिप्पणी</label>
              <textarea
                name="remarks"
                className="form-input textarea"
                placeholder="Approved, subject to the procurement of specified Grade-A materials. All other technical parameters are cleared."
                rows={5}
                value={form.remarks}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
                title="क्लिक करने पर automatically action: 'approve' भेजा जाएगा"
              >
                {isSubmitting ? "सबमिट हो रहा है..." : "Submit & Approve"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
