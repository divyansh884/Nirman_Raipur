import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, Layers, TrendingUp, CheckCircle, Clock, BarChart3, Building } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report9 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [schemeData, setSchemeData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    fetchSchemeData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Filter data when search term changes with null safety
  useEffect(() => {
    const filtered = schemeData.filter(item => {
      // Safe null check for scheme field
      if (!item.scheme || typeof item.scheme !== 'string') {
        return false;
      }
      return item.scheme.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredData(filtered);
  }, [schemeData, searchTerm]);

  // API call to fetch scheme data
  const fetchSchemeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/scheme-wise`, {
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
        setSchemeData(result.data);
        setFilteredData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching scheme data:', error);
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
    }).format(amount);
  };

  // Format large numbers with Indian numbering system
  const formatNumber = (num) => {
    return new Intl.NumberFormat('hi-IN').format(num);
  };

  // Format percentage
  const formatPercentage = (percent) => {
    return `${percent.toFixed(1)}%`;
  };

  // CSV export function
  const handleCSVExport = () => {
    if (filteredData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'योजना',
      'कुल कार्य',
      'तकनीकी प्रतीक्षित',
      'प्रशासकीय प्रतीक्षित',
      'प्रगति में',
      'पूर्ण',
      'स्वीकृत राशि',
      'अनुमोदित राशि',
      'जारी राशि',
      'औसत प्रगति (%)',
      'कुल एजेंसियां',
      'कुल विभाग',
      'पूर्णता दर (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map((row, index) => [
        index + 1,
        `"${row.scheme || 'N/A'}"`,
        row.totalWorks || 0,
        row.pendingTechnical || 0,
        row.pendingAdministrative || 0,
        row.inProgress || 0,
        row.completed || 0,
        row.totalSanctionAmount || 0,
        row.totalApprovedAmount || 0,
        row.totalReleasedAmount || 0,
        row.avgProgressPercentage || 0,
        row.totalAgencies || 0,
        row.totalDepartments || 0,
        row.completionRate || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `योजनावार_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Calculate aggregated statistics
  const aggregatedStats = filteredData.reduce((acc, item) => ({
    totalWorks: acc.totalWorks + (item.totalWorks || 0),
    totalPendingTechnical: acc.totalPendingTechnical + (item.pendingTechnical || 0),
    totalPendingAdministrative: acc.totalPendingAdministrative + (item.pendingAdministrative || 0),
    totalInProgress: acc.totalInProgress + (item.inProgress || 0),
    totalCompleted: acc.totalCompleted + (item.completed || 0),
    totalSanctionAmount: acc.totalSanctionAmount + (item.totalSanctionAmount || 0),
    totalApprovedAmount: acc.totalApprovedAmount + (item.totalApprovedAmount || 0),
    totalReleasedAmount: acc.totalReleasedAmount + (item.totalReleasedAmount || 0),
    totalAgencies: acc.totalAgencies + (item.totalAgencies || 0),
    totalDepartments: acc.totalDepartments + (item.totalDepartments || 0)
  }), {
    totalWorks: 0,
    totalPendingTechnical: 0,
    totalPendingAdministrative: 0,
    totalInProgress: 0,
    totalCompleted: 0,
    totalSanctionAmount: 0,
    totalApprovedAmount: 0,
    totalReleasedAmount: 0,
    totalAgencies: 0,
    totalDepartments: 0
  });

  // Calculate average completion rate and progress percentage
  const avgCompletionRate = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + (item.completionRate || 0), 0) / filteredData.length)
    : 0;

  const avgProgressPercentage = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + (item.avgProgressPercentage || 0), 0) / filteredData.length)
    : 0;

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
          <h1>योजनावार रिपोर्ट</h1>
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
            <button onClick={fetchSchemeData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Information */}
        {!loading && !error && (
          <div className="stats-section">
            <h2 className="section-title">योजना सारांश {summary?.reportYear && `(${summary.reportYear})`}</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Layers size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल योजनाएं</h3>
                  <p className="stat-number">{schemeData.length}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल कार्य</h3>
                  <p className="stat-number">{formatNumber(aggregatedStats.totalWorks)}</p>
                </div>
              </div>

              <div className="stat-card in-progress">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>औसत प्रगति</h3>
                  <p className="stat-number">{formatPercentage(avgProgressPercentage)}</p>
                </div>
              </div>

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>औसत पूर्णता दर</h3>
                  <p className="stat-number">{formatPercentage(avgCompletionRate)}</p>
                </div>
              </div>
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल स्वीकृत राशि</h3>
                  <p className="financial-amount">{formatCurrency(aggregatedStats.totalSanctionAmount)}</p>
                </div>
              </div>
              <div className="financial-card approved">
                <div className="financial-content">
                  <h3>कुल अनुमोदित राशि</h3>
                  <p className="financial-amount">{formatCurrency(aggregatedStats.totalApprovedAmount)}</p>
                </div>
              </div>
              <div className="financial-card released">
                <div className="financial-content">
                  <h3>कुल जारी राशि</h3>
                  <p className="financial-amount">{formatCurrency(aggregatedStats.totalReleasedAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Filter */}
        {!loading && !error && schemeData.length > 0 && (
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
                placeholder="योजना नाम खोजें..."
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
              {filteredData.length} में से {schemeData.length} योजनाएं दिखाई गई
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
                  <th>योजना</th>
                  <th>कुल कार्य</th>
                  <th>तकनीकी प्रतीक्षित</th>
                  <th>प्रशासकीय प्रतीक्षित</th>
                  <th>प्रगति में</th>
                  <th>पूर्ण</th>
                  <th>स्वीकृत राशि</th>
                  <th>अनुमोदित राशि</th>
                  <th>जारी राशि</th>
                  <th>औसत प्रगति</th>
                  <th>कुल एजेंसियां</th>
                  <th>कुल विभाग</th>
                  <th>पूर्णता दर</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={row.scheme || index}>
                      <td>{index + 1}</td>
                      <td style={{ textAlign: 'left', fontWeight: '600', maxWidth: '250px' }}>
                        {row.scheme || 'N/A'}
                      </td>
                      <td className="number-cell">{formatNumber(row.totalWorks || 0)}</td>
                      <td className="number-cell" style={{ color: '#f59e0b' }}>
                        {formatNumber(row.pendingTechnical || 0)}
                      </td>
                      <td className="number-cell" style={{ color: '#ef4444' }}>
                        {formatNumber(row.pendingAdministrative || 0)}
                      </td>
                      <td className="number-cell" style={{ color: '#8b5cf6' }}>
                        {formatNumber(row.inProgress || 0)}
                      </td>
                      <td className="number-cell" style={{ color: '#10b981' }}>
                        {formatNumber(row.completed || 0)}
                      </td>
                      <td className="amount-cell">{formatCurrency(row.totalSanctionAmount || 0)}</td>
                      <td className="amount-cell">{formatCurrency(row.totalApprovedAmount || 0)}</td>
                      <td className="amount-cell">{formatCurrency(row.totalReleasedAmount || 0)}</td>
                      <td className="number-cell">{formatPercentage(row.avgProgressPercentage || 0)}</td>
                      <td className="number-cell">{formatNumber(row.totalAgencies || 0)}</td>
                      <td className="number-cell">{formatNumber(row.totalDepartments || 0)}</td>
                      <td className="number-cell">
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: (row.completionRate || 0) >= 70 ? '#dcfce7' : (row.completionRate || 0) >= 50 ? '#fef3c7' : '#fee2e2',
                          color: (row.completionRate || 0) >= 70 ? '#166534' : (row.completionRate || 0) >= 50 ? '#92400e' : '#991b1b',
                          fontWeight: '600'
                        }}>
                          {formatPercentage(row.completionRate || 0)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" style={{ 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      fontStyle: 'italic', 
                      padding: '2rem' 
                    }}>
                      {searchTerm ? 'खोज मानदंड के लिए कोई योजना नहीं मिली।' : 'कोई डेटा उपलब्ध नहीं है।'}
                    </td>
                  </tr>
                )}
                
                {/* Total Row */}
                {filteredData.length > 0 && (
                  <tr className="financial-row" style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                    <td colSpan="2" style={{ textAlign: 'center', fontWeight: '700' }}>
                      कुल योग ({filteredData.length} योजनाएं)
                    </td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalWorks)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalPendingTechnical)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalPendingAdministrative)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalInProgress)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalCompleted)}</td>
                    <td className="amount-cell">{formatCurrency(aggregatedStats.totalSanctionAmount)}</td>
                    <td className="amount-cell">{formatCurrency(aggregatedStats.totalApprovedAmount)}</td>
                    <td className="amount-cell">{formatCurrency(aggregatedStats.totalReleasedAmount)}</td>
                    <td className="number-cell">{formatPercentage(avgProgressPercentage)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalAgencies)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalDepartments)}</td>
                    <td className="number-cell">{formatPercentage(avgCompletionRate)}</td>
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

export default Report9;
