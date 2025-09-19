import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, BarChart3, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report11 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [finalStatusData, setFinalStatusData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStatus, setExpandedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

    fetchFinalStatusData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch final status data
  const fetchFinalStatusData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/final-status`, {
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
        setFinalStatusData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching final status data:', error);
      setError(error.message);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
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

  // Format percentage
  const formatPercentage = (percent) => {
    return `${percent.toFixed(1)}%`;
  };

  // Get status type for styling
  const getStatusType = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('completed') || categoryLower === 'completed') return 'completed';
    if (categoryLower.includes('progress') || categoryLower === 'in progress') return 'in-progress';
    if (categoryLower.includes('pending') || categoryLower === 'pending') return 'pending-technical';
    return 'total';
  };

  // Get status icon
  const getStatusIcon = (category, size = 32) => {
    const statusType = getStatusType(category);
    switch (statusType) {
      case 'completed': return <CheckCircle size={size} />;
      case 'in-progress': return <Clock size={size} />;
      case 'pending-technical': return <AlertCircle size={size} />;
      default: return <BarChart3 size={size} />;
    }
  };

  // Toggle expand/collapse for status details
  const toggleStatusExpansion = (status) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  // Filter works based on search term
  const getFilteredWorks = (works) => {
    if (!searchTerm) return works;
    return works.filter(work =>
      work.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.nameOfWork?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // CSV export function
  const handleCSVExport = () => {
    if (finalStatusData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'स्थिति',
      'संख्या',
      'कुल राशि (लाख रुपये)',
      'प्रतिशत',
      'श्रेणी'
    ];

    const csvContent = [
      headers.join(','),
      ...finalStatusData.map(row => [
        `"${row.status || ''}"`,
        row.count || 0,
        row.totalAmount || 0,
        row.percentage || 0,
        `"${row.category || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `अंतिम_स्थिति_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
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
          <h1>अंतिम स्थिति रिपोर्ट</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || finalStatusData.length === 0}
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
            <button onClick={fetchFinalStatusData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Information */}
        {!loading && !error && summary && (
          <div className="stats-section">
            <h2 className="section-title">
              समग्र सारांश ({summary.reportYear})
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '1rem' }}>
                जनरेटेड: {new Date(summary.generatedAt).toLocaleDateString('hi-IN')}
              </span>
            </h2>
            
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल कार्य</h3>
                  <p className="stat-number">{formatNumber(summary.totalWorks)}</p>
                </div>
              </div>

              {summary.categoryBreakdown && Object.entries(summary.categoryBreakdown).map(([category, data]) => (
                <div key={category} className={`stat-card ${getStatusType(category)}`}>
                  <div className="stat-icon">
                    {getStatusIcon(category)}
                  </div>
                  <div className="stat-content">
                    <h3>{category}</h3>
                    <p className="stat-number">{formatNumber(data.count)}</p>
                    <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      {formatPercentage(data.percentage)}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल राशि (लाख रुपये)</h3>
                  <p className="financial-amount">{formatCurrency(summary.totalAmount)}</p>
                </div>
              </div>
              {summary.categoryBreakdown && Object.entries(summary.categoryBreakdown).slice(0, 2).map(([category, data]) => (
                <div key={category} className="financial-card approved">
                  <div className="financial-content">
                    <h3>{category} राशि (लाख रुपये)</h3>
                    <p className="financial-amount">{formatCurrency(data.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        {!loading && !error && finalStatusData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">स्थितिवार विवरण</h2>
            
            {/* Search for works */}
            {expandedStatus && (
              <div className="filter-section" style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Search size={16} style={{ color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="कार्य संख्या या नाम खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: '1',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            <div className="table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>स्थिति</th>
                    <th>संख्या</th>
                    <th>कुल राशि (लाख रुपये)</th>
                    <th>प्रतिशत</th>
                    <th>श्रेणी</th>
                    <th>विवरण</th>
                  </tr>
                </thead>
                <tbody>
                  {finalStatusData.map((statusItem, index) => (
                    <React.Fragment key={statusItem.status || index}>
                      <tr style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ 
                          textAlign: 'left', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {getStatusIcon(statusItem.category, 16)}
                          {statusItem.status}
                        </td>
                        <td className="number-cell">{formatNumber(statusItem.count)}</td>
                        <td className="amount-cell">{formatCurrency(statusItem.totalAmount)}</td>
                        <td className="number-cell">
                          <span style={{ 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            backgroundColor: statusItem.percentage >= 50 ? '#dcfce7' : '#fef3c7',
                            color: statusItem.percentage >= 50 ? '#166534' : '#92400e',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}>
                            {formatPercentage(statusItem.percentage)}
                          </span>
                        </td>
                        <td style={{ fontWeight: '500' }}>{statusItem.category}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => toggleStatusExpansion(statusItem.status)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {expandedStatus === statusItem.status ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {statusItem.works?.length || 0} कार्य
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Works Details */}
                      {expandedStatus === statusItem.status && statusItem.works && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0, backgroundColor: '#f1f5f9' }}>
                            <div style={{ padding: '1rem' }}>
                              <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                                {statusItem.status} - कार्य सूची
                              </h4>
                              <div className="table-container">
                                <table className="summary-table" style={{ margin: 0 }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e2e8f0' }}>
                                      <th>क्र.</th>
                                      <th>कार्य संख्या</th>
                                      <th>कार्य का नाम</th>
                                      <th>स्वीकृत राशि (लाख रुपये)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {getFilteredWorks(statusItem.works).length > 0 ? (
                                      getFilteredWorks(statusItem.works).map((work, workIndex) => (
                                        <tr key={work.serialNumber || workIndex}>
                                          <td>{workIndex + 1}</td>
                                          <td style={{ fontWeight: '600', color: '#3b82f6' }}>
                                            {work.serialNumber || '-'}
                                          </td>
                                          <td style={{ textAlign: 'left', maxWidth: '300px' }}>
                                            {work.nameOfWork || '-'}
                                          </td>
                                          <td className="amount-cell">
                                            {formatCurrency(work.sanctionAmount)}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" style={{ 
                                          textAlign: 'center', 
                                          color: '#6b7280', 
                                          fontStyle: 'italic',
                                          padding: '1rem'
                                        }}>
                                          {searchTerm ? 'खोज मानदंड के लिए कोई कार्य नहीं मिला।' : 'कोई कार्य उपलब्ध नहीं है।'}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report11;
