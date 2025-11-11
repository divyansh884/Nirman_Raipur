import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report6 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [progressData, setProgressData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate('/login');
      return;
    }

    // if (!canAccessPage('reports')) {
    //   alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
    //   navigate('/dashboard');
    //   return;
    // }

    fetchProgressData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Filter data when search term or status filter changes
  useEffect(() => {
    let filtered = progressData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nameOfWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.workDepartment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.currentStatus === statusFilter);
    }

    setFilteredData(filtered);
  }, [progressData, searchTerm, statusFilter]);

  // API call to fetch progress data
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Map API data to table structure
        const mappedData = Array.isArray(result.data) ? result.data.map((item, index) => ({
          id: item.serialNumber || `work-${index}`,
          serialNumber: item.serialNumber || '-',
          nameOfWork: item.nameOfWork || '-',
          workDepartment: item.workDepartment || '-',
          currentStatus: item.currentStatus || 'Unknown',
          statusType: getStatusType(item.currentStatus)
        })) : [];
        
        setProgressData(mappedData);
        setFilteredData(mappedData);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setError(error.message);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status type for styling and icons
  const getStatusType = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed') || statusLower.includes('पूर्ण')) return 'completed';
    if (statusLower.includes('progress') || statusLower.includes('प्रगति')) return 'in-progress';
    if (statusLower.includes('pending') || statusLower.includes('प्रतीक्षित')) return 'pending';
    if (statusLower.includes('approved') || statusLower.includes('स्वीकृत')) return 'approved';
    if (statusLower.includes('cancelled') || statusLower.includes('निरस्त')) return 'cancelled';
    return 'default';
  };

  // Get status icon
  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'completed': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'in-progress': return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'pending': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      case 'approved': return <CheckCircle size={16} style={{ color: '#3b82f6' }} />;
      case 'cancelled': return <AlertCircle size={16} style={{ color: '#6b7280' }} />;
      default: return <Eye size={16} style={{ color: '#6b7280' }} />;
    }
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(progressData.map(item => item.currentStatus))];

  // CSV export function
  const handleCSVExport = () => {
    if (filteredData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'कार्य संख्या',
      'कार्य का नाम',
      'विभाग',
      'वर्तमान स्थिति'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map((row, index) => [
        index + 1,
        `"${row.serialNumber}"`,
        `"${row.nameOfWork}"`,
        `"${row.workDepartment}"`,
        `"${row.currentStatus}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `कार्य_प्रगति_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Calculate status counts for summary
  const statusCounts = progressData.reduce((acc, item) => {
    acc[item.currentStatus] = (acc[item.currentStatus] || 0) + 1;
    return acc;
  }, {});

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="report-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="auth-error">
          <i className="fa-solid fa-lock"></i>
          <div>प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।</div>
          <button onClick={() => navigate('/login')} className="login-btn">
            लॉगिन पेज पर जाएं
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      {/* Header */}
      <div className="header">
        <TopBar onLogout={onLogout} />
      </div>

      {/* Page Content */}
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1>कार्य प्रगति रिपोर्ट</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || filteredData.length === 0}
            >
              <FileText size={16} />
              CSV Export
            </button>
            <button 
              onClick={handlePrint}
              className="export-btn print-btn"
              disabled={loading}
            >
              <Download size={16} />
              Print
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>डेटा लोड हो रहा है...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <i className="fa-solid fa-exclamation-triangle"></i>
            <p>डेटा लोड करने में त्रुटि: {error}</p>
            <button onClick={fetchProgressData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Status Summary Cards */}
        {!loading && !error && progressData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">स्थिति सारांश</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Eye size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल कार्य</h3>
                  <p className="stat-number">{progressData.length}</p>
                </div>
              </div>

              {Object.entries(statusCounts).slice(0, 4).map(([status, count], index) => (
                <div key={status} className={`stat-card ${getStatusType(status)}`}>
                  <div className="stat-icon">
                    {getStatusIcon(getStatusType(status))}
                  </div>
                  <div className="stat-content">
                    <h3>{status}</h3>
                    <p className="stat-number">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        {!loading && !error && progressData.length > 0 && (
          <div className="filter-section" style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '200px' }}>
              <Search size={20} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="कार्य संख्या, नाम या विभाग खोजें..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>स्थिति:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  minWidth: '150px'
                }}
              >
                <option value="All">सभी</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {filteredData.length} में से {progressData.length} कार्य दिखाए गए
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="table-container">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>क्र.</th>
                  {/* <th>कार्य संख्या</th> */}
                  <th>कार्य का नाम</th>
                  <th>विभाग</th>
                  <th>वर्तमान स्थिति</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      {/* <td style={{ fontWeight: '600', color: '#3b82f6' }}>
                        {row.serialNumber}
                      </td> */}
                      <td style={{ textAlign: 'left', fontWeight: '500' }}>
                        {row.nameOfWork}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {row.workDepartment.name}
                      </td>
                      <td>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.5rem' 
                        }}>
                          {getStatusIcon(row.statusType)}
                          <span style={{ fontWeight: '600' }}>{row.currentStatus}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      fontStyle: 'italic', 
                      padding: '2rem' 
                    }}>
                      {searchTerm || statusFilter !== 'All' 
                        ? 'खोज मानदंड के लिए कोई डेटा नहीं मिला।' 
                        : 'कोई डेटा उपलब्ध नहीं है।'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report6;
