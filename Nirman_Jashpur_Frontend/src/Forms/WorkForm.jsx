import React, { useState, useEffect } from 'react';
import './WorkForm.css';

const initialState = {
  workYear: '',
  dept: '',
  subDept: '',
  centralDept: '',
  scheme: '',
  amount: '',
  longitude: '',
  latitude: '',
  areaType: '',
  block: '',
  ward: '',
  workType: '',
  workCategory: '',
  workName: '',
  engineer: '',
  sdo: '',
  startDate: ''
};

export default function AddToWork({ onWorkAdded, prefilledData, currentUser }){
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledData) {
      setForm({
        workYear: prefilledData.year || '',
        dept: prefilledData.agency || '',
        subDept: prefilledData.details?.subDept || '',
        centralDept: prefilledData.details?.centralDept || '',
        scheme: prefilledData.plan || '',
        amount: prefilledData.amount || '',
        longitude: prefilledData.details?.longitude || '',
        latitude: prefilledData.details?.latitude || '',
        areaType: prefilledData.details?.areaType || '',
        block: prefilledData.vname || '',
        ward: prefilledData.details?.ward || '',
        workType: prefilledData.type || '',
        workCategory: prefilledData.details?.workCategory || '',
        workName: prefilledData.name || '',
        engineer: prefilledData.details?.engineer || '',
        sdo: prefilledData.details?.sdo || '',
        startDate: prefilledData.details?.startDate || ''
      });
    }
  }, [prefilledData]);

  function update(e){
    const { name, value } = e.target;
    setForm(f=>({...f,[name]:value}));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  }

  function validate(){
    const req = ['workYear','dept','subDept','centralDept','scheme','workType','workCategory','workName', 'startDate'];
    const err = {};
    
    // Check required fields
    req.forEach(k=>{ 
      if(!form[k] || form[k].trim() === '') {
        err[k]='* आवश्यक'; 
      }
    });
    
    // Additional validations
    if (form.amount && (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) < 0)) {
      err.amount = '* वैध राशि दर्ज करें (0 या अधिक)';
    }
    
    if (form.longitude && (isNaN(parseFloat(form.longitude)) || Math.abs(parseFloat(form.longitude)) > 180)) {
      err.longitude = '* वैध रेखांश दर्ज करें (-180 से 180)';
    }
    
    if (form.latitude && (isNaN(parseFloat(form.latitude)) || Math.abs(parseFloat(form.latitude)) > 90)) {
      err.latitude = '* वैध अक्षांश दर्ज करें (-90 से 90)';
    }
    
    if (form.startDate && form.startDate.trim() !== '') {
      // Basic date format validation (dd-mm-yyyy)
      const datePattern = /^\d{2}-\d{2}-\d{4}$/;
      if (!datePattern.test(form.startDate)) {
        err.startDate = '* तिथि dd-mm-yyyy प्रारूप में दर्ज करें';
      } else {
        // Validate if it's a valid date
        const [day, month, year] = form.startDate.split('-');
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getDate() != day || dateObj.getMonth() != month - 1 || dateObj.getFullYear() != year) {
          err.startDate = '* वैध तिथि दर्ज करें';
        }
      }
    }
    
    setErrors(err);
    return Object.keys(err).length===0;
  }

  // Convert dd-mm-yyyy to Date object
  function convertDateToISO(dateString) {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('-');
    return new Date(year, month - 1, day).toISOString();
  }

  // Get authentication token from localStorage
  function getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Get user data from localStorage
  function getUserData() {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  async function submit(e){
    e.preventDefault();
    if(!validate()) return;
    
    // Check if user is authenticated
    const authToken = getAuthToken();
    if (!authToken) {
      alert('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।');
      // Redirect to login or call logout function
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get user data for submittedBy field
      const userData = getUserData();
      
      // Prepare data according to schema
      const workProposalData = {
        // Required fields
        typeOfWork: form.workType,
        nameOfWork: form.workName,
        workAgency: form.dept,
        scheme: form.scheme,
        workDescription: form.workName, // Using workName as description, you might want to add a separate field
        financialYear: form.workYear,
        workDepartment: form.dept,
        userDepartment: form.subDept,
        approvingDepartment: form.centralDept,
        sanctionAmount: parseFloat(form.amount) || 0,
        estimatedCompletionDateOfWork: convertDateToISO(form.startDate),
        
        // Optional fields
        nameOfJPDBT: form.block || null,
        nameOfGPWard: form.ward || null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        typeOfLocation: form.areaType || null,
        city: form.city || null,
        ward: form.ward || null,
        workType: form.workCategory || null,
        workName: form.workName,
        appointedEngineer: form.engineer || null,
        appointedSDO: form.sdo || null,
        
        // Default values
        workProgressStage: 'Pending Technical Approval',
        currentStatus: 'Pending Technical Approval',
        isDPROrNot: false,
        isTenderOrNot: false,
        
        // Get submittedBy from stored user data
        submittedBy: userData?.id || currentUser?.id || null,
      };

      const response = await fetch('http://localhost:3000/api/work-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Add the authentication token
        },
        body: JSON.stringify(workProposalData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          alert('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।');
          // Clear stored tokens
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
          // Redirect to login or call logout function
          return;
        } else if (response.status === 403) {
          alert('आपको इस कार्य को करने की अनुमति नहीं है।');
          return;
        }
        
        throw new Error(result.message || 'Failed to create work proposal');
      }

      // Success
      console.log('Work proposal created successfully:', result);
      setShowSuccessModal(true);
      
      // Reset form
      setForm(initialState);
      setErrors({});
      
    } catch (error) {
      console.error('Error creating work proposal:', error);
      
      // Handle specific error cases
      if (error.message.includes('validation')) {
        alert('कृपया सभी आवश्यक फ़ील्ड भरें और वैध डेटा दर्ज करें।');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।');
      } else if (error.message.includes('unauthorized') || error.message.includes('token')) {
        alert('प्राधिकरण त्रुटि। कृपया पुनः लॉगिन करें।');
        // Clear stored tokens
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      } else {
        alert('कार्य प्रस्ताव बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancel(){
    if(window.confirm('रद्द करें? भरी गयी जानकारी मिट जाएगी।')){
      setForm(initialState); 
      setErrors({});
      // Navigate back to work page if callback provided
      if (onWorkAdded) {
        onWorkAdded();
      }
    }
  }

  return (
    <div className="atw-wrapper">
      <div className="atw-header-bar">
        <div className="atw-header-left">
          <h1 className="atw-title">निर्माण</h1>
          <div className="atw-breadcrumbs">Dashboard / Work / Work-Add</div>
        </div>
      </div>
      <div className="atw-main-card" role="region" aria-label="Add Work Form">
        <div className="atw-card-head">कार्य जोड़ें</div>
        <form className="atw-form" onSubmit={submit} noValidate>
          <div className="atw-form-title">कार्य जोड़ें</div>
          {/* Row 1 */}
          <div className="atw-grid">
            <div className="fld">
              <label>वित्तीय वर्ष <span className="req">*</span></label>
              <select name="workYear" value={form.workYear} onChange={update} disabled={isSubmitting}>
                <option value="">-- वित्तीय वर्ष चुने --</option>
                <option>2024-25</option>
                <option>2023-24</option>
              </select>
              {errors.workYear && <small className="err">{errors.workYear}</small>}
            </div>
            <div className="fld">
              <label>कार्य विभाग <span className="req">*</span></label>
              <select name="dept" value={form.dept} onChange={update} disabled={isSubmitting}>
                <option value="">-- कार्य विभाग चुने --</option>
                <option>आदिवासी विकास विभाग, जशपुर</option>
                <option>जनपद पंचायत</option>
              </select>
              {errors.dept && <small className="err">{errors.dept}</small>}
            </div>
            <div className="fld">
              <label>उपविभागीय विभाग <span className="req">*</span></label>
              <select name="subDept" value={form.subDept} onChange={update} disabled={isSubmitting}>
                <option value="">-- उपविभागीय विभाग चुने --</option>
                <option>उपविभाग A</option>
                <option>उपविभाग B</option>
              </select>
              {errors.subDept && <small className="err">{errors.subDept}</small>}
            </div>
            <div className="fld">
              <label>स्वीकृतकर्ता विभाग <span className="req">*</span></label>
              <select name="centralDept" value={form.centralDept} onChange={update} disabled={isSubmitting}>
                <option value="">-- स्वीकृतकर्ता विभाग चुने --</option>
                <option>स्वीकृतकर्ता विभाग A</option>
                <option>स्वीकृतकर्ता विभाग B</option>
              </select>
              {errors.centralDept && <small className="err">{errors.centralDept}</small>}
            </div>
          </div>
          {/* Row 2 */}
          <div className="atw-grid">
            <div className="fld">
              <label>योजना <span className="req">*</span></label>
              <select name="scheme" value={form.scheme} onChange={update} disabled={isSubmitting}>
                <option value="">-- योजना चुने --</option>
                <option>CM योजना</option>
                <option>Block Plan</option>
              </select>
              {errors.scheme && <small className="err">{errors.scheme}</small>}
            </div>
            <div className="fld amt">
              <label>राशि (₹) <span className="req">*</span></label>
              <input 
                name="amount" 
                value={form.amount} 
                onChange={update} 
                placeholder="राशि" 
                type="number" 
                step="0.01" 
                min="0"
                disabled={isSubmitting}
              />
              {errors.amount && <small className="err">{errors.amount}</small>}
            </div>
            <div className="fld">
              <label>देशान्तर (Longitude)</label>
              <input 
                name="longitude" 
                value={form.longitude} 
                onChange={update} 
                placeholder="देशान्तर(Longitude)" 
                type="number" 
                step="any"
                disabled={isSubmitting}
              />
              {errors.longitude && <small className="err">{errors.longitude}</small>}
            </div>
            <div className="fld">
              <label>अक्षांश (Latitude)</label>
              <input 
                name="latitude" 
                value={form.latitude} 
                onChange={update} 
                placeholder="अक्षांश(Latitude)" 
                type="number" 
                step="any"
                disabled={isSubmitting}
              />
              {errors.latitude && <small className="err">{errors.latitude}</small>}
            </div>
          </div>
          {/* Row 3 */}
          <div className="atw-grid">
            <div className="fld">
              <label>क्षेत्र का प्रकार</label>
              <select name="areaType" value={form.areaType} onChange={update} disabled={isSubmitting}>
                <option value="">-- प्रकार चुनें --</option>
                <option>ग्राम</option>
                <option>शहर</option>
              </select>
            </div>
            <div className="fld">
              <label>शहर / नगर</label>
              <select name="city" value={form.city} onChange={update} disabled={isSubmitting}>
                <option value="">-- शहर चुने --</option>
                <option>बगीचा</option>
                <option>दुलदुला</option>
                <option>फरसाबहार</option>
                <option>कांसाबेल</option>
                <option>कोटबा</option>
                <option>मनोरा</option>
                <option>कुनकुरी</option>
                <option>जशपुर नगर</option>
                <option>पत्थलगांव</option>
              </select>
            </div>
            <div className="fld">
              <label>वार्ड / ग्राम</label>
              <select name="ward" value={form.ward} onChange={update} disabled={isSubmitting}>
                <option value="">-- वार्ड चुने --</option>
                <option>Ward 1</option>
                <option>Ward 2</option>
              </select>
            </div>
            <div className="fld">
              <label>कार्य के प्रकार <span className="req">*</span></label>
              <select name="workType" value={form.workType} onChange={update} disabled={isSubmitting}>
                <option value="">-- कार्य के प्रकार चुने --</option>
                <option>सीसी रोड</option>
                <option>भवन निर्माण</option>
              </select>
              {errors.workType && <small className="err">{errors.workType}</small>}
            </div>
            <div className="fld">
              <label>कार्य श्रेणी <span className="req">*</span></label>
              <select name="workCategory" value={form.workCategory} onChange={update} disabled={isSubmitting}>
                <option value="">-- श्रेणी चुने --</option>
                <option>नई</option>
                <option>मरम्मत</option>
              </select>
              {errors.workCategory && <small className="err">{errors.workCategory}</small>}
            </div>
            <div className="fld">
              <label>कार्य का नाम <span className="req">*</span></label>
              <input 
                name="workName" 
                value={form.workName} 
                onChange={update} 
                placeholder="कार्य नाम"
                disabled={isSubmitting}
              />
              {errors.workName && <small className="err">{errors.workName}</small>}
            </div>
            <div className="fld">
              <label>इंजीनियर अधिकारी</label>
              <select name="engineer" value={form.engineer} onChange={update} disabled={isSubmitting}>
                <option value="">-- इंजीनियर चुने --</option>
                <option>Engineer A</option>
                <option>Engineer B</option>
              </select>
            </div>
            <div className="fld">
              <label>नियुक्त एसडीओ</label>
              <select name="sdo" value={form.sdo} onChange={update} disabled={isSubmitting}>
                <option value="">-- एसडीओ चुनें --</option>
                <option>SDO A</option>
                <option>SDO B</option>
                <option>SDO C</option>
              </select>
            </div>
            <div className="fld">
              <label>कार्य आरंभ तिथि <span className="req">*</span></label>
              <input 
                name="startDate" 
                value={form.startDate} 
                onChange={update} 
                placeholder="dd-mm-yyyy"
                disabled={isSubmitting}
              />
              {errors.startDate && <small className="err">{errors.startDate}</small>}
            </div>
            <div className="fld checkbox-col span2">
              <label className="chk"><input type="checkbox" disabled={isSubmitting} /> डी.पी.आर. प्राप्त नहीं है</label>
              <label className="chk"><input type="checkbox" disabled={isSubmitting} /> निविदा है</label>
              <label className="chk"><input type="checkbox" disabled={isSubmitting} /> निविदा प्राप्त नहीं है</label>
            </div>
          </div>
          <div className="atw-form-actions">
            <button type="submit" className="atw-btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
            <button type="button" className="atw-btn" onClick={cancel} disabled={isSubmitting}>CANCEL</button>
          </div>
        </form>
      </div>
      <footer className="atw-footer">
        <span>Copyright © 2025 निर्माण</span>
        <span className="ver">Version 1.0</span>
      </footer>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>कार्य सफलतापूर्वक अपडेट हुआ!</h3>
              <p>Work Proposal Created Successfully!</p>
              <button 
                className="modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onWorkAdded) {
                    setTimeout(() => {
                      onWorkAdded();
                    }, 300);
                  }
                }}
              >
                ठीक है
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
