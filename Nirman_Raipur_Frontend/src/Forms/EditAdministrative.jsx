import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function EditAdministrative({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state
  const [form, setForm] = useState({
    byGovtDistrictAS: "",
    approvalNumber: "",
    remarks: "",
    rejectionReason: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [existingApproval, setExistingApproval] = useState(null);

  useEffect(() => {
    document.title = "निर्माण | प्रशासकीय स्वीकृति अपडेट";

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

    // Fetch existing administrative approval data
    fetchExistingApproval();
  }, [workId, navigate, isAuthenticated, token]);

  // Fetch existing administrative approval data
  const fetchExistingApproval = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Fetching data for workId:", workId);

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("📥 Full API response:", response.data);
      console.log("📥 Administrative approval data:", response.data?.administrativeApproval);

      // ✅ FIXED: Better condition checking
    //   if (!response.data?.administrativeApproval) {
    //     console.log("❌ No administrativeApproval object found");
    //     alert("प्रशासकीय स्वीकृति मौजूद नहीं है। पहले स्वीकृति बनाएं।");
    //     navigate(-1);
    //     return;
    //   }

      const adminApproval = response.data.administrativeApproval;
      console.log("📊 Administrative approval object:", adminApproval);

      // ✅ FIXED: Safeguard against undefined values
      const safeAdminApproval = {
        status: adminApproval?.status || null,
        byGovtDistrictAS: adminApproval?.byGovtDistrictAS || "",
        approvalNumber: adminApproval?.approvalNumber || "",
        remarks: adminApproval?.remarks || "",
        rejectionReason: adminApproval?.rejectionReason || "",
        approvalDate: adminApproval?.approvalDate || null,
        attachedFile: adminApproval?.attachedFile || null,
        createdAt: adminApproval?.createdAt || null
      };

      // Set existing approval data with safe values
      setExistingApproval(safeAdminApproval);

      // ✅ FIXED: Pre-populate form with safe values
      setForm(prev => ({
        ...prev,
        byGovtDistrictAS: safeAdminApproval.byGovtDistrictAS,
        approvalNumber: safeAdminApproval.approvalNumber,
        remarks: safeAdminApproval.remarks,
        rejectionReason: safeAdminApproval.rejectionReason,
      }));

      console.log("✅ Form pre-populated with safe values:", {
        byGovtDistrictAS: safeAdminApproval.byGovtDistrictAS,
        approvalNumber: safeAdminApproval.approvalNumber,
        status: safeAdminApproval.status
      });

    } catch (error) {
      console.error("❌ Error fetching administrative approval:", error);
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
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation for update (less strict than create)
  const validateForm = () => {
    const newErrors = {};

    // For approved administrative approval, validate required fields
    if (existingApproval?.status === "Approved") {
      if (!form.approvalNumber.trim()) {
        newErrors.approvalNumber = 'प्रशासकीय स्वीकृति क्रमांक आवश्यक है';
      }
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
      // Create FormData for file upload
      const formData = new FormData();

      // Add fields only if they have values (partial update)
      if (form.byGovtDistrictAS.trim()) {
        formData.append("byGovtDistrictAS", form.byGovtDistrictAS);
      }

      if (form.approvalNumber.trim()) {
        formData.append("approvalNumber", form.approvalNumber);
      }

      if (form.remarks.trim()) {
        formData.append("remarks", form.remarks);
      }

      if (form.rejectionReason.trim()) {
        formData.append("rejectionReason", form.rejectionReason);
      }

      // Add document file if selected
      if (form.document) {
        formData.append("document", form.document);
      }

      console.log("📤 Sending update data to backend:", {
        byGovtDistrictAS: form.byGovtDistrictAS,
        approvalNumber: form.approvalNumber,
        remarks: form.remarks,
        rejectionReason: form.rejectionReason,
        hasDocument: !!form.document
      });

      // PUT API call using axios with FormData
      const response = await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}/administrative-approval`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      // Success handling
      console.log("✅ Administrative approval updated successfully:", response.data);
      alert("प्रशासकीय स्वीकृति सफलतापूर्वक अपडेट की गई!");

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err) {
      console.error("❌ Administrative approval update error:", err);

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
            <h2>प्रशासकीय स्वीकृति अपडेट</h2>
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
            <h2>प्रशासकीय स्वीकृति अपडेट - Work ID: {workId}</h2>
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
            <h2>प्रशासकीय स्वीकृति अपडेट - Work ID: {workId}</h2>
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
          <h2>प्रशासकीय स्वीकृति अपडेट - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>
              प्रशासकीय स्वीकृति अपडेट
            </h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            {/* Show form for approved status or if no specific status */}
            {(!existingApproval.status || existingApproval.status === 'Approved') && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      सरकार/जिला द्वारा ए.एस
                    </label>
                    <input
                      type="text"
                      name="byGovtDistrictAS"
                      className={`form-input ${errors.byGovtDistrictAS ? 'error' : ''}`}
                      placeholder="Commissioner, Raipur Municipal Corporation"
                      value={form.byGovtDistrictAS}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.byGovtDistrictAS && (
                      <span className="error-text">{errors.byGovtDistrictAS}</span>
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
                    />
                    {errors.approvalNumber && (
                      <span className="error-text">{errors.approvalNumber}</span>
                    )}
                  </div>
                </div>

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
              </>
            )}

            {existingApproval.status === 'Rejected' && (
              <>
                <div className="form-group full">
                  <label className="form-label">
                    अस्वीकृति कारण
                  </label>
                  <textarea
                    name="rejectionReason"
                    className={`form-input textarea ${errors.rejectionReason ? 'error' : ''}`}
                    placeholder="अपडेटेड अस्वीकृति कारण दर्ज करें..."
                    rows={4}
                    value={form.rejectionReason}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.rejectionReason && (
                    <span className="error-text">{errors.rejectionReason}</span>
                  )}
                </div>

                <div className="form-group full">
                  <label className="form-label">
                    टिप्पणी
                  </label>
                  <textarea
                    name="remarks"
                    className={`form-input textarea ${errors.remarks ? 'error' : ''}`}
                    placeholder="अपडेटेड टिप्पणी दर्ज करें..."
                    rows={3}
                    value={form.remarks}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.remarks && (
                    <span className="error-text">{errors.remarks}</span>
                  )}
                </div>
              </>
            )}

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

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "अपडेट हो रहा है..." : "Update Administrative Approval"}
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
