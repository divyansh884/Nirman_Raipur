import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function EditWorkOrder({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Form state
  const [form, setForm] = useState({
    workOrderNumber: "",
    contractorOrGramPanchayat: "",
    dateOfWorkOrder: "",
    remark: "",
    document: null,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [existingWorkOrder, setExistingWorkOrder] = useState(null);

  useEffect(() => {
    document.title = "निर्माण | वर्क ऑर्डर अपडेट";

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

    // Fetch existing work order data
    fetchExistingWorkOrder();
  }, [workId, navigate, isAuthenticated, token]);

  // Fetch existing work order data
  const fetchExistingWorkOrder = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Fetching data for workId:", workId);

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("📥 Full API response:", response.data);
      console.log("📥 Work order data:", response.data?.workOrder);

      // ✅ FIXED: Better condition checking (following AdminApproval pattern)
      // if (!response.data?.workOrder) {
      //   console.log("❌ No workOrder object found");
      //   alert("वर्क ऑर्डर मौजूद नहीं है। पहले वर्क ऑर्डर बनाएं।");
      //   navigate(-1);
      //   return;
      // }

      const workOrderData = response.data.workOrder;
      console.log("📊 Work order object:", workOrderData);

      // ✅ FIXED: Safeguard against undefined values
      const safeWorkOrderData = {
        workOrderNumber: workOrderData?.workOrderNumber || "",
        contractorOrGramPanchayat: workOrderData?.contractorOrGramPanchayat || "",
        dateOfWorkOrder: workOrderData?.dateOfWorkOrder || null,
        remark: workOrderData?.remark || "",
        attachedFile: workOrderData?.attachedFile || null,
        issuedBy: workOrderData?.issuedBy || null,
        createdAt: workOrderData?.createdAt || null
      };

      // Set existing work order data with safe values
      setExistingWorkOrder(safeWorkOrderData);

      // ✅ FIXED: Pre-populate form with safe values
      setForm(prev => ({
        ...prev,
        workOrderNumber: safeWorkOrderData.workOrderNumber,
        contractorOrGramPanchayat: safeWorkOrderData.contractorOrGramPanchayat,
        dateOfWorkOrder: safeWorkOrderData.dateOfWorkOrder ? new Date(safeWorkOrderData.dateOfWorkOrder).toISOString().split('T')[0] : "",
        remark: safeWorkOrderData.remark,
      }));

      console.log("✅ Form pre-populated with safe values:", {
        workOrderNumber: safeWorkOrderData.workOrderNumber,
        contractorOrGramPanchayat: safeWorkOrderData.contractorOrGramPanchayat,
        dateOfWorkOrder: safeWorkOrderData.dateOfWorkOrder
      });

    } catch (error) {
      console.error("❌ Error fetching work order data:", error);
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
    if (form.workOrderNumber !== undefined && !form.workOrderNumber.trim()) {
      newErrors.workOrderNumber = 'वर्क ऑर्डर संख्या खाली नहीं हो सकती';
    }

    if (form.contractorOrGramPanchayat !== undefined && !form.contractorOrGramPanchayat.trim()) {
      newErrors.contractorOrGramPanchayat = 'ठेकेदार/ग्राम पंचायत का नाम खाली नहीं हो सकता';
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
      if (form.workOrderNumber.trim()) {
        formData.append("workOrderNumber", form.workOrderNumber);
      }

      if (form.contractorOrGramPanchayat.trim()) {
        formData.append("contractorOrGramPanchayat", form.contractorOrGramPanchayat);
      }

      if (form.dateOfWorkOrder) {
        formData.append("dateOfWorkOrder", convertToISODate(form.dateOfWorkOrder));
      }

      if (form.remark.trim()) {
        formData.append("remark", form.remark);
      }

      // Add document file if selected
      if (form.document) {
        formData.append("document", form.document);
      }

      console.log("📤 Sending update data to backend:", {
        workOrderNumber: form.workOrderNumber,
        contractorOrGramPanchayat: form.contractorOrGramPanchayat,
        dateOfWorkOrder: form.dateOfWorkOrder,
        remark: form.remark,
        hasDocument: !!form.document
      });

      // PUT API call using axios with FormData
      const response = await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}/work-order`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      // Success handling
      console.log("✅ Work order updated successfully:", response.data);
      alert("वर्क ऑर्डर सफलतापूर्वक अपडेट किया गया!");

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err) {
      console.error("❌ Work order update error:", err);

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
            <h2>वर्क ऑर्डर अपडेट</h2>
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
            <h2>वर्क ऑर्डर अपडेट - Work ID: {workId}</h2>
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

  // ✅ FIXED: Don't render form until existingWorkOrder is loaded
  if (!existingWorkOrder) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>वर्क ऑर्डर अपडेट - Work ID: {workId}</h2>
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
          <h2>वर्क ऑर्डर अपडेट - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form Card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>
              वर्क ऑर्डर अपडेट
            </h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  वर्क ऑर्डर संख्या
                </label>
                <input
                  type="text"
                  name="workOrderNumber"
                  className={`form-input ${errors.workOrderNumber ? 'error' : ''}`}
                  placeholder="WO/2025/0142"
                  value={form.workOrderNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.workOrderNumber && (
                  <span className="error-text">{errors.workOrderNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  ठेकेदार / ग्राम पंचायत
                </label>
                <input
                  type="text"
                  name="contractorOrGramPanchayat"
                  className={`form-input ${errors.contractorOrGramPanchayat ? 'error' : ''}`}
                  placeholder="Shri Balaji Constructions"
                  value={form.contractorOrGramPanchayat}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.contractorOrGramPanchayat && (
                  <span className="error-text">{errors.contractorOrGramPanchayat}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  वर्क ऑर्डर दिनांक
                </label>
                <div className="input-with-icon">
                  <input
                    type="date"
                    name="dateOfWorkOrder"
                    className={`form-input ${errors.dateOfWorkOrder ? 'error' : ''}`}
                    value={form.dateOfWorkOrder}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="cal-ic">📅</span>
                </div>
                {errors.dateOfWorkOrder && (
                  <span className="error-text">{errors.dateOfWorkOrder}</span>
                )}
              </div>
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
                {isSubmitting ? "अपडेट हो रहा है..." : "Update Work Order"}
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
