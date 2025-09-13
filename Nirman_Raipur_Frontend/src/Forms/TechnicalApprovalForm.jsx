import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function TechnicalApprovalPage({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();
  
  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();
  
  // Form state
  const [form, setForm] = useState({
    approvalNumber: "",
    remarks: "",
    document: null,
    images: [],
    sanctionAmount: "",
  });
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    
    // Fetch work proposal data to get sanctionAmount
    if (isAuthenticated && token && workId) {
      fetchWorkProposal();
    }
  }, [isAuthenticated, token, navigate, workId]);

  // Fetch work proposal data using fetch API
  const fetchWorkProposal = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        } else if (response.status === 404) {
          throw new Error('NOT_FOUND');
        } else {
          throw new Error(`HTTP_ERROR_${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log("📥 Work proposal data fetched:", data);
      
      // Set sanctionAmount from API response
      if (data?.sanctionAmount) {
        setForm(prev => ({
          ...prev,
          sanctionAmount: data.sanctionAmount.toString()
        }));
      }
      
    } catch (error) {
      console.error("❌ Error fetching work proposal:", error);
      
      if (error.message === 'UNAUTHORIZED') {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        logout();
        navigate("/login");
      } else if (error.message === 'NOT_FOUND') {
        alert("कार्य प्रस्ताव नहीं मिला।");
        navigate(-1);
      } else {
        alert("डेटा लोड करने में त्रुटि हुई।");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update sanctionAmount using PUT request
  const updateSanctionAmount = async (newAmount) => {
    try {
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sanctionAmount: parseFloat(newAmount)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update sanction amount: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Sanction amount updated:", data);
      return data;
      
    } catch (error) {
      console.error("❌ Error updating sanction amount:", error);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "document") {
      setForm((prev) => ({ ...prev, document: files[0] }));
    } else if (name === "images") {
      // Handle multiple image files
      const imageFiles = Array.from(files);
      setForm((prev) => ({ ...prev, images: imageFiles }));
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
    
    if (!form.approvalNumber.trim()) {
      newErrors.approvalNumber = 'स्वीकृति क्रमांक आवश्यक है';
    }
    
    if (!form.remarks.trim()) {
      newErrors.remarks = 'टिप्पणी आवश्यक है';
    }
    
    // if (!form.document) {
    //   newErrors.document = 'दस्तावेज़ संलग्न करना आवश्यक है';
    // }
    
    // if (!form.images || form.images.length === 0) {
    //   newErrors.images = 'कम से कम एक छवि संलग्न करना आवश्यक है';
    // }
    
    if (!form.sanctionAmount || parseFloat(form.sanctionAmount) <= 0) {
      newErrors.sanctionAmount = 'वैध स्वीकृति राशि दर्ज करें';
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
      // First, update sanctionAmount using PUT request
      await updateSanctionAmount(form.sanctionAmount);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add required fields
      formData.append("action", "approve");
      formData.append("approvalNumber", form.approvalNumber);
      formData.append("remarks", form.remarks);
      
      // Add document file
      if (form.document) {
        formData.append("document", form.document);
      }
      
      // Add multiple images
      form.images.forEach((image, index) => {
        formData.append("images", image);
      });

      // 🔍 DEBUG: Log the payload
      console.log("📤 Sending form data to backend:");
      console.log("✅ Action:", "approve");
      console.log("✅ Approval Number:", form.approvalNumber);
      console.log("✅ Remarks:", form.remarks);
      console.log("✅ Sanction Amount:", form.sanctionAmount);
      console.log("✅ Document:", form.document?.name);
      console.log("✅ Images count:", form.images.length);

      // API call with FormData using fetch
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals/${workId}/technical-approval`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}` // Don't set Content-Type for FormData
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "सबमिट करने में त्रुटि हुई";
        
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        } else if (response.status === 403) {
          throw new Error('FORBIDDEN');
        } else if (response.status === 404) {
          throw new Error('NOT_FOUND');
        } else if (response.status === 400) {
          throw new Error(`BAD_REQUEST: ${errorMessage}`);
        } else {
          throw new Error(`HTTP_ERROR: ${errorMessage}`);
        }
      }

      const responseData = await response.json();
      
      // Success handling
      console.log("✅ Technical approval submitted successfully:", responseData);
      alert("तकनीकी स्वीकृति सफलतापूर्वक सहेजी गई!");
      
      // Reset form
      setForm({
        approvalNumber: "",
        remarks: "",
        document: null,
        images: [],
        sanctionAmount: "",
      });
      
      // Clear file inputs
      const documentInput = document.getElementById("documentUpload");
      const imagesInput = document.getElementById("imagesUpload");
      if (documentInput) documentInput.value = "";
      if (imagesInput) imagesInput.value = "";
      
      // Navigate back
      setTimeout(() => {
        navigate(-1);
      }, 1500);
      
    } catch (error) {
      console.error("❌ Technical approval submission error:", error);
      
      // Handle different error scenarios
      if (error.message === 'UNAUTHORIZED') {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        logout();
        navigate("/login");
      } else if (error.message === 'FORBIDDEN') {
        alert("आपको इस कार्य को करने की अनुमति नहीं है।");
      } else if (error.message === 'NOT_FOUND') {
        alert("कार्य प्रस्ताव नहीं मिला। कृपया वैध कार्य ID सुनिश्चित करें।");
      } else if (error.message.startsWith('BAD_REQUEST')) {
        alert(`डेटा त्रुटि: ${error.message.replace('BAD_REQUEST: ', '')}`);
      } else if (error.message.startsWith('HTTP_ERROR')) {
        alert(`त्रुटि: ${error.message.replace('HTTP_ERROR: ', '')}`);
      } else {
        alert("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।");
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>तकनीकी स्वीकृति जोड़ें - Work ID: {workId}</h2>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <div>डेटा लोड हो रहा है...</div>
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
                  स्वीकृति क्रमांक <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="approvalNumber"
                  className={`form-input ${errors.approvalNumber ? 'error' : ''}`}
                  placeholder="TA-CIVIL-2025-045"
                  value={form.approvalNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.approvalNumber && (
                  <span className="error-text">{errors.approvalNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  स्वीकृति राशि (लाख रुपये) <span className="req"></span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="sanctionAmount"
                  className={`form-input ${errors.sanctionAmount ? 'error' : ''}`}
                  placeholder="14200000"
                  value={form.sanctionAmount}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.sanctionAmount && (
                  <span className="error-text">{errors.sanctionAmount}</span>
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
                placeholder="Approved, subject to the procurement of specified Grade-A materials. All other technical parameters are cleared."
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

            <div className="form-grid">
              {/* Document upload - Required */}
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

              {/* Images upload - Required (Multiple) */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  छवियां संलग्न करें <span className="req">*</span>
                </label>
                <input
                  type="file"
                  name="images"
                  id="imagesUpload"
                  className={`file-input ${errors.images ? 'error' : ''}`}
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleChange}
                />
                <label htmlFor="imagesUpload" className="custom-file-label">
                  छवियां चुनें
                </label>
                <span className="file-name">
                  {form.images.length > 0 
                    ? `${form.images.length} छवि चयनित` 
                    : "कोई छवि चयनित नहीं"
                  }
                </span>
                {form.images.length > 0 && (
                  <div className="selected-files">
                    {form.images.map((image, index) => (
                      <small key={index} className="file-item">
                        {index + 1}. {image.name}
                      </small>
                    ))}
                  </div>
                )}
                {errors.images && (
                  <span className="error-text">{errors.images}</span>
                )}
              </div>
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
