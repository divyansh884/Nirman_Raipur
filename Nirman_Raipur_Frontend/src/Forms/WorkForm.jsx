import React, { useState, useEffect } from 'react';
import './WorkForm.css';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';

// Generate dynamic financial years (current + past 5 years)
const generateFinancialYears = () => {
  const years = [];
  const currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Months are 0-based

  // Financial Year starts from April (if current month is Jan-Mar, use previous year)
  if (currentMonth <= 3) {
    currentYear = currentYear - 1;
  }

  // Generate current financial year and previous 5 years
  for (let i = 0; i <= 5; i++) {
    const startYear = currentYear - i;
    const endYear = String(startYear + 1).slice(2); // Get last 2 digits
    years.push(`${startYear}-${endYear}`);
  }

  return years;
};

const initialState = {
  financialYear: '', // Will be set to current financial year
  workDepartment: '',
  userDepartment: '', // subDept
  approvingDepartment: '', // centralDept
  workAgency: '', // ✅ Work Agency field
  scheme: '',
  longitude: '',
  latitude: '',
  typeOfLocation: '',
  city: '',
  ward: '',
  typeOfWork: '',
  nameOfWork: '',
  workDescription: '',
  appointedEngineer: '',
  appointedSDO: '',
  estimatedCompletionDateOfWork: '',
  map: '',
  landmarkNumber: '',
  promise: '',
  workName: '',
  nameOfJPDBT: '',
  nameOfGPWard: '',
  plan: '',
  assembly: '',
  workOrderAmount: '',
  // ✅ Checkbox states
  isDPROrNot: true, // Default true (DPR received)
  isTenderOrNot: false, // Default false (no tender required)
};

export default function AddToWork({ onWorkAdded, prefilledData, currentUser }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic dropdown data
  const [dropdownData, setDropdownData] = useState({
    typeOfWorks: [],
    schemes: [],
    cities: [],
    workDepartments: [],
    wards: [],
    typeOfLocations: [],
    workAgencies: [],
    engineers: [],
    sdos: []
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { workId } = useParams();

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout, user } = useAuthStore();

  // Generate financial years
  const financialYears = generateFinancialYears();

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      alert('प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।');
      navigate('/login');
      return;
    }

    // Set default financial year to current year
    setForm(prev => ({
      ...prev,
      financialYear: financialYears[0] // Current financial year
    }));

    // Fetch dropdown data
    fetchDropdownData();
  }, [isAuthenticated, token, navigate]);

  // Fetch dropdown data from backend
  const fetchDropdownData = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const endpoints = [
        { key: 'typeOfWorks', url: '/admin/type-of-work' },
        { key: 'schemes', url: '/admin/scheme' },
        { key: 'cities', url: '/admin/city' },
        { key: 'workDepartments', url: '/admin/department' },
        { key: 'wards', url: '/admin/ward' },
        { key: 'typeOfLocations', url: '/admin/type-of-location' },
        { key: 'workAgencies', url: '/admin/work-agency' },
        { key: 'sdos', url: '/admin/sdo' }
      ];

      // Fetch regular dropdown data
      const promises = endpoints.map(endpoint =>
        fetch(`${BASE_SERVER_URL}${endpoint.url}`, {
           method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${endpoint.key}`);
          return res.json();
        }).then(data => ({ 
          key: endpoint.key, 
          data: data.success ? data.data : (data.data || data) 
        })).catch(err => {
          console.error(`Error fetching ${endpoint.key}:`, err);
          return { key: endpoint.key, data: [] };
        })
      );

      // Fetch engineers (users with role 'Engineer')
      const engineersPromise = fetch(`${BASE_SERVER_URL}/admin/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      }).then(data => {
        const allUsers = data.success ? data.data : (data.data || data || []);
        const engineers = Array.isArray(allUsers) 
          ? allUsers.filter(user => user.role === 'Engineer' && user.isActive === true)
          : [];
        return { key: 'engineers', data: engineers };
      }).catch(err => {
        console.error('Error fetching engineers:', err);
        return { key: 'engineers', data: [] };
      });

      const allPromises = [...promises, engineersPromise];
      const results = await Promise.all(allPromises);
      const newDropdownData = {};
      
      results.forEach(result => {
        newDropdownData[result.key] = Array.isArray(result.data) ? result.data : [];
      });

      setDropdownData(newDropdownData);
      console.log('Dropdown data loaded:', newDropdownData);

    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  // Handle prefilled data
  useEffect(() => {
    if (prefilledData) {
      setForm(prev => ({
        ...prev,
        financialYear: prefilledData.financialYear || prev.financialYear,
        workDepartment: prefilledData.workDepartment || '',
        userDepartment: prefilledData.userDepartment || '',
        approvingDepartment: prefilledData.approvingDepartment || '',
        workAgency: prefilledData.workAgency || '', 
        scheme: prefilledData.scheme || '',
        longitude: prefilledData.longitude || '',
        latitude: prefilledData.latitude || '',
        typeOfLocation: prefilledData.typeOfLocation || '',
        city: prefilledData.city || '',
        ward: prefilledData.ward || '',
        typeOfWork: prefilledData.typeOfWork || '',
        nameOfWork: prefilledData.nameOfWork || '',
        workDescription: prefilledData.workDescription || '',
        appointedEngineer: prefilledData.appointedEngineer || '',
        appointedSDO: prefilledData.appointedSDO || '',
        estimatedCompletionDateOfWork: prefilledData.estimatedCompletionDateOfWork || '',
        map: prefilledData.map || '',
        landmarkNumber: prefilledData.landmarkNumber || '',
        promise: prefilledData.promise || '',
        workName: prefilledData.workName || '',
        isDPROrNot: prefilledData.isDPROrNot ?? true,
        isTenderOrNot: prefilledData.isTenderOrNot ?? false
      }));
    }
  }, [prefilledData]);

  function update(e) {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setForm(f => ({ ...f, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const requiredFields = [
      'financialYear', 'workDepartment', 'userDepartment', 'approvingDepartment', 
      'workAgency', 'appointedEngineer',
      'scheme', 'typeOfWork', 'nameOfWork', 'workDescription', 'estimatedCompletionDateOfWork'
    ];
    const err = {};
    
    // Check required fields
    requiredFields.forEach(k => { 
      if (!form[k] || form[k].trim() === '') {
        err[k] = '* आवश्यक'; 
      }
    });
    
    // Additional validations
    if (form.longitude && (isNaN(parseFloat(form.longitude)) || Math.abs(parseFloat(form.longitude)) > 180)) {
      err.longitude = '* वैध रेखांश दर्ज करें (-180 से 180)';
    }
    
    if (form.latitude && (isNaN(parseFloat(form.latitude)) || Math.abs(parseFloat(form.latitude)) > 90)) {
      err.latitude = '* वैध अक्षांश दर्ज करें (-90 से 90)';
    }
    
    if (form.workOrderAmount && (isNaN(parseFloat(form.workOrderAmount)) || parseFloat(form.workOrderAmount) < 0)) {
      err.workOrderAmount = '* वैध राशि दर्ज करें (0 या अधिक)';
    }
    
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  // Convert date to ISO format
  function convertDateToISO(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toISOString();
    } catch {
      return null;
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    if (!isAuthenticated || !token) {
      alert('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // ✅ Prepare data according to the API body structure
      const workProposalData = {
        // Required fields from API body
        typeOfWork: form.typeOfWork,
        nameOfWork: form.nameOfWork,
        workAgency: form.workAgency, // ✅ Use workAgency directly from form
        scheme: form.scheme,
        nameOfJPDBT: form.nameOfJPDBT || 'Default JPDBT',
        nameOfGPWard: form.nameOfGPWard || form.ward,
        workDescription: form.workDescription,
        financialYear: form.financialYear,
        workDepartment: form.workDepartment,
        approvingDepartment: form.approvingDepartment,
        sanctionAmount: 0, // ✅ Hidden field - default to 0 as required
        plan: form.plan || 'Default Plan',
        assembly: form.assembly || 'Default Assembly',
        longitude: form.longitude ? parseFloat(form.longitude) : 75.0364,
        latitude: form.latitude ? parseFloat(form.latitude) : 23.3345,
        typeOfLocation: form.typeOfLocation,
        city: form.city,
        ward: form.ward,
        workOrderAmount: form.workOrderAmount ? parseFloat(form.workOrderAmount) : 1400000,
        map: form.map || 'https://example.com/maps/location.pdf',
        landmarkNumber: form.landmarkNumber || 'LMK-DEFAULT',
        promise: form.promise || 'Default Promise',
        workName: form.workName || form.nameOfWork,
        appointedEngineer: form.appointedEngineer,
        appointedSDO: form.appointedSDO,
        estimatedCompletionDateOfWork: convertDateToISO(form.estimatedCompletionDateOfWork),
        isDPROrNot: form.isDPROrNot,
        isTenderOrNot: form.isTenderOrNot,
        
        // System fields
        workProgressStage: 'Pending Technical Approval',
        currentStatus: 'Pending Technical Approval',
        submittedBy: user?.id || currentUser?.id || null
      };

      console.log("📤 Sending work proposal data:", workProposalData);

      const response = await fetch(`${BASE_SERVER_URL}/work-proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workProposalData)
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert('आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।');
          logout();
          navigate('/login');
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
      setForm({
        ...initialState,
        financialYear: financialYears[0] // Reset to current year
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error creating work proposal:', error);
      
      if (error.message.includes('validation')) {
        alert('कृपया सभी आवश्यक फ़ील्ड भरें और वैध डेटा दर्ज करें।');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।');
      } else if (error.message.includes('unauthorized') || error.message.includes('token')) {
        alert('प्राधिकरण त्रुटि। कृपया पुनः लॉगिन करें।');
        logout();
        navigate('/login');
      } else {
        alert('कार्य प्रस्ताव बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancel() {
    if (window.confirm('रद्द करें? भरी गयी जानकारी मिट जाएगी।')) {
      setForm({
        ...initialState,
        financialYear: financialYears[0]
      }); 
      setErrors({});
      if (onWorkAdded) {
        onWorkAdded();
      }
    }
  }

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="atw-wrapper">
        <div className="atw-header-bar">
          <div className="atw-header-left">
            <h1 className="atw-title">निर्माण</h1>
            <div className="atw-breadcrumbs">Work / Work-Add</div>
          </div>
        </div>
        <div className="atw-main-card" role="region" aria-label="Authentication Required">
          <div className="atw-card-head">प्रमाणीकरण आवश्यक</div>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
            <div style={{ color: 'orange', marginBottom: '20px' }}>
              प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
            </div>
            <button 
              className="atw-btn primary" 
              onClick={() => navigate('/login')}
            >
              <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="atw-wrapper">
      <div className="atw-header-bar">
        <div className="atw-header-left">
          <h1 className="atw-title">निर्माण</h1>
          <div className="atw-breadcrumbs">Work / Work-Add</div>
        </div>
      </div>
      <div className="atw-main-card" role="region" aria-label="Add Work Form">
        <div className="atw-card-head">कार्य जोड़ें</div>
        <form className="atw-form" onSubmit={submit} noValidate>
          <div className="atw-form-title" style={{marginTop:"10px"}}>कार्य जोड़ें</div>
          
          {/* Row 1 */}
          <div className="atw-grid">
            {/* ✅ Dynamic Financial Year Dropdown */}
            <div className="fld">
              <label>वित्तीय वर्ष <span className="req">*</span></label>
              <select name="financialYear" value={form.financialYear} onChange={update} disabled={isSubmitting}>
                <option value="">-- वित्तीय वर्ष चुने --</option>
                {financialYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.financialYear && <small className="err">{errors.financialYear}</small>}
            </div>

            {/* ✅ Dynamic Work Department Dropdown */}
            <div className="fld">
              <label>कार्य विभाग <span className="req">*</span></label>
              <select name="workDepartment" value={form.workDepartment} onChange={update} disabled={isSubmitting}>
                <option value="">-- कार्य विभाग चुने --</option>
                {dropdownData.workDepartments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name || dept.workDeptName}
                  </option>
                ))}
              </select>
              {errors.workDepartment && <small className="err">{errors.workDepartment}</small>}
            </div>

            <div className="fld">
              <label>उपविभागीय विभाग <span className="req">*</span></label>
              <select name="userDepartment" value={form.userDepartment} onChange={update} disabled={isSubmitting}>
                <option value="">-- उपविभागीय विभाग चुने --</option>
                {dropdownData.workDepartments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name || dept.workDeptName}
                  </option>
                ))}
              </select>
              {errors.userDepartment && <small className="err">{errors.userDepartment}</small>}
            </div>

            <div className="fld">
              <label>स्वीकृतकर्ता विभाग <span className="req">*</span></label>
              <select name="approvingDepartment" value={form.approvingDepartment} onChange={update} disabled={isSubmitting}>
                <option value="">-- स्वीकृतकर्ता विभाग चुने --</option>
                {dropdownData.workDepartments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name || dept.workDeptName}
                  </option>
                ))}
              </select>
              {errors.approvingDepartment && <small className="err">{errors.approvingDepartment}</small>}
            </div>
          </div>

          {/* Row 2 */}
          <div className="atw-grid">
            {/* ✅ Dynamic Scheme Dropdown */}
            <div className="fld">
              <label>योजना <span className="req">*</span></label>
              <select name="scheme" value={form.scheme} onChange={update} disabled={isSubmitting}>
                <option value="">-- योजना चुने --</option>
                {dropdownData.schemes.map((scheme) => (
                  <option key={scheme._id || scheme.id} value={scheme._id || scheme.id}>
                    {scheme.name}
                  </option>
                ))}
              </select>
              {errors.scheme && <small className="err">{errors.scheme}</small>}
            </div>

            {/* ✅ ADDED Work Agency Dropdown */}
            <div className="fld">
              <label>कार्य एजेंसी <span className="req">*</span></label>
              <select name="workAgency" value={form.workAgency} onChange={update} disabled={isSubmitting}>
                <option value="">-- कार्य एजेंसी चुने --</option>
                {dropdownData.workAgencies.map((agency) => (
                  <option key={agency._id || agency.id} value={agency._id || agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
              {errors.workAgency && <small className="err">{errors.workAgency}</small>}
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
            {/* ✅ Dynamic Type of Location Dropdown */}
            <div className="fld">
              <label>क्षेत्र का प्रकार</label>
              <select name="typeOfLocation" value={form.typeOfLocation} onChange={update} disabled={isSubmitting}>
                <option value="">-- प्रकार चुनें --</option>
                {dropdownData.typeOfLocations.map((type) => (
                  <option key={type._id || type.id} value={type._id || type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Dynamic City Dropdown */}
            <div className="fld">
              <label>शहर / नगर</label>
              <select name="city" value={form.city} onChange={update} disabled={isSubmitting}>
                <option value="">-- शहर चुने --</option>
                {dropdownData.cities.map((city) => (
                  <option key={city._id || city.id} value={city._id || city.id}>
                    {city.name || city.cityName}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Dynamic Ward Dropdown */}
            <div className="fld">
              <label>वार्ड / ग्राम</label>
              <select name="ward" value={form.ward} onChange={update} disabled={isSubmitting}>
                <option value="">-- वार्ड चुने --</option>
                {dropdownData.wards.map((ward) => (
                  <option key={ward._id || ward.id} value={ward._id || ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Dynamic Work Type Dropdown */}
            <div className="fld">
              <label>कार्य के प्रकार <span className="req">*</span></label>
              <select name="typeOfWork" value={form.typeOfWork} onChange={update} disabled={isSubmitting}>
                <option value="">-- कार्य के प्रकार चुने --</option>
                {dropdownData.typeOfWorks.map((type) => (
                  <option key={type._id || type.id} value={type._id || type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.typeOfWork && <small className="err">{errors.typeOfWork}</small>}
            </div>
          </div>

          {/* Row 4 */}
          <div className="atw-grid">
            <div className="fld">
              <label>नक्शा</label>
              <input 
                name="map"
                value={form.map} 
                onChange={update} 
                placeholder="नक्शा URL"
                disabled={isSubmitting}
              />
            </div>

            <div className="fld">
              <label>खसरा</label>
              <input 
                name="landmarkNumber"
                value={form.landmarkNumber} 
                onChange={update} 
                placeholder="खसरा नंबर"
                disabled={isSubmitting}
              />
            </div>

            <div className="fld">
              <label>प्रस्ताव</label>
              <input 
                name="promise"
                value={form.promise} 
                onChange={update} 
                placeholder="प्रस्ताव विवरण"
                disabled={isSubmitting}
              />
            </div>

            <div className="fld">
              <label>कार्य का नाम <span className="req">*</span></label>
              <input 
                name="nameOfWork" 
                value={form.nameOfWork} 
                onChange={update} 
                placeholder="कार्य का नाम"
                disabled={isSubmitting}
              />
              {errors.nameOfWork && <small className="err">{errors.nameOfWork}</small>}
            </div>
          </div>

          {/* Row 5 */}
          <div className="atw-grid">
            {/* ✅ Dynamic Engineer Dropdown */}
            <div className="fld">
              <label>इंजीनियर अधिकारी<span className="req">*</span></label>
              <select name="appointedEngineer" value={form.appointedEngineer} onChange={update} disabled={isSubmitting}>
                <option value="">-- इंजीनियर चुने --</option>
                {dropdownData.engineers.map((engineer) => (
                  <option key={engineer.id || engineer._id} value={engineer.id || engineer._id}>
                    {engineer.fullName} ({engineer.role})
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Dynamic SDO Dropdown */}
            <div className="fld">
              <label>नियुक्त एसडीओ</label>
              <select name="appointedSDO" value={form.appointedSDO} onChange={update} disabled={isSubmitting}>
                <option value="">-- एसडीओ चुनें --</option>
                {dropdownData.sdos.map((sdo) => (
                  <option key={sdo._id || sdo.id} value={sdo._id || sdo.id}>
                    {sdo.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fld">
              <label>कार्य पूर्ण होने की अनुमानित तिथि <span className="req">*</span></label>
              <input 
                name="estimatedCompletionDateOfWork" 
                value={form.estimatedCompletionDateOfWork} 
                onChange={update} 
                type="date"
                disabled={isSubmitting}
              />
              {errors.estimatedCompletionDateOfWork && <small className="err">{errors.estimatedCompletionDateOfWork}</small>}
            </div>

            <div className="fld">
              <label>कार्य विवरण <span className="req">*</span></label>
              <textarea 
                name="workDescription" 
                value={form.workDescription} 
                onChange={update} 
                placeholder="कार्य का विस्तृत विवरण"
                disabled={isSubmitting}
                rows="3"
              />
              {errors.workDescription && <small className="err">{errors.workDescription}</small>}
            </div>
          </div>

          {/* ✅ Checkbox Section */}
          <div className="atw-grid">
            <div className="fld checkbox-col span-2">
              <label className="chk">
                <input 
                  type="checkbox" 
                  name="isDPROrNot"
                  checked={form.isDPROrNot}
                  onChange={update}
                  disabled={isSubmitting} 
                /> 
                डी.पी.आर. प्राप्त है
              </label>
              
              <label className="chk">
                <input 
                  type="checkbox" 
                  name="isTenderOrNot"
                  checked={form.isTenderOrNot}
                  onChange={update}
                  disabled={isSubmitting} 
                /> 
                निविदा आवश्यक है
              </label>
            </div>
          </div>
          
          <div className="atw-form-actions">
            <button type="submit" className="atw-btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'सबमिट हो रहा है...' : 'SUBMIT'}
            </button>
            <button type="button" className="atw-btn" onClick={cancel} disabled={isSubmitting}>
              CANCEL
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>कार्य सफलतापूर्वक जोड़ा गया!</h3>
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
