import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function EditTechnical({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state - UPDATED to only handle sanctionAmount
  const [form, setForm] = useState({
    approvalNumber: "",
    remarks: "",
    sanctionAmount: "", // ✅ CHANGED: Only sanctionAmount field
    document: null,
    images: [],
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [existingApproval, setExistingApproval] = useState(null);
  const [currentWorkData, setCurrentWorkData] = useState(null);

  useEffect(() => {
    document.title = "निर्माण | तकनीकी स्वीकृति अपडेट";

    console.log("🔍 Component mounted with workId:", workId);
    console.log("🔍 Authentication state:", { isAuthenticated, hasToken: !!token });

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

    // Fetch existing technical approval data
    fetchExistingApproval();
  }, [workId, navigate, isAuthenticated, token]);

  // Fetch existing technical approval data
  const fetchExistingApproval = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Fetching data for workId:", workId);

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const proposalData = response.data?.data || response.data;
      console.log("📥 Full API response:", response.data);
      console.log("📥 Technical approval data:", proposalData?.technicalApproval);
      console.log("📥 Current sanctionAmount:", proposalData?.sanctionAmount);

      const techApproval = proposalData?.technicalApproval;
      const workData = proposalData;

      console.log("📊 Technical approval object:", techApproval);
      console.log("📊 Current work data:", workData);

      // ✅ FIXED: Safeguard against undefined values
      const safeTechApproval = {
        status: techApproval?.status || null,
        approvalNumber: techApproval?.approvalNumber || "",
        remarks: techApproval?.remarks || "",
        approvalDate: techApproval?.approvalDate || null,
        attachedFile: techApproval?.attachedFile || null,
        attachedImages: techApproval?.attachedImages || null,
        createdAt: techApproval?.createdAt || null
      };

      // Set existing approval data with safe values
      setExistingApproval(safeTechApproval);
      setCurrentWorkData(workData);

      // ✅ UPDATED: Pre-populate form with safe values - ONLY sanctionAmount
      setForm(prev => ({
        ...prev,
        approvalNumber: safeTechApproval.approvalNumber,
        sanctionAmount: workData?.sanctionAmount?.toString() || "", // ✅ UPDATED: Only sanctionAmount
        remarks: safeTechApproval.remarks,
      }));

      console.log("✅ Form pre-populated with safe values:", {
        approvalNumber: safeTechApproval.approvalNumber,
        sanctionAmount: workData?.sanctionAmount, // ✅ UPDATED: Log sanctionAmount
        status: safeTechApproval.status
      });

    } catch (error) {
      console.error("❌ Error fetching technical approval:", error);
      console.error("📍 Full error details:", error.response || error);

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

  // Form validation for update
  const validateForm = () => {
    const newErrors = {};

    // For approved technical approval, validate required fields
    if (existingApproval?.status === "Approved") {
      if (!form.approvalNumber.trim()) {
        newErrors.approvalNumber = 'तकनीकी स्वीकृति क्रमांक आवश्यक है';
      }
    }

    // ✅ UPDATED: Validate sanctionAmount only
    if (form.sanctionAmount && parseFloat(form.sanctionAmount) <= 0) {
      newErrors.sanctionAmount = 'स्वीकृत राशि 0 से अधिक होनी चाहिए';
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
      // ✅ UPDATED: Two separate API calls - technical approval and work proposal
      
      const techFormData = new FormData();

      if (form.approvalNumber.trim()) {
        techFormData.append("approvalNumber", form.approvalNumber);
      }

      if (form.remarks.trim()) {
        techFormData.append("remarks", form.remarks);
      }

      if (form.sanctionAmount && parseFloat(form.sanctionAmount) > 0) {
        techFormData.append("sanctionAmount", form.sanctionAmount);
      }

      // Add document file if selected
      if (form.document) {
        techFormData.append("document", form.document);
      }

      // Add multiple images if selected
      form.images.forEach((image) => {
        techFormData.append("images", image);
      });

      console.log("📤 Updating technical approval and sanction amount:", {
        approvalNumber: form.approvalNumber,
        sanctionAmount: form.sanctionAmount,
        remarks: form.remarks,
        hasDocument: !!form.document,
        imageCount: form.images.length
      });

      await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}/technical-approval`,
        techFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      console.log("✅ Technical approval & sanction amount updated successfully");

      // Success handling
      alert("तकनीकी स्वीकृति और कार्य राशि सफलतापूर्वक अपडेट की गई!");

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err) {
      console.error("❌ Update error:", err);

      // Handle different error scenarios
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.message || "अपडेट करने में त्रुटि हुई";

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
        alert("अपडेट करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FIXED: Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>तकनीकी स्वीकृति अपडेट</h2>
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

  // ✅ FIXED: Show loading state
  if (isLoading) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>तकनीकी स्वीकृति अपडेट - Work ID: {workId}</h2>
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

  // ✅ FIXED: Don't render form until existingApproval is loaded
  if (!existingApproval) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>तकनीकी स्वीकृति अपडेट - Work ID: {workId}</h2>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
              <div>डेटा लोड नहीं हो सका</div>
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
          <h2>तकनीकी स्वीकृति अपडेट - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>
              तकनीकी स्वीकृति अपडेट
            </h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            {/* Show form for approved status or if no specific status */}
            {(!existingApproval.status || existingApproval.status === 'Approved') && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      तकनीकी स्वीकृति क्रमांक <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="approvalNumber"
                      className={`form-input ${errors.approvalNumber ? 'error' : ''}`}
                      placeholder="TA/2025/001234"
                      value={form.approvalNumber}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.approvalNumber && (
                      <span className="error-text">{errors.approvalNumber}</span>
                    )}
                  </div>

                  {/* ✅ UPDATED: Only sanctionAmount field */}
                  <div className="form-group">
                    <label className="form-label">
                      स्वीकृत राशि (लाख रुपये)
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                        {' '}(मुख्य कार्य प्रस्ताव राशि)
                      </span>
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
                    />
                    {errors.sanctionAmount && (
                      <span className="error-text">{errors.sanctionAmount}</span>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="form-group full">
              <label className="form-label">
                टिप्पणी
              </label>
              <textarea
                name="remarks"
                className={`form-input textarea ${errors.remarks ? 'error' : ''}`}
                placeholder="अपडेटेड टिप्पणी दर्ज करें..."
                rows={5}
                value={form.remarks}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.remarks && (
                <span className="error-text">{errors.remarks}</span>
              )}
            </div>

            <div className="form-grid">
              {/* Document Upload - Optional for update */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  नया दस्तावेज़ संलग्न करें (वैकल्पिक)
                </label>
                <input
                  type="file"
                  name="document"
                  id="documentUpload"
                  className="file-input"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleChange}
                />
                <label htmlFor="documentUpload" className="custom-file-label">
                  फ़ाइल चुनें
                </label>
                <span className="file-name">
                  {form.document ? form.document.name : "कोई नई फ़ाइल चयनित नहीं"}
                </span>
              </div>

              {/* Images Upload - Optional for update */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  नई छवियां संलग्न करें (वैकल्पिक)
                </label>
                <input
                  type="file"
                  name="images"
                  id="imagesUpload"
                  className="file-input"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleChange}
                />
                <label htmlFor="imagesUpload" className="custom-file-label">
                  छवियां चुनें
                </label>
                <span className="file-name">
                  {form.images.length > 0 
                    ? `${form.images.length} नई छवि चयनित` 
                    : "कोई नई छवि चयनित नहीं"
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
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "अपडेट हो रहा है..." : "Update Technical Approval"}
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
