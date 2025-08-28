import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Form.css";
import TopBar from "../Components/TopBar.jsx";
export default function AdministrativeApprovalPage({ onLogout }) {
  const navigate = useNavigate();
  const { workId } = useParams();


  // Form state
  const [form, setForm] = useState({
    govtDistrictAS: "",
    approvalNumber: "",
    approvalAmount: "",
    document: null,
    remarks: "",
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get authentication token
  function getAuthToken() {
    return localStorage.getItem("authToken");
  }

  useEffect(() => {
    document.title = "निर्माण | प्रशासकीय स्वीकृति";
  }, []);

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
    
    if (!form.govtDistrictAS.trim()) {
      newErrors.govtDistrictAS = 'सरकार/जिला द्वारा ए.एस आवश्यक है';
    }
    
    if (!form.approvalNumber.trim()) {
      newErrors.approvalNumber = 'प्रशासकीय स्वीकृति क्रमांक आवश्यक है';
    }
    
    if (!form.approvalAmount || parseFloat(form.approvalAmount) <= 0) {
      newErrors.approvalAmount = 'वैध राशि दर्ज करें';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
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

    // Check authentication
    const authToken = getAuthToken();
    if (!authToken) {
      alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // If there's a document, handle file upload first (if your API supports it)
      // For now, we'll send JSON data as per the provided API schema
      const payload = {
        action: "approve", // Fixed value as per API schema
        byGovtDistrictAS: form.govtDistrictAS,
        approvalNumber: form.approvalNumber,
        approvedAmount: parseFloat(form.approvalAmount),
        remarks: form.remarks || ""
      };

      // Make API call with JSON data
      const response = await axios.post(
        `http://localhost:3000/api/work-proposals/${workId}/administrative-approval`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
        }
      );

      // If there's a document and you need to upload it separately, do it here
      if (form.document) {
        try {
          const fileFormData = new FormData();
          fileFormData.append("document", form.document);
          
          // You might need a separate endpoint for document upload
          // await axios.post(`http://localhost:3000/api/work-proposals/${workID}/documents`, fileFormData, {
          //   headers: {
          //     "Content-Type": "multipart/form-data",
          //     "Authorization": `Bearer ${authToken}`
          //   }
          // });
          
          console.log("Document will be handled separately:", form.document.name);
        } catch (fileError) {
          console.warn("Document upload failed:", fileError);
          // Don't fail the main submission for document upload issues
        }
      }

      // Success handling
      console.log("Administrative approval submitted successfully:", response.data);
      alert("प्रशासकीय स्वीकृति सफलतापूर्वक सहेजी गई!");
      
      // Reset form
      setForm({
        govtDistrictAS: "",
        approvalNumber: "",
        approvalAmount: "",
        document: null,
        remarks: "",
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
      console.error("Administrative approval submission error:", err);
      
      // Handle different error scenarios
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.message || "सबमिट करने में त्रुटि हुई";
        
        if (status === 401) {
          alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
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

  return (
    <div className="workorder-page">
      {/* Header */}
      <div className="header">
        <TopBar />

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

              <div className="form-group">
                <label className="form-label">
                  प्रशासकीय स्वीकृति की राशि (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="approvalAmount"
                  className={`form-input ${errors.approvalAmount ? 'error' : ''}`}
                  placeholder="12500000"
                  value={form.approvalAmount}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.approvalAmount && (
                  <span className="error-text">{errors.approvalAmount}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              {/* File Upload - Optional (for future enhancement) */}
              <div className="form-group file-input-wrapper">
                <label>दस्तावेज़/फोटो अपलोड करें (वैकल्पिक):</label>
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
                placeholder="Approved for the urban infrastructure upgrade project as per the technical committee's recommendation."
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
