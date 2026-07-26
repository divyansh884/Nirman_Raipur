import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, Edit, Trash2, Eye } from 'lucide-react';
import useAuthStore from '../Store/useAuthStore.js';
import TopBar from '../Components/TopBar.jsx';
import './AdminWorkForm.css';
import { BASE_SERVER_URL } from '../constants.jsx';

const AdminWorkForm = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  // State for all schema data
  const [schemaData, setSchemaData] = useState({
    cities: [],
    schemes: [],
    sdos: [],
    typeOfLocations: [],
    typeOfWorks: [],
    wards: [],
    workAgencies: [],
    workDepartments: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [dialogData, setDialogData] = useState('');
  
  // ✅ ADDED: Edit dialog states
  const [activeEditDialog, setActiveEditDialog] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDialogData, setEditDialogData] = useState('');
  
  const [searchTerms, setSearchTerms] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false); // ✅ ADDED: Update loading state
  const [deleting, setDeleting] = useState(null);
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({}); // ✅ ADDED: Edit validation errors

  // ✅ UPDATED: Schema configurations (removed canDelete restriction - all can be deleted)
  const schemaConfigs = [
    {
      key: 'cities',
      title: 'शहर',
      endpoint: '/admin/city',
      field: 'name',
      placeholder: 'शहर का नाम दर्ज करें'
    },
    {
      key: 'schemes',
      title: 'योजना',
      endpoint: '/admin/scheme',
      field: 'name',
      placeholder: 'योजना का नाम दर्ज करें'
    },
    {
      key: 'sdos',
      title: 'SDO',
      endpoint: '/admin/sdo',
      field: 'name',
      placeholder: 'SDO का नाम दर्ज करें'
    },
    {
      key: 'typeOfLocations',
      title: 'स्थान का प्रकार',
      endpoint: '/admin/type-of-location',
      field: 'name',
      placeholder: 'स्थान प्रकार दर्ज करें'
    },
    {
      key: 'typeOfWorks',
      title: 'कार्य का प्रकार',
      endpoint: '/admin/type-of-work',
      field: 'name',
      placeholder: 'कार्य प्रकार दर्ज करें'
    },
    {
      key: 'wards',
      title: 'ग्राम/वार्ड',
      endpoint: '/admin/ward',
      field: 'name',
      placeholder: 'ग्राम/वार्ड का नाम दर्ज करें'
    },
    {
      key: 'workAgencies',
      title: 'कार्य एजेंसी',
      endpoint: '/admin/work-agency',
      field: 'name',
      placeholder: 'एजेंसी का नाम दर्ज करें'
    }
  ];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate('/login');
      return;
    }

    if (!canAccessPage('users')) {
      alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
      navigate('/dashboard');
      return;
    }

    fetchAllData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Enhanced fetch with better error handling and logging
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting to fetch all schema data...');

      const promises = schemaConfigs.map(async (config) => {
        try {
          console.log(`📡 Fetching ${config.title} from ${BASE_SERVER_URL}${config.endpoint}`);
          
          const response = await fetch(`${BASE_SERVER_URL}${config.endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          console.log(`📊 ${config.title} response status:`, response.status);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${config.title}. Status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ ${config.title} data received:`, data);

          // Handle different response formats
          const actualData = data.success ? data.data : (data.data || data);
          
          return { 
            key: config.key, 
            data: Array.isArray(actualData) ? actualData : [] 
          };

        } catch (error) {
          console.error(`❌ Error fetching ${config.title}:`, error);
          return { key: config.key, data: [], error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const newSchemaData = {};
      const errors = [];
      
      results.forEach(result => {
        newSchemaData[result.key] = result.data;
        if (result.error) {
          errors.push(`${result.key}: ${result.error}`);
        }
      });

      console.log('📦 Final schema data:', newSchemaData);
      setSchemaData(newSchemaData);

      // Show errors if any
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join(', ')}`);
      }

    } catch (err) {
      console.error('💥 Fetch all data error:', err);
      setError(err.message);
      if (err.message.includes('401') || err.message.includes('403')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED: Validation function
  const validateData = (data, isEdit = false) => {
    const tempErrors = {};
    if (!data.trim()) {
      tempErrors.data = 'यह फ़ील्ड आवश्यक है।';
    }
    return tempErrors;
  };

  // Handle adding new data
  const handleAddData = async (schemaKey) => {
    const validationErrors = validateData(dialogData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const config = schemaConfigs.find(c => c.key === schemaKey);
    if (!config) return;

    try {
      setSubmitting(true);
      setErrors({});
      const body = { [config.field]: dialogData.trim() };

      console.log(`📤 Posting to ${config.endpoint}:`, body);

      const response = await fetch(`${BASE_SERVER_URL}${config.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add data');
      }

      const result = await response.json();
      console.log('✅ Add result:', result);
      
      // Update local state
      const newItem = result.data || result;
      setSchemaData(prev => ({
        ...prev,
        [schemaKey]: [...prev[schemaKey], newItem]
      }));

      // Close dialog and reset
      setActiveDialog(null);
      setDialogData('');
      setErrors({});
      alert('डेटा सफलतापूर्वक जोड़ा गया!');
      
    } catch (err) {
      console.error('❌ Add data error:', err);
      alert(`त्रुटि: ${err.message}`);
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ ADDED: Handle edit data (open edit dialog)
  const handleEditData = (schemaKey, item) => {
    const itemId = item._id || item.id;
    const config = schemaConfigs.find(c => c.key === schemaKey);
    
    setEditingId(itemId);
    setActiveEditDialog(schemaKey);
    setEditDialogData(item[config.field] || '');
    setEditErrors({});
  };

  // ✅ ADDED: Handle update data (submit edit form)
  const handleUpdateData = async (schemaKey) => {
    const validationErrors = validateData(editDialogData, true);
    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      return;
    }

    const config = schemaConfigs.find(c => c.key === schemaKey);
    if (!config || !editingId) return;

    try {
      setUpdating(true);
      setEditErrors({});
      const body = { [config.field]: editDialogData.trim() };

      console.log(`📤 Updating ${config.title} ${editingId}:`, body);

      const response = await fetch(`${BASE_SERVER_URL}${config.endpoint}/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update data');
      }

      const result = await response.json();
      console.log('✅ Update result:', result);
      
      // Update local state
      const updatedItem = result.data || result;
      setSchemaData(prev => ({
        ...prev,
        [schemaKey]: prev[schemaKey].map(item => 
          ((item._id || item.id) === editingId) ? updatedItem : item
        )
      }));

      // Close edit dialog and reset
      setActiveEditDialog(null);
      setEditingId(null);
      setEditDialogData('');
      setEditErrors({});
      alert('डेटा सफलतापूर्वक अपडेट किया गया!');
      
    } catch (err) {
      console.error('❌ Update data error:', err);
      alert(`अपडेट करने में त्रुटि: ${err.message}`);
      if (err.message.includes('401')) {
        logout();
        navigate('/login');
      }
    } finally {
      setUpdating(false);
    }
  };

  // ✅ UPDATED: Handle delete data (for ALL schema types)
  const handleDeleteData = async (schemaKey, itemId, itemName) => {
    const config = schemaConfigs.find(c => c.key === schemaKey);
    
    if (!config) {
      alert('Invalid configuration.');
      return;
    }

    // Confirmation dialog
    if (!window.confirm(`क्या आप वाकई "${itemName}" को हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।`)) {
      return;
    }

    try {
      setDeleting(itemId);
      console.log(`🗑️ Deleting ${config.title} with ID: ${itemId}`);

      const response = await fetch(`${BASE_SERVER_URL}${config.endpoint}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`📊 Delete ${config.title} response:`, response.status);

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        // ✅ ADDED: Handle specific delete error messages (referential integrity)
        const message = responseData.message || `Failed to delete ${config.title}. Status: ${response.status}`;
        
        if (response.status === 400 && responseData.details) {
          // Show detailed error message for referential integrity issues
          const details = responseData.details;
          const suggestions = details.suggestions ? details.suggestions.join('\n• ') : '';
          alert(`${message}\n\nसुझाव:\n• ${suggestions}`);
          return;
        }
        
        throw new Error(message);
      }

      // Update local state by removing the deleted item
      setSchemaData(prev => ({
        ...prev,
        [schemaKey]: prev[schemaKey].filter(item => 
          (item._id !== itemId) && (item.id !== itemId)
        )
      }));

      console.log(`✅ ${config.title} "${itemName}" deleted successfully`);
      alert(`"${itemName}" सफलतापूर्वक हटा दिया गया।`);

    } catch (err) {
      console.error(`❌ Delete ${config.title} error:`, err);
      alert(`हटाने में त्रुटि: ${err.message}`);
      
      if (err.message.includes('401') || err.message.includes('403')) {
        logout();
        navigate('/login');
      }
    } finally {
      setDeleting(null);
    }
  };

  // ✅ ADDED: Handle cancel edit
  const handleCancelEdit = () => {
    setActiveEditDialog(null);
    setEditingId(null);
    setEditDialogData('');
    setEditErrors({});
  };

  // Enhanced filter with null safety
  const getFilteredData = (data, schemaKey) => {
    const searchTerm = searchTerms[schemaKey] || '';
    if (!searchTerm) return data;

    const config = schemaConfigs.find(c => c.key === schemaKey);
    return data.filter(item => {
      const fieldValue = item[config.field];
      return fieldValue && 
             typeof fieldValue === 'string' && 
             fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Handle search change
  const handleSearchChange = (schemaKey, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [schemaKey]: value
    }));
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>डेटा लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="header">
        <TopBar onLogout={onLogout} />
      </div>
      
      <div className="admin-container">
        <div className="admin-header">
          <h1>एडमिन वर्क फॉर्म</h1>
        </div>

        {error && (
          <div className="error-banner">
            <p>त्रुटि: {error}</p>
            <button onClick={fetchAllData} className="retry-btn">पुनः प्रयास करें</button>
          </div>
        )}

        <div className="schemas-grid">
          {schemaConfigs.map((config) => {
            const data = schemaData[config.key] || [];
            const filteredData = getFilteredData(data, config.key);
            
            return (
              <div key={config.key} className="schema-card">
                <div className="schema-header">
                  <h3>{config.title}</h3>
                  <div className="schema-actions">
                    <span className="count-badge">{data.length}</span>
                    <button
                      onClick={() => setActiveDialog(config.key)}
                      className="add-btn"
                    >
                      <Plus size={16} />
                      जोड़ें
                    </button>
                  </div>
                </div>

                <div className="search-container">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder={`${config.title} खोजें...`}
                      value={searchTerms[config.key] || ''}
                      onChange={(e) => handleSearchChange(config.key, e.target.value)}
                    />
                  </div>
                </div>

                <div className="data-list">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => {
                      const itemId = item._id || item.id;
                      const itemName = item[config.field] || 'N/A';
                      
                      return (
                        <div key={itemId || index} className="data-item">
                          <div className="data-content">
                            <span className="data-text">{itemName}</span>
                          </div>
                          <div className="data-actions">
                            {/* ✅ ADDED: Edit button for all items */}
                            <button 
                              className="action-btn edit-btn" 
                              title="संपादित करें"
                              onClick={() => handleEditData(config.key, item)}
                              disabled={updating}
                            >
                              <Edit size={14} />
                            </button>
                            
                            {/* ✅ UPDATED: Delete button for all items */}
                            <button 
                              className="action-btn delete-btn" 
                              title="मिटाएं"
                              onClick={() => handleDeleteData(config.key, itemId, itemName)}
                              disabled={deleting === itemId}
                            >
                              {deleting === itemId ? (
                                <div className="delete-spinner"></div>
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-data">
                      <p>{searchTerms[config.key] ? 'कोई मैच नहीं मिला' : 'कोई डेटा उपलब्ध नहीं है'}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ ADD DATA DIALOG */}
      {activeDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>
                नया {schemaConfigs.find(c => c.key === activeDialog)?.title} जोड़ें
              </h3>
              <button
                onClick={() => {
                  setActiveDialog(null);
                  setDialogData('');
                  setErrors({});
                }}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="dialog-body">
              <div className="form-group">
                <label>
                  {schemaConfigs.find(c => c.key === activeDialog)?.title} का नाम:
                </label>
                <input
                  type="text"
                  value={dialogData}
                  onChange={(e) => {
                    setDialogData(e.target.value);
                    setErrors({});
                  }}
                  placeholder={schemaConfigs.find(c => c.key === activeDialog)?.placeholder}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && dialogData.trim()) {
                      handleAddData(activeDialog);
                    }
                  }}
                />
                {errors.data && (
                  <span className="error-msg">{errors.data}</span>
                )}
              </div>
            </div>
            
            <div className="dialog-footer">
              <button
                onClick={() => {
                  setActiveDialog(null);
                  setDialogData('');
                  setErrors({});
                }}
                className="cancel-btn"
                disabled={submitting}
              >
                रद्द करें
              </button>
              <button
                onClick={() => handleAddData(activeDialog)}
                className="submit-btn"
                disabled={submitting || !dialogData.trim()}
              >
                {submitting ? 'जोड़ा जा रहा है...' : 'जोड़ें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ADDED: EDIT DATA DIALOG */}
      {activeEditDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>
                {schemaConfigs.find(c => c.key === activeEditDialog)?.title} संपादित करें
              </h3>
              <button
                onClick={handleCancelEdit}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="dialog-body">
              <div className="form-group">
                <label>
                  {schemaConfigs.find(c => c.key === activeEditDialog)?.title} का नाम:
                </label>
                <input
                  type="text"
                  value={editDialogData}
                  onChange={(e) => {
                    setEditDialogData(e.target.value);
                    setEditErrors({});
                  }}
                  placeholder={schemaConfigs.find(c => c.key === activeEditDialog)?.placeholder}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && editDialogData.trim()) {
                      handleUpdateData(activeEditDialog);
                    }
                  }}
                />
                {editErrors.data && (
                  <span className="error-msg">{editErrors.data}</span>
                )}
              </div>
            </div>
            
            <div className="dialog-footer">
              <button
                onClick={handleCancelEdit}
                className="cancel-btn"
                disabled={updating}
              >
                रद्द करें
              </button>
              <button
                onClick={() => handleUpdateData(activeEditDialog)}
                className="submit-btn"
                disabled={updating || !editDialogData.trim()}
              >
                {updating ? 'अपडेट हो रहा है...' : 'अपडेट करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkForm;
