import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./WorkInProgressForm.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

export default function WorkInProgressForm({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workId } = useParams();
  
  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();
  
  // ✅ Set Page Title and Check Authentication
  useEffect(() => {
    document.title = "निर्माण | राशि प्रगति प्रपत्र";
    
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
  }, [workId, navigate, isAuthenticated, token]);

  // ✅ Updated form state to include currentStatus
  const [form, setForm] = useState({
    desc: "",
    sanctionedAmount: "",
    totalAmountReleasedSoFar: "",
    remainingBalance: "",
    mbStageMeasurementBookStag: "",
    expenditureAmount: "",
    currentStatus: "", // ✅ ADDED: Current status field
    document: null,
    images: []
  });

  // ✅ Status options
  const statusOptions = [
    "Work In Progress",
    "Work Completed", 
    "Work Cancelled",
    "Work Stopped",
    "Work Not Started"
  ];

  // ✅ Installments state - separate array
  const [installments, setInstallments] = useState([
    { installmentNo: 1, amount: "", date: "" }
  ]);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "document") {
      setForm((prev) => ({ ...prev, document: files[0] }));
    } else if (name === "images") {
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

  // ✅ Handle installment changes
  const handleInstallmentChange = (index, field, value) => {
    const updatedInstallments = [...installments];
    updatedInstallments[index][field] = value;
    setInstallments(updatedInstallments);
  };

  // ✅ Add new installment
  const addInstallment = () => {
    setInstallments([
      ...installments, 
      { installmentNo: installments.length + 1, amount: "", date: "" }
    ]);
  };

  // ✅ Remove installment
  const removeInstallment = (index) => {
    if (installments.length > 1) {
      const updatedInstallments = installments.filter((_, i) => i !== index);
      // Re-number the installments
      const reNumbered = updatedInstallments.map((inst, i) => ({
        ...inst,
        installmentNo: i + 1
      }));
      setInstallments(reNumbered);
    }
  };

  // ✅ Enhanced form validation with currentStatus
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.desc.trim()) {
      newErrors.desc = 'प्रगति विवरण आवश्यक है';
    }
    
    if (!form.sanctionedAmount || parseFloat(form.sanctionedAmount) <= 0) {
      newErrors.sanctionedAmount = 'वैध स्वीकृत राशि दर्ज करें';
    }
    
    if (!form.totalAmountReleasedSoFar || parseFloat(form.totalAmountReleasedSoFar) < 0) {
      newErrors.totalAmountReleasedSoFar = 'वैध जारी की गई राशि दर्ज करें';
    }
    
    if (!form.remainingBalance || parseFloat(form.remainingBalance) < 0) {
      newErrors.remainingBalance = 'वैध शेष राशि दर्ज करें';
    }
    
    if (!form.mbStageMeasurementBookStag.trim()) {
      newErrors.mbStageMeasurementBookStag = 'एम बी स्टेज आवश्यक है';
    }
    
    if (!form.expenditureAmount || parseFloat(form.expenditureAmount) <= 0) {
      newErrors.expenditureAmount = 'वैध व्यय राशि दर्ज करें';
    }

    // ✅ ADDED: Validate currentStatus (required field)
    if (!form.currentStatus.trim()) {
      newErrors.currentStatus = 'कार्य स्थिति चुनना आवश्यक है';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Convert date to ISO format
  const convertToISODate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return date.toISOString();
    } catch (error) {
      console.error("Date conversion error:", error);
      return null;
    }
  };

  // ✅ ADDED: Function to update work status
  const updateWorkStatus = async (statusValue) => {
    try {
      console.log("📤 Updating work status to:", statusValue);
      
      const response = await axios.put(
        `${BASE_SERVER_URL}/work-proposals/${workId}`,
        { currentStatus: statusValue },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      console.log("✅ Work status updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Status update error:", error);
      throw error;
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

  // ✅ Enhanced Submit Handler with status update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) {
        return;
      }
      
      if (!isAuthenticated || !token) {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        navigate("/login");
        return;
      }
      
      if (!workId) {
        alert("कार्य ID नहीं मिला। कृपया पेज रीलोड करें।");
        return;
      }

      setIsSubmitting(true);

      // ✅ STEP 1: Update work status first
      console.log("🚀 Step 1: Updating work status...");
      await updateWorkStatus(form.currentStatus);

      // ✅ STEP 2: Submit progress data
      console.log("🚀 Step 2: Submitting progress data...");
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields (excluding currentStatus as it's already updated)
      formData.append("desc", form.desc);
      formData.append("sanctionedAmount", parseFloat(form.sanctionedAmount));
      formData.append("totalAmountReleasedSoFar", parseFloat(form.totalAmountReleasedSoFar));
      formData.append("remainingBalance", parseFloat(form.remainingBalance));
      formData.append("mbStageMeasurementBookStag", form.mbStageMeasurementBookStag);
      formData.append("expenditureAmount", parseFloat(form.expenditureAmount));

      // Add installments as JSON string (converted to proper format)
      const processedInstallments = installments
        .filter(inst => inst.amount && inst.date) // Only include complete installments
        .map(inst => ({
          installmentNo: parseInt(inst.installmentNo),
          amount: parseFloat(inst.amount),
          date: convertToISODate(inst.date)
        }));
      
      formData.append("installments", JSON.stringify(processedInstallments));

      // Add files
      if (form.document) {
        formData.append("document", form.document);
      }
      
      form.images.forEach((image, index) => {
        formData.append("images", image);
      });

      // 🔍 Debug logs
      console.log("📤 Submitting progress update:");
      console.log("🆔 Work ID:", workId);
      console.log("📋 Description:", form.desc);
      console.log("💰 Sanctioned Amount:", form.sanctionedAmount);
      console.log("💰 Total Amount Released:", form.totalAmountReleasedSoFar);
      console.log("💰 Remaining Balance:", form.remainingBalance);
      console.log("📊 MB Stage:", form.mbStageMeasurementBookStag);
      console.log("💸 Expenditure Amount:", form.expenditureAmount);
      console.log("🏷️ Current Status:", form.currentStatus);
      console.log("📁 Document:", form.document?.name);
      console.log("🖼️ Images:", form.images.length);
      console.log("📋 Installments:", processedInstallments);

      // API call for progress update
      const progressResponse = await axios.post(
        `${BASE_SERVER_URL}/work-proposals/${workId}/progress`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      console.log("✅ Progress submitted successfully:", progressResponse.data);
      alert("राशि प्रगति प्रपत्र और कार्य स्थिति सफलतापूर्वक सहेजी गई!");
      
      // Reset form
      setForm({
        desc: "",
        sanctionedAmount: "",
        totalAmountReleasedSoFar: "",
        remainingBalance: "",
        mbStageMeasurementBookStag: "",
        expenditureAmount: "",
        currentStatus: "", // ✅ ADDED: Reset status field
        document: null,
        images: []
      });
      
      setInstallments([{ installmentNo: 1, amount: "", date: "" }]);
      setErrors({});
      
      // Clear file inputs
      const documentInput = document.getElementById("documentUpload");
      const imagesInput = document.getElementById("imagesUpload");
      if (documentInput) documentInput.value = "";
      if (imagesInput) imagesInput.value = "";

      // Navigate back after delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
      
    } catch (error) {
      console.error("❌ Form submission error:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        console.error("📍 Response error:", status, data);
        
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
        alert("प्रगति सहेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="workprogress-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>राशि प्रगति प्रपत्र</h2>
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
    <div className="workprogress-page">
      {/* Top bar */}
      <div className="header">
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>राशि प्रगति प्रपत्र - Work ID: {workId}</h2>
        </div>
      </div>

      {/* Form card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>राशि प्रगति विवरण</h3>
          </div>
          
          <form className="p-body" onSubmit={handleSubmit}>
            {/* ✅ ADDED: Current Status Field */}
            <div className="form-group full">
              <label className="form-label">
                कार्य की वर्तमान स्थिति <span className="req">*</span>
              </label>
              <select
                name="currentStatus"
                value={form.currentStatus}
                onChange={handleChange}
                className={`form-input ${errors.currentStatus ? 'error' : ''}`}
                disabled={isSubmitting}
                required
              >
                <option value="">-- कार्य स्थिति चुनें --</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.currentStatus && (
                <span className="error-text">{errors.currentStatus}</span>
              )}
            </div>

            {/* Progress Description */}
            <div className="form-group full">
              <label className="form-label">
                प्रगति विवरण <span className="req">*</span>
              </label>
              <textarea
                name="desc"
                value={form.desc}
                onChange={handleChange}
                className={`form-input textarea ${errors.desc ? 'error' : ''}`}
                placeholder="Road construction progress update"
                rows={3}
                disabled={isSubmitting}
                required
              />
              {errors.desc && (
                <span className="error-text">{errors.desc}</span>
              )}
            </div>

            {/* Amount Information */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  स्वीकृत राशि (लाख रुपये) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="sanctionedAmount"
                  value={form.sanctionedAmount}
                  onChange={handleChange}
                  className={`form-input ${errors.sanctionedAmount ? 'error' : ''}`}
                  placeholder="112"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
                {errors.sanctionedAmount && (
                  <span className="error-text">{errors.sanctionedAmount}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  कुल जारी की गई राशि (लाख रुपये) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="totalAmountReleasedSoFar"
                  value={form.totalAmountReleasedSoFar}
                  onChange={handleChange}
                  className={`form-input ${errors.totalAmountReleasedSoFar ? 'error' : ''}`}
                  placeholder="12"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
                {errors.totalAmountReleasedSoFar && (
                  <span className="error-text">{errors.totalAmountReleasedSoFar}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  शेष राशि (लाख रुपये) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="remainingBalance"
                  value={form.remainingBalance}
                  onChange={handleChange}
                  className={`form-input ${errors.remainingBalance ? 'error' : ''}`}
                  placeholder="100"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
                {errors.remainingBalance && (
                  <span className="error-text">{errors.remainingBalance}</span>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  एम बी स्टेज <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="mbStageMeasurementBookStag"
                  value={form.mbStageMeasurementBookStag}
                  onChange={handleChange}
                  className={`form-input ${errors.mbStageMeasurementBookStag ? 'error' : ''}`}
                  placeholder="gouiy"
                  disabled={isSubmitting}
                  required
                />
                {errors.mbStageMeasurementBookStag && (
                  <span className="error-text">{errors.mbStageMeasurementBookStag}</span>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  व्यय राशि (लाख रुपये) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="expenditureAmount"
                  value={form.expenditureAmount}
                  onChange={handleChange}
                  className={`form-input ${errors.expenditureAmount ? 'error' : ''}`}
                  placeholder="12"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
                {errors.expenditureAmount && (
                  <span className="error-text">{errors.expenditureAmount}</span>
                )}
              </div>
            </div>

            {/* File Uploads */}
            <div className="form-grid">
              {/* Document Upload */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  दस्तावेज़ संलग्न करें 
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

              {/* Images Upload */}
              <div className="form-group file-input-wrapper">
                <label className="form-label">
                  छवियां संलग्न करें 
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

            {/* Installments Table */}
            <div className="table-wrap">
              <h4>किस्तें</h4>
              <table>
                <thead>
                  <tr>
                    <th>किस्त क्रमांक</th>
                    <th>राशि (लाख रुपये)</th>
                    <th>दिनांक</th>
                    <th>एक्शन</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((installment, index) => (
                    <tr key={index}>
                      <td>{installment.installmentNo}</td>
                      <td>
                        <input
                          type="number"
                          value={installment.amount}
                          onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                          className="form-input"
                          placeholder="50000"
                          step="0.01"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={installment.date}
                          onChange={(e) => handleInstallmentChange(index, 'date', e.target.value)}
                          className="form-input"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => removeInstallment(index)}
                          disabled={isSubmitting || installments.length === 1}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                type="button" 
                className="btn-add" 
                onClick={addInstallment}
                disabled={isSubmitting}
              >
                + नई किस्त जोड़ें
              </button>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting || !workId}
              >
                {isSubmitting ? "सबमिट हो रहा है..." : "Save Progress & Update Status"}
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
