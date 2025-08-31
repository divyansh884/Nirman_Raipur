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
  const [searchTerms, setSearchTerms] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fixed: Added /api prefix to all endpoints
  const schemaConfigs = [
    {
      key: 'cities',
      title: 'शहर',
      endpoint: '/admin/city', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'शहर का नाम दर्ज करें'
    },
    {
      key: 'schemes',
      title: 'योजना',
      endpoint: '/admin/scheme', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'योजना का नाम दर्ज करें'
    },
    {
      key: 'sdos',
      title: 'SDO',
      endpoint: '/admin/sdo', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'SDO का नाम दर्ज करें'
    },
    {
      key: 'typeOfLocations',
      title: 'स्थान का प्रकार',
      endpoint: '/admin/type-of-location', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'स्थान प्रकार दर्ज करें'
    },
    {
      key: 'typeOfWorks',
      title: 'कार्य का प्रकार',
      endpoint: '/admin/type-of-work', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'कार्य प्रकार दर्ज करें'
    },
    {
      key: 'wards',
      title: 'वार्ड',
      endpoint: '/admin/ward', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'वार्ड का नाम दर्ज करें'
    },
    {
      key: 'workAgencies',
      title: 'कार्य एजेंसी',
      endpoint: '/admin/work-agency', // ✅ Added /api prefix
      field: 'name',
      placeholder: 'एजेंसी का नाम दर्ज करें'
    },
    // {
    //   key: 'workDepartments',
    //   title: 'कार्य विभाग',
    //   endpoint: '/admin/work-department', // ✅ Added /api prefix
    //   field: 'name',
    //   placeholder: 'विभाग का नाम दर्ज करें'
    // }
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

  // ✅ Enhanced fetch with better error handling and logging
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting to fetch all schema data...');

      const promises = schemaConfigs.map(async (config) => {
        try {
          console.log(`📡 Fetching ${config.title} from ${BASE_SERVER_URL}${config.endpoint}`);
          
          const response = await fetch(`${BASE_SERVER_URL}${config.endpoint}`, {
            method: 'GET', // ✅ Explicitly set method
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json' // ✅ Added Accept header
            }
          });

          console.log(`📊 ${config.title} response status:`, response.status);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${config.title}. Status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ ${config.title} data received:`, data);

          // ✅ Handle different response formats
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

  // Handle adding new data
  const handleAddData = async (schemaKey) => {
    if (!dialogData.trim()) {
      alert('कृपया डेटा दर्ज करें।');
      return;
    }

    const config = schemaConfigs.find(c => c.key === schemaKey);
    if (!config) return;

    try {
      setSubmitting(true);
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
      setSchemaData(prev => ({
        ...prev,
        [schemaKey]: [...prev[schemaKey], result.data || result]
      }));

      // Close dialog and reset
      setActiveDialog(null);
      setDialogData('');
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

  // ✅ Enhanced filter with null safety
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
                    filteredData.map((item, index) => (
                      <div key={item._id || index} className="data-item">
                        <div className="data-content">
                          <span className="data-text">{item[config.field] || 'N/A'}</span>
                        </div>
                        <div className="data-actions">
                          <button className="action-btn view-btn" title="देखें">
                            <Eye size={14} />
                          </button>
                          <button className="action-btn edit-btn" title="संपादित करें">
                            <Edit size={14} />
                          </button>
                          <button className="action-btn delete-btn" title="मिटाएं">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
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

      {/* Add Data Dialog */}
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
                  onChange={(e) => setDialogData(e.target.value)}
                  placeholder={schemaConfigs.find(c => c.key === activeDialog)?.placeholder}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="dialog-footer">
              <button
                onClick={() => {
                  setActiveDialog(null);
                  setDialogData('');
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
    </div>
  );
};

export default AdminWorkForm;
