import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, BarChart3, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report4 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    fetchStatusData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch status data
  const fetchStatusData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/status-wise`, {
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
          serialNo: index + 1,
          statusName: item._id || item.status || '-',
          count: item.count || 0,
          totalAmount: item.totalAmount || 0,
          // Add status type for styling
          statusType: getStatusType(item._id)
        })) : [];
        
        setStatusData(mappedData);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching status data:', error);
      setError(error.message);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status type for styling
  const getStatusType = (statusName) => {
    const status = statusName?.toLowerCase() || '';
    if (status.includes('completed') || status.includes('पूर्ण')) return 'completed';
    if (status.includes('progress') || status.includes('प्रगति')) return 'in-progress';
    if (status.includes('pending') || status.includes('प्रतीक्षित')) return 'pending-technical';
    if (status.includes('approved') || status.includes('स्वीकृत')) return 'completed';
    if (status.includes('rejected') || status.includes('निरस्त')) return 'pending-admin';
    return 'total';
  };

  // Get icon for status
  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'completed': return <CheckCircle size={32} />;
      case 'in-progress': return <Clock size={32} />;
      case 'pending-technical': return <AlertCircle size={32} />;
      case 'pending-admin': return <AlertCircle size={32} />;
      default: return <BarChart3 size={32} />;
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

  // CSV export function
  const handleCSVExport = () => {
    if (statusData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'स्थिति का नाम',
      'संख्या',
      'कुल राशि (लाख रुपये)'
    ];

    const csvContent = [
      headers.join(','),
      ...statusData.map(row => [
        row.serialNo,
        `"${row.statusName}"`,
        row.count,
        row.totalAmount
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `स्थितिवार_सूची_${new Date().toLocaleDateString('hi-IN')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Calculate totals for summary
  const totals = statusData.reduce((acc, status) => ({
    totalCount: acc.totalCount + status.count,
    totalAmount: acc.totalAmount + status.totalAmount
  }), {
    totalCount: 0,
    totalAmount: 0
  });

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
          <h1>स्थितिवार सूची</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || statusData.length === 0}
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
            <button onClick={fetchStatusData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Status Cards */}
        {!loading && !error && statusData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">स्थिति अनुसार सारांश</h2>
            <div className="stats-grid">
              {statusData.slice(0, 4).map((status) => (
                <div key={status.serialNo} className={`stat-card ${status.statusType}`}>
                  <div className="stat-icon">
                    {getStatusIcon(status.statusType)}
                  </div>
                  <div className="stat-content">
                    <h3>{status.statusName}</h3>
                    <p className="stat-number">{formatNumber(status.count)}</p>
                    <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      {formatCurrency(status.totalAmount)}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Summary */}
            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल कार्य</h3>
                  <p className="financial-amount">{formatNumber(totals.totalCount)}</p>
                </div>
              </div>
              <div className="financial-card approved">
                <div className="financial-content">
                  <h3>कुल राशि (लाख रुपये)</h3>
                  <p className="financial-amount">{formatCurrency(totals.totalAmount)}</p>
                </div>
              </div>
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
                  <th>स्थिति का नाम</th>
                  <th>संख्या</th>
                  <th>कुल राशि (लाख रुपये)</th>
                  <th>प्रतिशत</th>
                </tr>
              </thead>
              <tbody>
                {statusData.length > 0 ? (
                  statusData.map((row) => {
                    const percentage = totals.totalCount > 0 ? ((row.count / totals.totalCount) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.serialNo}>
                        <td>{row.serialNo}</td>
                        <td style={{ textAlign: 'left', fontWeight: '600' }}>
                          {row.statusName}
                        </td>
                        <td className="number-cell">{formatNumber(row.count)}</td>
                        <td className="amount-cell">{formatCurrency(row.totalAmount)}</td>
                        <td className="number-cell">{percentage}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', padding: '2rem' }}>
                      कोई डेटा उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
                
                {/* Total Row */}
                {statusData.length > 0 && (
                  <tr className="financial-row" style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                    <td colSpan="2" style={{ textAlign: 'center', fontWeight: '700' }}>
                      कुल योग
                    </td>
                    <td className="number-cell">{formatNumber(totals.totalCount)}</td>
                    <td className="amount-cell">{formatCurrency(totals.totalAmount)}</td>
                    <td className="number-cell">100%</td>
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

export default Report4;
