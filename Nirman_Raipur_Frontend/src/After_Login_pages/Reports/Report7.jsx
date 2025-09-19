import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, Building, TrendingUp, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report7 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [agencyData, setAgencyData] = useState([]);
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

    fetchAgencyData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Filter data when search term changes
  useEffect(() => {
    const filtered = agencyData.filter(item =>
      item.agency.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [agencyData, searchTerm]);

  // API call to fetch agency data
  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/agency-wise`, {
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
        setAgencyData(result.data);
        setFilteredData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching agency data:', error);
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
      'एजेंसी',
      'कुल कार्य',
      'तकनीकी प्रतीक्षित',
      'प्रशासकीय प्रतीक्षित',
      'प्रगति में',
      'पूर्ण',
      'स्वीकृत राशि (लाख रुपये)',
      // 'अनुमोदित राशि',
      // 'जारी राशि',
      // 'औसत प्रगति (%)',
      // 'कुल योजनाएं',
      // 'कुल विभाग',
      // 'पूर्णता दर (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map((row, index) => [
        index + 1,
        `"${row.agencyName}"`,
        row.totalWorks,
        row.pendingTechnical,
        row.pendingAdministrative,
        row.inProgress,
        row.completed,
        row.totalSanctionAmount,
        row.totalApprovedAmount,
        row.totalReleasedAmount,
        row.avgProgressPercentage,
        row.totalSchemes,
        row.totalDepartments,
        row.completionRate
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `एजेंसीवार_विस्तृत_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
    
    totalWorks: acc.totalWorks + item.totalWorks,
    totalPendingTechnical: acc.totalPendingTechnical + item.pendingTechnical,
    totalPendingAdministrative: acc.totalPendingAdministrative + item.pendingAdministrative,
    totalInProgress: acc.totalInProgress + item.inProgress,
    totalCompleted: acc.totalCompleted + item.completed,
    totalSanctionAmount: acc.totalSanctionAmount + item.totalSanctionAmount,
    totalApprovedAmount: acc.totalApprovedAmount + item.totalApprovedAmount,
    totalReleasedAmount: acc.totalReleasedAmount + item.totalReleasedAmount,
    totalSchemes: acc.totalSchemes + item.totalSchemes,
    totalDepartments: acc.totalDepartments + item.totalDepartments
  }), {
    totalWorks: 0,
    totalPendingTechnical: 0,
    totalPendingAdministrative: 0,
    totalInProgress: 0,
    totalCompleted: 0,
    totalSanctionAmount: 0,
    totalApprovedAmount: 0,
    totalReleasedAmount: 0,
    totalSchemes: 0,
    totalDepartments: 0
  });

  // Calculate average completion rate
  const avgCompletionRate = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + item.completionRate, 0) / filteredData.length)
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
          <h1>एजेंसीवार विस्तृत रिपोर्ट</h1>
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
            <button onClick={fetchAgencyData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Information */}
        {!loading && !error && summary && (
          <div className="stats-section">
            <h2 className="section-title">रिपोर्ट सारांश ({summary.reportYear})</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Building size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल एजेंसियां</h3>
                  <p className="stat-number">{summary.totalAgencies}</p>
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

              {/* <div className="stat-card in-progress">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>औसत पूर्णता दर</h3>
                  <p className="stat-number">{formatPercentage(avgCompletionRate)}</p>
                </div>
              </div> */}

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <Clock size={32} />
                </div>
                <div className="stat-content">
                  <h3>रिपोर्ट जनरेटेड</h3>
                  <p className="stat-number" style={{ fontSize: '1rem' }}>
                    {new Date(summary.generatedAt).toLocaleDateString('hi-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल स्वीकृत राशि (लाख रुपये)</h3>
                  <p className="financial-amount">{formatCurrency(summary.totalSanctionAmount)}</p>
                </div>
              </div>
              {/* <div className="financial-card approved">
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
              </div> */}
            </div>
          </div>
        )}

        {/* Search Filter */}
        {!loading && !error && agencyData.length > 0 && (
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
                placeholder="एजेंसी नाम खोजें..."
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
              {filteredData.length} में से {agencyData.length} एजेंसी दिखाई गई
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
                  <th>एजेंसी</th>
                  <th>कुल कार्य</th>
                  <th>तकनीकी प्रतीक्षित</th>
                  <th>प्रशासकीय प्रतीक्षित</th>
                  <th>प्रगति में</th>
                  <th>पूर्ण</th>
                  <th>स्वीकृत राशि (लाख रुपये)</th>
                  {/* <th>अनुमोदित राशि</th>
                  <th>जारी राशि</th> */}
                  {/* <th>औसत प्रगति</th> */}
                  <th>कुल योजनाएं</th>
                  <th>कुल विभाग</th>
                  {/* <th>पूर्णता दर</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={row.agency}>
                      <td>{index + 1}</td>
                      <td style={{ textAlign: 'left', fontWeight: '600', maxWidth: '200px' }}>
                        {row.agencyName}
                      </td>
                      <td className="number-cell">{formatNumber(row.totalWorks)}</td>
                      <td className="number-cell" style={{ color: '#f59e0b' }}>
                        {formatNumber(row.pendingTechnical)}
                      </td>
                      <td className="number-cell" style={{ color: '#ef4444' }}>
                        {formatNumber(row.pendingAdministrative)}
                      </td>
                      <td className="number-cell" style={{ color: '#8b5cf6' }}>
                        {formatNumber(row.inProgress)}
                      </td>
                      <td className="number-cell" style={{ color: '#10b981' }}>
                        {formatNumber(row.completed)}
                      </td>
                      <td className="amount-cell">{formatCurrency(row.totalSanctionAmount)}</td>
                      {/* <td className="amount-cell">{formatCurrency(row.totalApprovedAmount)}</td>
                      <td className="amount-cell">{formatCurrency(row.totalReleasedAmount)}</td> */}
                      {/* <td className="number-cell">{formatPercentage(row.avgProgressPercentage)}</td> */}
                      <td className="number-cell">{formatNumber(row.totalSchemes)}</td>
                      <td className="number-cell">{formatNumber(row.totalDepartments)}</td>
                      {/* <td className="number-cell">
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: row.completionRate >= 70 ? '#dcfce7' : row.completionRate >= 50 ? '#fef3c7' : '#fee2e2',
                          color: row.completionRate >= 70 ? '#166534' : row.completionRate >= 50 ? '#92400e' : '#991b1b'
                        }}>
                          {formatPercentage(row.completionRate)}
                        </span>
                      </td> */}
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
                      {searchTerm ? 'खोज मानदंड के लिए कोई एजेंसी नहीं मिली।' : 'कोई डेटा उपलब्ध नहीं है।'}
                    </td>
                  </tr>
                )}
                
                {/* Total Row */}
                {filteredData.length > 0 && (
                  <tr className="financial-row" style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                    <td colSpan="2" style={{ textAlign: 'center', fontWeight: '700' }}>
                      कुल योग ({filteredData.length} एजेंसी)
                    </td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalWorks)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalPendingTechnical)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalPendingAdministrative)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalInProgress)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalCompleted)}</td>
                    <td className="amount-cell">{formatCurrency(aggregatedStats.totalSanctionAmount)}</td>
                    {/* <td className="amount-cell">{formatCurrency(aggregatedStats.totalApprovedAmount)}</td>
                    <td className="amount-cell">{formatCurrency(aggregatedStats.totalReleasedAmount)}</td> */}
                    {/* <td className="number-cell">-</td> */}
                    <td className="number-cell">{formatNumber(aggregatedStats.totalSchemes)}</td>
                    <td className="number-cell">{formatNumber(aggregatedStats.totalDepartments)}</td>
                    {/* <td className="number-cell">{formatPercentage(avgCompletionRate)}</td> */}
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

export default Report7;
