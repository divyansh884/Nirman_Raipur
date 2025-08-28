import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./WorkInProgressForm.css";
import TopBar from "../Components/TopBar.jsx";
export default function WorkInProgressForm({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workId } = useParams();

  // ✅ Breadcrumbs based on path
  const crumbs = React.useMemo(() => {
    const parts = location.pathname
      .split("/")
      .filter(Boolean)
      .map((s) =>
        s.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
      );
    return [...parts].join(" / ");
  }, [location.pathname]);

  // ✅ Set Page Title
  useEffect(() => {
    document.title = "निर्माण | राशि प्रगति प्रपत्र";
    
    // Debug workID
    console.log("🔍 Work Progress Form - workID:", workId);
    
    if (!workId) {
      alert("कार्य ID नहीं मिला। कृपया वापस जाएं।");
      navigate(-1);
    }
  }, [workId, navigate]);

  const [rows, setRows] = useState([{ kisht: 1, amount: "", date: "", description: "" }]);
  
  // ✅ Updated form state to match API requirements
  const [form, setForm] = useState({
    sanctionedAmount: "",
    releasedAmount: "",
    remainingAmount: "",
    mbStage: "",
    expenditureAmount: "",
    progressPercentage: "",
    progressDescription: "",
    installmentAmount: "",
    installmentDate: "",
    installmentDescription: ""
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get authentication token
  function getAuthToken() {
    return localStorage.getItem("authToken");
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRowChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRows = [...rows];
    updatedRows[index][name] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { kisht: rows.length + 1, amount: "", date: "", description: "" }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const updatedRows = rows.filter((_, i) => i !== index);
      // Re-number the kisht values
      const reNumberedRows = updatedRows.map((row, i) => ({
        ...row,
        kisht: i + 1
      }));
      setRows(reNumberedRows);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.progressPercentage || parseFloat(form.progressPercentage) < 0 || parseFloat(form.progressPercentage) > 100) {
      newErrors.progressPercentage = 'प्रगति प्रतिशत 0-100 के बीच होना चाहिए';
    }
    
    if (!form.mbStage.trim()) {
      newErrors.mbStage = 'एम बी स्टेज आवश्यक है';
    }
    
    if (!form.expenditureAmount || parseFloat(form.expenditureAmount) <= 0) {
      newErrors.expenditureAmount = 'वैध व्यय राशि दर्ज करें';
    }
    
    if (!form.progressDescription.trim()) {
      newErrors.progressDescription = 'प्रगति विवरण आवश्यक है';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert date to ISO format
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

  // ✅ API Call 1: Submit Progress Update
  const submitProgressUpdate = async () => {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error("Authentication required");
    }

    const payload = {
      progressPercentage: parseFloat(form.progressPercentage),
      mbStageMeasurementBookStag: form.mbStage,
      expenditureAmount: parseFloat(form.expenditureAmount),
      installmentAmount: parseFloat(form.installmentAmount) || 0,
      installmentDate: convertToISODate(form.installmentDate),
      description: form.progressDescription
    };

    console.log("📤 Submitting progress update:", payload);

    const response = await axios.post(
      `http://localhost:3000/api/work-proposals/${workId}/progress`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        }
      }
    );

    return response;
  };

  // ✅ API Call 2: Submit Installment (for each row)
  const submitInstallment = async (installmentData) => {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error("Authentication required");
    }

    const payload = {
      amount: parseFloat(installmentData.amount),
      date: convertToISODate(installmentData.date),
      description: installmentData.description || `Installment ${installmentData.kisht}`
    };

    console.log("📤 Submitting installment:", payload);

    const response = await axios.post(
      `http://localhost:3000/api/work-proposals/${workId}/progress/installment`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        }
      }
    );

    return response;
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

  // ✅ Main Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) {
        return;
      }

      const authToken = getAuthToken();
      if (!authToken) {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        navigate("/login");
        return;
      }

      if (!workId) {
        alert("कार्य ID नहीं मिला। कृपया पेज रीलोड करें।");
        return;
      }

      setIsSubmitting(true);

      // Step 1: Submit Progress Update
      console.log("📋 Step 1: Submitting progress update...");
      await submitProgressUpdate();
      console.log("✅ Progress update successful");

      // Step 2: Submit Installments (for each row with data)
      const validRows = rows.filter(row => row.amount && row.date);
      if (validRows.length > 0) {
        console.log(`📋 Step 2: Submitting ${validRows.length} installments...`);
        
        for (const row of validRows) {
          await submitInstallment(row);
          console.log(`✅ Installment ${row.kisht} submitted successfully`);
        }
      }

      // Success
      alert("राशि प्रगति प्रपत्र सफलतापूर्वक सहेजा गया!");
      
      // Reset form
      setForm({
        sanctionedAmount: "",
        releasedAmount: "",
        remainingAmount: "",
        mbStage: "",
        expenditureAmount: "",
        progressPercentage: "",
        progressDescription: "",
        installmentAmount: "",
        installmentDate: "",
        installmentDescription: ""
      });
      
      setRows([{ kisht: 1, amount: "", date: "", description: "" }]);
      setErrors({});

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
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
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

  return (
    <div className="workprogress-page">
      {/* ✅ Top bar */}
      <div className="header">
        <TopBar />

        <div className="subbar">
          <span className="dot" />
          <h2>राशि प्रगति प्रपत्र - Work ID: {workId}</h2>
        </div>
      </div>

      {/* ✅ Form card */}
      <div className="wrap">
        <section className="panel">
          <div className="panel-header">
            <h3>राशि प्रगति विवरण</h3>
          </div>

          <form className="p-body" onSubmit={handleSubmit}>
            {/* ✅ Basic Progress Information */}
            <div className="form-grid">
              <div className="form-group">
                <label>प्रगति प्रतिशत (%) <span className="req">*</span></label>
                <input
                  type="number"
                  name="progressPercentage"
                  value={form.progressPercentage}
                  onChange={handleChange}
                  className={`form-input ${errors.progressPercentage ? 'error' : ''}`}
                  placeholder="45"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={isSubmitting}
                  required
                />
                {errors.progressPercentage && (
                  <span className="error-text">{errors.progressPercentage}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>एम बी स्टेज <span className="req">*</span></label>
                <input
                  type="text"
                  name="mbStage"
                  value={form.mbStage}
                  onChange={handleChange}
                  className={`form-input ${errors.mbStage ? 'error' : ''}`}
                  placeholder="Stage 2 - Foundation Work Completed"
                  disabled={isSubmitting}
                  required
                />
                {errors.mbStage && (
                  <span className="error-text">{errors.mbStage}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>व्यय राशि <span className="req">*</span></label>
                <input
                  type="number"
                  name="expenditureAmount"
                  value={form.expenditureAmount}
                  onChange={handleChange}
                  className={`form-input ${errors.expenditureAmount ? 'error' : ''}`}
                  placeholder="1200000"
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

            {/* ✅ Additional Progress Fields */}
            <div className="form-grid">
              <div className="form-group">
                <label>किस्त राशि</label>
                <input
                  type="number"
                  name="installmentAmount"
                  value={form.installmentAmount}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="500000"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label>किस्त तिथि</label>
                <input
                  type="date"
                  name="installmentDate"
                  value={form.installmentDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* ✅ Progress Description */}
            <div className="form-group full">
              <label>प्रगति विवरण <span className="req">*</span></label>
              <textarea
                name="progressDescription"
                value={form.progressDescription}
                onChange={handleChange}
                className={`form-input textarea ${errors.progressDescription ? 'error' : ''}`}
                placeholder="Work has reached 45% completion. Foundation laid and initial road leveling completed."
                rows={3}
                disabled={isSubmitting}
                required
              />
              {errors.progressDescription && (
                <span className="error-text">{errors.progressDescription}</span>
              )}
            </div>

            {/* ✅ Dynamic Installments Table */}
            <div className="table-wrap">
              <h4>अतिरिक्त किस्तें</h4>
              <table>
                <thead>
                  <tr>
                    <th>किस्त क्रमांक</th>
                    <th>राशि</th>
                    <th>दिनांक</th>
                    <th>विवरण</th>
                    <th>एक्शन</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.kisht}</td>
                      <td>
                        <input
                          type="number"
                          name="amount"
                          value={row.amount}
                          onChange={(e) => handleRowChange(index, e)}
                          className="form-input"
                          placeholder="750000"
                          step="0.01"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="date"
                          value={row.date}
                          onChange={(e) => handleRowChange(index, e)}
                          className="form-input"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="description"
                          value={row.description}
                          onChange={(e) => handleRowChange(index, e)}
                          className="form-input"
                          placeholder="First installment for materials"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => removeRow(index)}
                          disabled={isSubmitting || rows.length === 1}
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
                onClick={addRow}
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
                {isSubmitting ? "सबमिट हो रहा है..." : "Save Progress"}
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
