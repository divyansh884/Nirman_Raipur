import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report3 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication and permissions
  useEffect(() => {
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate('/login');
      return;
    }

    if (!canAccessPage('reports')) {
      alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
      navigate('/dashboard');
      return;
    }

    fetchDepartmentData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch department data
  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/department-wise`, {
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
          departmentName: item._id || item.departmentName || '-',
          totalProposals: item.totalProposals || 0,
          totalSanctionAmount: item.totalSanctionAmount || 0,
          completed: item.completed || 0,
          inProgress: item.inProgress || 0,
          pending: item.pending || 0
        })) : [];
        
        setDepartmentData(mappedData);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching department data:', error);
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

  // CSV export function
  const handleCSVExport = () => {
    if (departmentData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'विभाग का नाम',
      'कुल प्रस्ताव',
      'कुल स्वीकृत राशि',
      'पूर्ण',
      'प्रगति में',
      'प्रतीक्षित'
    ];

    const csvContent = [
      headers.join(','),
      ...departmentData.map(row => [
        row.serialNo,
        `"${row.departmentName}"`,
        row.totalProposals,
        row.totalSanctionAmount,
        row.completed,
        row.inProgress,
        row.pending
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `विभागवार_सूची_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
  const totals = departmentData.reduce((acc, dept) => ({
    totalProposals: acc.totalProposals + dept.totalProposals,
    totalAmount: acc.totalAmount + dept.totalSanctionAmount,
    totalCompleted: acc.totalCompleted + dept.completed,
    totalInProgress: acc.totalInProgress + dept.inProgress,
    totalPending: acc.totalPending + dept.pending
  }), {
    totalProposals: 0,
    totalAmount: 0,
    totalCompleted: 0,
    totalInProgress: 0,
    totalPending: 0
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
          <h1>विभागवार सूची</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || departmentData.length === 0}
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
            <button onClick={fetchDepartmentData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && departmentData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">विभागीय सारांश</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <FileText size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल प्रस्ताव</h3>
                  <p className="stat-number">{formatNumber(totals.totalProposals)}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <Download size={32} />
                </div>
                <div className="stat-content">
                  <h3>पूर्ण</h3>
                  <p className="stat-number">{formatNumber(totals.totalCompleted)}</p>
                </div>
              </div>

              <div className="stat-card in-progress">
                <div className="stat-icon">
                  <FileText size={32} />
                </div>
                <div className="stat-content">
                  <h3>प्रगति में</h3>
                  <p className="stat-number">{formatNumber(totals.totalInProgress)}</p>
                </div>
              </div>

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <Download size={32} />
                </div>
                <div className="stat-content">
                  <h3>प्रतीक्षित</h3>
                  <p className="stat-number">{formatNumber(totals.totalPending)}</p>
                </div>
              </div>
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल स्वीकृत राशि</h3>
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
                  <th>विभाग का नाम</th>
                  <th>कुल प्रस्ताव</th>
                  <th>कुल स्वीकृत राशि</th>
                  <th>पूर्ण</th>
                  <th>प्रगति में</th>
                  <th>प्रतीक्षित</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.length > 0 ? (
                  departmentData.map((row) => (
                    <tr key={row.serialNo}>
                      <td>{row.serialNo}</td>
                      <td style={{ textAlign: 'left', fontWeight: '600' }}>
                        {row.departmentName}
                      </td>
                      <td className="number-cell">{formatNumber(row.totalProposals)}</td>
                      <td className="amount-cell">{formatCurrency(row.totalSanctionAmount)}</td>
                      <td className="number-cell">{formatNumber(row.completed)}</td>
                      <td className="number-cell">{formatNumber(row.inProgress)}</td>
                      <td className="number-cell">{formatNumber(row.pending)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', padding: '2rem' }}>
                      कोई डेटा उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
                
                {/* Total Row */}
                {departmentData.length > 0 && (
                  <tr className="financial-row" style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                    <td colSpan="2" style={{ textAlign: 'center', fontWeight: '700' }}>
                      कुल योग
                    </td>
                    <td className="number-cell">{formatNumber(totals.totalProposals)}</td>
                    <td className="amount-cell">{formatCurrency(totals.totalAmount)}</td>
                    <td className="number-cell">{formatNumber(totals.totalCompleted)}</td>
                    <td className="number-cell">{formatNumber(totals.totalInProgress)}</td>
                    <td className="number-cell">{formatNumber(totals.totalPending)}</td>
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

export default Report3;
