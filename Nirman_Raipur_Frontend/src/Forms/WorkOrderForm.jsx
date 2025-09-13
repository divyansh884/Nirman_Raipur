import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function WorkOrderForm({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state - UPDATED to match required body structure
  const [form, setForm] = useState({
    workOrderNumber: "",
    contractorOrGramPanchayat: "",
    dateOfWorkOrder: "",
    remark: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "निर्माण | वर्क ऑर्डर प्रपत्र";
    
    // Debug workID
    console.log("🔍 Work Order Form - workID:", workId);
    
    if (!workId) {
      alert("कार्य ID नहीं मिला। कृपया वापस जाएं।");
      navigate(-1);
      return;
    }

    // Check authentication on component mount
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate("/login");
      return;
    }
  }, [workId, navigate, isAuthenticated, token]);

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

  // Form validation - UPDATED for required fields only
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.workOrderNumber.trim()) {
      newErrors.workOrderNumber = 'वर्क ऑर्डर संख्या आवश्यक है';
    }
    
    if (!form.contractorOrGramPanchayat.trim()) {
      newErrors.contractorOrGramPanchayat = 'ठेकेदार/ग्राम पंचायत का नाम आवश्यक है';
    }
    
    if (!form.dateOfWorkOrder) {
      newErrors.dateOfWorkOrder = 'वर्क ऑर्डर दिनांक आवश्यक है';
    }
    
    if (!form.remark.trim()) {
      newErrors.remark = 'टिप्पणी आवश्यक है';
    }
    
    // if (!form.document) {
    //   newErrors.document = 'दस्तावेज़ संलग्न करना आवश्यक है';
    // }

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
    
    try {
      // ✅ Step 1: Form validation
      if (!validateForm()) {
        return;
      }

      // ✅ Step 2: Authentication check using Zustand store
      if (!isAuthenticated || !token) {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        navigate("/login");
        return;
      }

      // ✅ Step 3: WorkID validation
      if (!workId) {
        alert("कार्य ID नहीं मिला। कृपया पेज रीलोड करें।");
        return;
      }

      setIsSubmitting(true);

      // ✅ Step 4: Convert date to ISO format
      const convertToISODate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };

      // ✅ Step 5: Create FormData for file upload - UPDATED
      const formData = new FormData();
      
      // Add all required fields exactly as per body structure
      formData.append("workOrderNumber", form.workOrderNumber);
      formData.append("contractorOrGramPanchayat", form.contractorOrGramPanchayat);
      formData.append("dateOfWorkOrder", convertToISODate(form.dateOfWorkOrder));
      formData.append("remark", form.remark);
      
      // Add document file (required)
      if (form.document) {
        formData.append("document", form.document);
      }

      // 🔍 Debug logs
      console.log("📤 Submitting work order:");
      console.log("🆔 Work ID:", workId);
      console.log("📋 Work Order Number:", form.workOrderNumber);
      console.log("🏗️ Contractor/Gram Panchayat:", form.contractorOrGramPanchayat);
      console.log("📅 Date of Work Order:", convertToISODate(form.dateOfWorkOrder));
      console.log("💭 Remark:", form.remark);
      console.log("📁 Document:", form.document?.name);

      // ✅ Step 6: API call with FormData
      const response = await axios.post(
        `${BASE_SERVER_URL}/work-proposals/${workId}/work-order`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // For file upload
            "Authorization": `Bearer ${token}`
          },
        }
      );

      // ✅ Step 7: Success handling
      console.log("✅ Work order created successfully:", response.data);
      alert("वर्क ऑर्डर सफलतापूर्वक सहेजा गया!");
      
      // Reset form
      setForm({
        workOrderNumber: "",
        contractorOrGramPanchayat: "",
        dateOfWorkOrder: "",
        remark: "",
        document: null,
      });
      
      // Clear file input
      const fileInput = document.getElementById("documentUpload");
      if (fileInput) {
        fileInput.value = "";
      }

      // Navigate back after delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (error) {
      console.error("❌ Work order submission error:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        console.error("📍 Response error:", status, data);
        
        switch (status) {
          case 400:
            if (data.message?.includes('ObjectId')) {
              alert("कार्य ID की समस्या है। कृपया वापस जाकर सही कार्य चुनें।");
              navigate(-1);
            } else {
              alert(`डेटा त्रुटि: ${data.message || 'अवैध डेटा'}`);
            }
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
            alert("कार्य प्रस्ताव नहीं मिला। हो सकता है यह पहले से हटा दिया गया हो।");
            navigate(-1);
            break;
            
          default:
            alert(`सर्वर त्रुटि (${status}): ${data.message || 'अज्ञात त्रुटि'}`);
        }
      } else if (error.request) {
        console.error("📍 Network error:", error.request);
        alert("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।");
      } else {
        console.error("📍 Request setup error:", error.message);
        alert("अनुरोध त्रुटि। कृपया पेज रीलोड करके पुनः प्रयास करें।");
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
            <h2>वर्क ऑर्डर प्रपत्र</h2>
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
          <h2>वर्क ऑर्डर जोड़ें - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>वर्क ऑर्डर प्रपत्र</h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  वर्क ऑर्डर संख्या <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="workOrderNumber"
                  className={`form-input ${errors.workOrderNumber ? 'error' : ''}`}
                  placeholder="WO/2025/0142"
                  value={form.workOrderNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.workOrderNumber && (
                  <span className="error-text">{errors.workOrderNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  ठेकेदार / ग्राम पंचायत <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="contractorOrGramPanchayat"
                  className={`form-input ${errors.contractorOrGramPanchayat ? 'error' : ''}`}
                  placeholder="Shri Balaji Constructions"
                  value={form.contractorOrGramPanchayat}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.contractorOrGramPanchayat && (
                  <span className="error-text">{errors.contractorOrGramPanchayat}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  वर्क ऑर्डर दिनांक <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    name="dateOfWorkOrder"
                    className={`form-input ${errors.dateOfWorkOrder ? 'error' : ''}`}
                    value={form.dateOfWorkOrder}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                  <span className="cal-ic">📅</span>
                </div>
                {errors.dateOfWorkOrder && (
                  <span className="error-text">{errors.dateOfWorkOrder}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              {/* Document Upload - Now Required */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  संलग्न दस्तावेज़ <span className="req">*</span>
                </label>
                <input
                  type="file"
                  name="document"
                  id="documentUpload"
                  className={`file-input ${errors.document ? 'error' : ''}`}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleChange}
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
                name="remark"
                className={`form-input textarea ${errors.remark ? 'error' : ''}`}
                placeholder="Work order issued for road construction with proper drainage system"
                rows={5}
                value={form.remark}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.remark && (
                <span className="error-text">{errors.remark}</span>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting || !workId}
              >
                {isSubmitting ? "सबमिट हो रहा है..." : "Submit"}
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
