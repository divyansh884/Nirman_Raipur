import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function AdministrativeApprovalPage({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state - UPDATED with govtDistrictAS, without amount
  const [form, setForm] = useState({
    govtDistrictAS: "",
    approvalNumber: "",
    remarks: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "निर्माण | प्रशासकीय स्वीकृति";

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

  // Form validation - UPDATED for required fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.govtDistrictAS.trim()) {
      newErrors.govtDistrictAS = 'सरकार/जिला द्वारा ए.एस आवश्यक है';
    }
    
    if (!form.approvalNumber.trim()) {
      newErrors.approvalNumber = 'प्रशासकीय स्वीकृति क्रमांक आवश्यक है';
    }
    
    if (!form.remarks.trim()) {
      newErrors.remarks = 'टिप्पणी आवश्यक है';
    }
    
    if (!form.document) {
      newErrors.document = 'दस्तावेज़ संलग्न करना आवश्यक है';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      // Create FormData for file upload - UPDATED
      const formData = new FormData();
      
      // Add required fields
      formData.append("action", "approve"); // Auto-added
      formData.append("govtDistrictAS", form.govtDistrictAS); // Added back
      formData.append("approvalNumber", form.approvalNumber);
      formData.append("remarks", form.remarks);
      
      // Add document file (required)
      if (form.document) {
        formData.append("document", form.document);
      }

      // 🔍 DEBUG: Log the payload
      console.log("📤 Sending administrative approval data:");
      console.log("✅ Action:", "approve");
      console.log("✅ Govt/District AS:", form.govtDistrictAS);
      console.log("✅ Approval Number:", form.approvalNumber);
      console.log("✅ Remarks:", form.remarks);
      console.log("✅ Document:", form.document?.name);

      // Make API call using axios with FormData
      const response = await axios.post(
        `${BASE_SERVER_URL}/work-proposals/${workId}/administrative-approval`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // For file upload
            "Authorization": `Bearer ${token}`
          },
        }
      );

      // Success handling
      console.log("✅ Administrative approval submitted successfully:", response.data);
      alert("प्रशासकीय स्वीकृति सफलतापूर्वक सहेजी गई!");
      
      // Reset form
      setForm({
        govtDistrictAS: "",
        approvalNumber: "",
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
      console.error("❌ Administrative approval submission error:", err);
      
      // Handle different error scenarios
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.message || "सबमिट करने में त्रुटि हुई";
        
        if (status === 401) {
          alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
          logout();
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
            <h2>प्रशासकीय स्वीकृति</h2>
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
      {/* Header */}
      <div className="header">
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>प्रशासकीय स्वीकृति जोड़ें - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>प्रशासकीय स्वीकृति</h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  सरकार/जिला द्वारा ए.एस <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="govtDistrictAS"
                  className={`form-input ${errors.govtDistrictAS ? 'error' : ''}`}
                  placeholder="Commissioner, Raipur Municipal Corporation"
                  value={form.govtDistrictAS}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.govtDistrictAS && (
                  <span className="error-text">{errors.govtDistrictAS}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  प्रशासकीय स्वीकृति क्रमांक <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="approvalNumber"
                  className={`form-input ${errors.approvalNumber ? 'error' : ''}`}
                  placeholder="AA-RMC-2025-URBAN-47"
                  value={form.approvalNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.approvalNumber && (
                  <span className="error-text">{errors.approvalNumber}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              {/* Document Upload - Required */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  दस्तावेज़ संलग्न करें <span className="req">*</span>
                </label>
                <input
                  type="file"
                  name="document"
                  id="documentUpload"
                  className={`file-input ${errors.document ? 'error' : ''}`}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <label htmlFor="documentUpload" className="custom-file-label">
                  फ़ाइल चुनें
                </label>
                <span className="file-name">
                  {form.document ? form.document.name : "कोई फ़ाइल चयनित नहीं"}
                </span>
                {errors.document && (
                  <span className="error-text">{errors.document}</span>
                )}
              </div>
            </div>

            <div className="form-group full">
              <label className="form-label">
                टिप्पणी <span className="req">*</span>
              </label>
              <textarea
                name="remarks"
                className={`form-input textarea ${errors.remarks ? 'error' : ''}`}
                placeholder="Approved for the urban infrastructure upgrade project as per the technical committee's recommendation."
                rows={5}
                value={form.remarks}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.remarks && (
                <span className="error-text">{errors.remarks}</span>
              )}
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
