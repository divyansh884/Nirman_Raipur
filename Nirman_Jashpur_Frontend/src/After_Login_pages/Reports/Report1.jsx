import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, Camera, CameraOff, FileImage, AlertTriangle, BarChart3 } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report1 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage, verifyToken, isTokenExpired } = useAuthStore();
  
  const [photoMissingData, setPhotoMissingData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced authentication and permissions check
  useEffect(() => {
    const initializeReport = async () => {
      // Check basic authentication
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate('/login');
        return;
      }

      // Check if token is expired
      if (isTokenExpired()) {
        alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
        logout();
        navigate('/login');
        return;
      }

      // Verify token with server
      const isValid = await verifyToken();
      if (!isValid) {
        alert("अमान्य प्रमाणीकरण। कृपया पुनः लॉगिन करें।");
        logout();
        navigate('/login');
        return;
      }

      // Check page access permissions
      if (!canAccessPage('reports')) {
        alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
        navigate('/dashboard');
        return;
      }

      // All checks passed, fetch data
      fetchPhotoMissingData();
    };

    initializeReport();
  }, [isAuthenticated, token, navigate, canAccessPage, verifyToken, isTokenExpired, logout]);

  // Filter data when search term changes - with null safety
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(photoMissingData);
      return;
    }

    const filtered = photoMissingData.filter(item => {
      // Safe search across multiple fields with null checks
      const searchableFields = [
        item.serialNumber,
        item.nameOfWork,
        item.workAgency,
        item.scheme,
        item.city,
        item.ward,
        item.workDepartment,
        item.appointedEngineer
      ];

      const searchableText = searchableFields
        .filter(field => field && typeof field === 'string') // Filter out null/undefined values
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchTerm.toLowerCase());
    });

    setFilteredData(filtered);
  }, [photoMissingData, searchTerm]);

  // Enhanced API call to fetch photo missing data
  const fetchPhotoMissingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Double-check authentication before API call
      if (!token || !isAuthenticated) {
        throw new Error('No authentication token available');
      }

      console.log('Making API call with token:', token ? 'Token present' : 'No token');

      const response = await fetch(`${BASE_SERVER_URL}/reports/photo-missing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication failed, logging out...');
          logout();
          navigate('/login');
          return;
        }
        
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        setPhotoMissingData(result.data);
        setFilteredData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching photo missing data:', error);
      setError(error.message);
      
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency in Indian format
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('hi-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format large numbers with Indian numbering system
  const formatNumber = (num) => {
    return new Intl.NumberFormat('hi-IN').format(num || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('hi-IN');
    } catch {
      return '-';
    }
  };

  // Get progress indicator color
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 50) return '#f59e0b'; // Yellow
    if (percentage >= 20) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

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
      'कार्य एजेंसी',
      'योजना',
      'वर्तमान स्थिति',
      'स्वीकृत राशि',
      'शहर',
      'वार्ड',
      'कार्य विभाग',
      'नियुक्त अभियंता',
      'प्रस्तुति दिनांक',
      'प्रगति (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map((row, index) => [
        index + 1,
        `"${row.serialNumber || ''}"`,
        `"${row.nameOfWork || ''}"`,
        `"${row.workAgency || ''}"`,
        `"${row.scheme || ''}"`,
        `"${row.currentStatus || ''}"`,
        row.sanctionAmount || 0,
        `"${row.city || ''}"`,
        `"${row.ward || ''}"`,
        `"${row.workDepartment || ''}"`,
        `"${row.appointedEngineer || ''}"`,
        formatDate(row.submissionDate),
        row.progressPercentage || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `फ़ोटो_अनुपलब्ध_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Retry function for failed API calls
  const handleRetry = () => {
    fetchPhotoMissingData();
  };

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
          <h1>फ़ोटो अनुपलब्ध रिपोर्ट</h1>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={handleRetry} className="retry-btn">
                पुनः प्रयास करें
              </button>
              <button onClick={() => navigate('/login')} className="login-btn">
                लॉगिन पेज पर जाएं
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && summary && (
          <div className="stats-section">
            <h2 className="section-title">
              फ़ोटो अनुपस्थिति सारांश ({summary.reportYear})
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '1rem' }}>
                जनरेटेड: {new Date(summary.generatedAt).toLocaleDateString('hi-IN')}
              </span>
            </h2>
            
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <CameraOff size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल बिना फ़ोटो कार्य</h3>
                  <p className="stat-number">{formatNumber(summary.totalWorksWithoutPhotos)}</p>
                </div>
              </div>

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <FileImage size={32} />
                </div>
                <div className="stat-content">
                  <h3>बिना प्रारंभिक फ़ोटो</h3>
                  <p className="stat-number">{formatNumber(summary.totalWorksWithoutBeforePhotos)}</p>
                </div>
              </div>

              <div className="stat-card in-progress">
                <div className="stat-icon">
                  <Camera size={32} />
                </div>
                <div className="stat-content">
                  <h3>बिना प्रगति फ़ोटो</h3>
                  <p className="stat-number">{formatNumber(summary.totalWorksWithoutProgressPhotos)}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="stat-content">
                  <h3>फ़ोटो अनुपस्थिति प्रतिशत</h3>
                  <p className="stat-number">{summary.percentageWithoutPhotos}%</p>
                </div>
              </div>
            </div>

            {/* Breakdown Information */}
            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>स्थितिवार विवरण</h3>
                  {summary.statusBreakdown && Array.isArray(summary.statusBreakdown) ? (
                    <ul style={{ margin: '0.5rem 0', padding: '0', listStyle: 'none' }}>
                      {summary.statusBreakdown.map((status, index) => (
                        <li key={index} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>{status.status}:</strong> {formatNumber(status.count)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>डेटा उपलब्ध नहीं</p>
                  )}
                </div>
              </div>
              
              <div className="financial-card approved">
                <div className="financial-content">
                  <h3>एजेंसीवार विवरण</h3>
                  {summary.agencyBreakdown && Array.isArray(summary.agencyBreakdown) ? (
                    <ul style={{ margin: '0.5rem 0', padding: '0', listStyle: 'none' }}>
                      {summary.agencyBreakdown.slice(0, 5).map((agency, index) => (
                        <li key={index} style={{ padding: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>{agency.agency}:</strong> {formatNumber(agency.count)}
                        </li>
                      ))}
                      {summary.agencyBreakdown.length > 5 && (
                        <li style={{ padding: '0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>
                          और {summary.agencyBreakdown.length - 5} एजेंसियां...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>डेटा उपलब्ध नहीं</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Filter */}
        {!loading && !error && photoMissingData.length > 0 && (
          <div className="filter-section" style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1' }}>
              <Search size={20} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="कार्य संख्या, नाम, एजेंसी, शहर खोजें..."
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
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {filteredData.length} में से {photoMissingData.length} कार्य दिखाए गए
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
                  <th>कार्य संख्या</th>
                  <th>कार्य का नाम</th>
                  <th>कार्य एजेंसी</th>
                  <th>योजना</th>
                  <th>वर्तमान स्थिति</th>
                  <th>स्वीकृत राशि</th>
                  <th>शहर</th>
                  <th>वार्ड</th>
                  <th>कार्य विभाग</th>
                  <th>नियुक्त अभियंता</th>
                  <th>प्रस्तुति दिनांक</th>
                  <th>प्रगति</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={row.serialNumber || index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: '600', color: '#3b82f6' }}>
                        {row.serialNumber || '-'}
                      </td>
                      <td style={{ textAlign: 'left', fontWeight: '500', maxWidth: '200px' }}>
                        {row.nameOfWork || '-'}
                      </td>
                      <td style={{ fontWeight: '500' }}>
                        {row.workAgency || '-'}
                      </td>
                      <td>{row.scheme || '-'}</td>
                      <td>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.5rem' 
                        }}>
                          <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                          <span style={{ fontWeight: '500' }}>{row.currentStatus || '-'}</span>
                        </div>
                      </td>
                      <td className="amount-cell">{formatCurrency(row.sanctionAmount)}</td>
                      <td>{row.city || '-'}</td>
                      <td>{row.ward || '-'}</td>
                      <td>{row.workDepartment || '-'}</td>
                      <td>{row.appointedEngineer || '-'}</td>
                      <td>{formatDate(row.submissionDate)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(row.progressPercentage || 0, 100)}%`,
                              height: '100%',
                              backgroundColor: getProgressColor(row.progressPercentage || 0),
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: '600',
                            color: getProgressColor(row.progressPercentage || 0)
                          }}>
                            {row.progressPercentage || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" style={{ 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      fontStyle: 'italic', 
                      padding: '2rem' 
                    }}>
                      {searchTerm 
                        ? 'खोज मानदंड के लिए कोई कार्य नहीं मिला।' 
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

export default Report1;
