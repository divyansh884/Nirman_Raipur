import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, User, TrendingUp, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, BarChart3, Users } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report12 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [engineerData, setEngineerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEngineer, setExpandedEngineer] = useState(null);
  const [sortBy, setSortBy] = useState('completionRate');
  const [sortOrder, setSortOrder] = useState('desc');

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

    fetchEngineerData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Filter and sort data when search term or sort criteria changes
  useEffect(() => {
    let filtered = engineerData.filter(item => {
      if (!searchTerm) return true;
      return item.engineer?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || 0;
      let bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredData(filtered);
  }, [engineerData, searchTerm, sortBy, sortOrder]);

  // API call to fetch engineer data
  const fetchEngineerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/engineer-wise`, {
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
        setEngineerData(result.data);
        setFilteredData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching engineer data:', error);
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

  // Get performance rating based on completion rate
  const getPerformanceRating = (completionRate) => {
    if (completionRate >= 80) return { label: 'उत्कृष्ट', color: '#10b981', bg: '#dcfce7' };
    if (completionRate >= 60) return { label: 'अच्छा', color: '#3b82f6', bg: '#dbeafe' };
    if (completionRate >= 40) return { label: 'औसत', color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'सुधार आवश्यक', color: '#ef4444', bg: '#fee2e2' };
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('completed')) return <CheckCircle size={16} style={{ color: '#10b981' }} />;
    if (statusLower.includes('progress')) return <Clock size={16} style={{ color: '#f59e0b' }} />;
    if (statusLower.includes('pending')) return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
    return <BarChart3 size={16} style={{ color: '#6b7280' }} />;
  };

  // Toggle expand/collapse for engineer details
  const toggleEngineerExpansion = (engineer) => {
    setExpandedEngineer(expandedEngineer === engineer ? null : engineer);
  };

  // CSV export function
  const handleCSVExport = () => {
    if (filteredData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'अभियंता',
      'कुल कार्य',
      'तकनीकी प्रतीक्षित',
      'प्रशासकीय प्रतीक्षित',
      'प्रगति में',
      'पूर्ण',
      'स्वीकृत राशि',
      'अनुमोदित राशि',
      'जारी राशि',
      'कुल विभाग',
      'कुल क्षेत्र',
      'कुल योजनाएं',
      'कुल एजेंसियां',
      'पूर्णता दर (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        `"${row.engineer || ''}"`,
        row.totalAssignedWorks || 0,
        row.pendingTechnical || 0,
        row.pendingAdministrative || 0,
        row.inProgress || 0,
        row.completed || 0,
        row.totalSanctionAmount || 0,
        row.totalApprovedAmount || 0,
        row.totalReleasedAmount || 0,
        row.totalDepartments || 0,
        row.totalAreas || 0,
        row.totalSchemes || 0,
        row.totalAgencies || 0,
        row.completionRate || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `अभियंतावार_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
          <h1>अभियंतावार रिपोर्ट</h1>
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
            <button onClick={fetchEngineerData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Information */}
        {!loading && !error && summary && (
          <div className="stats-section">
            <h2 className="section-title">
              अभियंता सारांश ({summary.reportYear})
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '1rem' }}>
                जनरेटेड: {new Date(summary.generatedAt).toLocaleDateString('hi-IN')}
              </span>
            </h2>
            
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Users size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल अभियंता</h3>
                  <p className="stat-number">{formatNumber(summary.totalEngineers)}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल कार्य</h3>
                  <p className="stat-number">{formatNumber(summary.totalWorks)}</p>
                </div>
              </div>

              <div className="stat-card in-progress">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>औसत कार्य प्रति अभियंता</h3>
                  <p className="stat-number">{summary.avgWorksPerEngineer.toFixed(1)}</p>
                </div>
              </div>

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>औसत पूर्णता दर</h3>
                  <p className="stat-number">{formatPercentage(summary.avgCompletionRate)}</p>
                </div>
              </div>
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल स्वीकृत राशि</h3>
                  <p className="financial-amount">{formatCurrency(summary.totalSanctionAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Sort Controls */}
        {!loading && !error && engineerData.length > 0 && (
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
                placeholder="अभियंता नाम खोजें..."
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
              <label style={{ fontWeight: '600', color: '#374151' }}>क्रम:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="completionRate">पूर्णता दर</option>
                <option value="totalAssignedWorks">कुल कार्य</option>
                <option value="completed">पूर्ण कार्य</option>
                <option value="totalSanctionAmount">स्वीकृत राशि</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="desc">उच्च से निम्न</option>
                <option value="asc">निम्न से उच्च</option>
              </select>
            </div>

            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {filteredData.length} में से {engineerData.length} अभियंता दिखाए गए
            </div>
          </div>
        )}

        {/* Engineer Cards */}
        {!loading && !error && filteredData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">अभियंता प्रदर्शन</h2>
            
            <div className="table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>क्र.</th>
                    <th>अभियंता</th>
                    <th>कुल कार्य</th>
                    <th>पूर्ण</th>
                    <th>प्रगति में</th>
                    <th>प्रतीक्षित</th>
                    <th>स्वीकृत राशि</th>
                    <th>पूर्णता दर</th>
                    <th>प्रदर्शन</th>
                    <th>कार्य विवरण</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((engineer, index) => {
                    const performance = getPerformanceRating(engineer.completionRate || 0);
                    const totalPending = (engineer.pendingTechnical || 0) + (engineer.pendingAdministrative || 0);
                    
                    return (
                      <React.Fragment key={engineer.engineer || index}>
                        <tr style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                          <td>{index + 1}</td>
                          <td style={{ 
                            textAlign: 'left', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <User size={16} style={{ color: '#3b82f6' }} />
                            {engineer.engineer || 'N/A'}
                          </td>
                          <td className="number-cell">{formatNumber(engineer.totalAssignedWorks)}</td>
                          <td className="number-cell" style={{ color: '#10b981', fontWeight: '600' }}>
                            {formatNumber(engineer.completed)}
                          </td>
                          <td className="number-cell" style={{ color: '#f59e0b', fontWeight: '600' }}>
                            {formatNumber(engineer.inProgress)}
                          </td>
                          <td className="number-cell" style={{ color: '#ef4444', fontWeight: '600' }}>
                            {formatNumber(totalPending)}
                          </td>
                          <td className="amount-cell">{formatCurrency(engineer.totalSanctionAmount)}</td>
                          <td className="number-cell">
                            <span style={{ 
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor: performance.bg,
                              color: performance.color,
                              fontWeight: '600',
                              fontSize: '0.85rem'
                            }}>
                              {formatPercentage(engineer.completionRate || 0)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '15px',
                              backgroundColor: performance.bg,
                              color: performance.color,
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {performance.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => toggleEngineerExpansion(engineer.engineer)}
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
                              {expandedEngineer === engineer.engineer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              {engineer.workTypes?.length || 0} कार्य
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Work Details */}
                        {expandedEngineer === engineer.engineer && engineer.workTypes && (
                          <tr>
                            <td colSpan="10" style={{ padding: 0, backgroundColor: '#f1f5f9' }}>
                              <div style={{ padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                                  {engineer.engineer} - कार्य विवरण
                                </h4>
                                
                                {/* Engineer Statistics */}
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                  gap: '1rem', 
                                  marginBottom: '1rem',
                                  padding: '1rem',
                                  backgroundColor: 'white',
                                  borderRadius: '8px'
                                }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>कुल विभाग</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{engineer.totalDepartments || 0}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>कुल क्षेत्र</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{engineer.totalAreas || 0}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>कुल योजनाएं</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{engineer.totalSchemes || 0}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>कुल एजेंसियां</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{engineer.totalAgencies || 0}</div>
                                  </div>
                                </div>

                                {/* Work Types Table */}
                                <div className="table-container">
                                  <table className="summary-table" style={{ margin: 0 }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#e2e8f0' }}>
                                        <th>क्र.</th>
                                        <th>कार्य का नाम</th>
                                        <th>वर्तमान स्थिति</th>
                                        <th>स्वीकृत राशि</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {engineer.workTypes.length > 0 ? (
                                        engineer.workTypes.map((work, workIndex) => (
                                          <tr key={workIndex}>
                                            <td>{workIndex + 1}</td>
                                            <td style={{ textAlign: 'left', maxWidth: '300px' }}>
                                              {work.nameOfWork || '-'}
                                            </td>
                                            <td>
                                              <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                gap: '0.5rem' 
                                              }}>
                                                {getStatusIcon(work.currentStatus)}
                                                <span style={{ fontWeight: '500' }}>{work.currentStatus || '-'}</span>
                                              </div>
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
                                            कोई कार्य उपलब्ध नहीं है।
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredData.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            fontStyle: 'italic', 
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            {searchTerm ? 'खोज मानदंड के लिए कोई अभियंता नहीं मिला।' : 'कोई डेटा उपलब्ध नहीं है।'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Report12;
