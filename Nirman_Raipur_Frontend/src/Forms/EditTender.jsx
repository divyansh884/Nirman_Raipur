import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function EditTender({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state
  const [form, setForm] = useState({
    tenderTitle: "",
    tenderID: "",
    department: "",
    issuedDates: "",
    remark: "",
    tenderStatus: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [existingTender, setExistingTender] = useState(null);

  useEffect(() => {
    document.title = "निर्माण | निविदा अपडेट";

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

    // Fetch existing tender data
    fetchExistingTender();
  }, [workId, navigate, isAuthenticated, token]);

  // Fetch existing tender data
  const fetchExistingTender = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Fetching data for workId:", workId);

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("📥 Full API response:", response.data);
      console.log("📥 Tender process data:", response.data?.tenderProcess);

      // ✅ FIXED: Better condition checking (following AdminApproval pattern)
      // if (!response.data?.tenderProcess) {
      //   console.log("❌ No tenderProcess object found");
      //   alert("निविदा प्रक्रिया मौजूद नहीं है। पहले निविदा बनाएं।");
      //   navigate(-1);
      //   return;
      // }

      const tenderData = response.data.tenderProcess;
      console.log("📊 Tender process object:", tenderData);

      // ✅ FIXED: Safeguard against undefined values
      const safeTenderData = {
        tenderTitle: tenderData?.tenderTitle || "",
        tenderID: tenderData?.tenderID || "",
        department: tenderData?.department || "",
        issuedDates: tenderData?.issuedDates || null,
        remark: tenderData?.remark || "",
        tenderStatus: tenderData?.tenderStatus || "",
        attachedFile: tenderData?.attachedFile || null,
        createdAt: tenderData?.createdAt || null
      };

      // Set existing tender data with safe values
      setExistingTender(safeTenderData);

      // ✅ FIXED: Pre-populate form with safe values
      setForm(prev => ({
        ...prev,
        tenderTitle: safeTenderData.tenderTitle,
        tenderID: safeTenderData.tenderID,
        department: safeTenderData.department,
        issuedDates: safeTenderData.issuedDates ? new Date(safeTenderData.issuedDates).toISOString().split('T')[0] : "",
        remark: safeTenderData.remark,
        tenderStatus: safeTenderData.tenderStatus,
      }));

      console.log("✅ Form pre-populated with safe values:", {
        tenderTitle: safeTenderData.tenderTitle,
        tenderID: safeTenderData.tenderID,
        tenderStatus: safeTenderData.tenderStatus
      });

    } catch (error) {
      console.error("❌ Error fetching tender data:", error);
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

    // Basic validation - only check if fields are not empty when provided
    if (form.tenderTitle !== undefined && !form.tenderTitle.trim()) {
      newErrors.tenderTitle = 'निविदा शीर्षक खाली नहीं हो सकता';
    }

    if (form.tenderID !== undefined && !form.tenderID.trim()) {
      newErrors.tenderID = 'निविदा आईडी खाली नहीं हो सकती';
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
      // ✅ Step 4: Convert date to ISO format
      const convertToISODate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString();
      };

      // Create FormData for file upload
      const formData = new FormData();

      // Add fields only if they have values (partial update)
      if (form.tenderTitle.trim()) {
        formData.append("tenderTitle", form.tenderTitle);
      }

      if (form.tenderID.trim()) {
        formData.append("tenderID", form.tenderID);
      }

      if (form.department.trim()) {
        formData.append("department", form.department);
      }

      if (form.issuedDates) {
        formData.append("issuedDates", convertToISODate(form.issuedDates));
      }

      if (form.remark.trim()) {
        formData.append("remark", form.remark);
      }

      if (form.tenderStatus) {
        formData.append("tenderStatus", form.tenderStatus);
      }

      // Add document file if selected
      if (form.document) {
        formData.append("document", form.document);
      }

      console.log("📤 Sending update data to backend:", {
        tenderTitle: form.tenderTitle,
        tenderID: form.tenderID,
        department: form.department,
        issuedDates: form.issuedDates,
        remark: form.remark,
        tenderStatus: form.tenderStatus,
        hasDocument: !!form.document
      });

      // PUT API call using axios with FormData
      const response = await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}/tender-process`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      // Success handling
      console.log("✅ Tender updated successfully:", response.data);
      alert("निविदा सफलतापूर्वक अपडेट की गई!");

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err) {
      console.error("❌ Tender update error:", err);

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
            <h2>निविदा अपडेट</h2>
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
            <h2>निविदा अपडेट - Work ID: {workId}</h2>
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

  // ✅ FIXED: Don't render form until existingTender is loaded
  if (!existingTender) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>निविदा अपडेट - Work ID: {workId}</h2>
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
          <h2>निविदा अपडेट - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>
              निविदा अपडेट
            </h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  निविदा शीर्षक
                </label>
                <input
                  type="text"
                  name="tenderTitle"
                  className={`form-input ${errors.tenderTitle ? 'error' : ''}`}
                  placeholder="Construction of CC Road from Panchayat Bhavan to School"
                  value={form.tenderTitle}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.tenderTitle && (
                  <span className="error-text">{errors.tenderTitle}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  निविदा आईडी
                </label>
                <input
                  type="text"
                  name="tenderID"
                  className={`form-input ${errors.tenderID ? 'error' : ''}`}
                  placeholder="TDR/2025/0789"
                  value={form.tenderID}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.tenderID && (
                  <span className="error-text">{errors.tenderID}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  विभाग
                </label>
                <input
                  type="text"
                  name="department"
                  className={`form-input ${errors.department ? 'error' : ''}`}
                  placeholder="Public Works Department"
                  value={form.department}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.department && (
                  <span className="error-text">{errors.department}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  जारी तिथि
                </label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    name="issuedDates"
                    className={`form-input ${errors.issuedDates ? 'error' : ''}`}
                    value={form.issuedDates}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="cal-ic">📅</span>
                </div>
                {errors.issuedDates && (
                  <span className="error-text">{errors.issuedDates}</span>
                )}
              </div>

              {/* <div className="form-group">
                <label className="form-label">
                  निविदा स्थिति
                </label>
                <select
                  name="tenderStatus"
                  className={`form-input ${errors.tenderStatus ? 'error' : ''}`}
                  value={form.tenderStatus}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">स्थिति चुनें</option>
                  <option value="Not Started">शुरू नहीं</option>
                  <option value="Notice Published">सूचना प्रकाशित</option>
                  <option value="Bid Submission">बोली जमा</option>
                  <option value="Under Evaluation">मूल्यांकन में</option>
                  <option value="Awarded">पुरस्कृत</option>
                  <option value="Cancelled">रद्द</option>
                </select>
                {errors.tenderStatus && (
                  <span className="error-text">{errors.tenderStatus}</span>
                )}
              </div> */}
            </div>

            {/* Document Upload - Optional for update */}
            <div className="form-group file-input-wrapper">
              <label className="form-label">
                नया संलग्न दस्तावेज़ (वैकल्पिक)
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

            <div className="form-group full">
              <label className="form-label">
                टिप्पणी
              </label>
              <textarea
                name="remark"
                className={`form-input textarea ${errors.remark ? 'error' : ''}`}
                placeholder="अपडेटेड टिप्पणी दर्ज करें..."
                rows={5}
                value={form.remark}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.remark && (
                <span className="error-text">{errors.remark}</span>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "अपडेट हो रहा है..." : "Update Tender"}
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
