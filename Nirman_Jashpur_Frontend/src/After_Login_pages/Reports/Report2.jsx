import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report2 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [dashboardData, setDashboardData] = useState(null);
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

    fetchDashboardData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/dashboard`, {
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
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    if (!dashboardData) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const csvData = [
      ['डैशबोर्ड रिपोर्ट', ''],
      ['', ''],
      ['प्रस्ताव विवरण', ''],
      ['कुल प्रस्ताव', dashboardData.proposals.total],
      ['तकनीकी स्वीकृति प्रतीक्षित', dashboardData.proposals.pendingTechnical],
      ['प्रशासकीय स्वीकृति प्रतीक्षित', dashboardData.proposals.pendingAdministrative],
      ['प्रगति में', dashboardData.proposals.inProgress],
      ['पूर्ण', dashboardData.proposals.completed],
      ['', ''],
      ['वित्तीय विवरण', ''],
      ['कुल स्वीकृत राशि', dashboardData.financial.totalSanctionAmount],
      ['कुल अनुमोदित राशि', dashboardData.financial.totalApprovedAmount],
      ['कुल जारी राशि', dashboardData.financial.totalReleasedAmount]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `डैशबोर्ड_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
      <div className="dashboard-report-page">
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
          <h1>डैशबोर्ड रिपोर्ट</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || !dashboardData}
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
            <button onClick={fetchDashboardData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && dashboardData && (
          <div className="dashboard-content">
            {/* Proposal Statistics */}
            <div className="stats-section">
              <h2 className="section-title">प्रस्ताव सांख्यिकी</h2>
              <div className="stats-grid">
                <div className="stat-card total">
                  <div className="stat-icon">
                    <BarChart3 size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>कुल प्रस्ताव</h3>
                    <p className="stat-number">{formatNumber(dashboardData.proposals.total)}</p>
                  </div>
                </div>

                <div className="stat-card pending-technical">
                  <div className="stat-icon">
                    <Clock size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>तकनीकी स्वीकृति प्रतीक्षित</h3>
                    <p className="stat-number">{formatNumber(dashboardData.proposals.pendingTechnical)}</p>
                  </div>
                </div>

                <div className="stat-card pending-admin">
                  <div className="stat-icon">
                    <Clock size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>प्रशासकीय स्वीकृति प्रतीक्षित</h3>
                    <p className="stat-number">{formatNumber(dashboardData.proposals.pendingAdministrative)}</p>
                  </div>
                </div>

                <div className="stat-card in-progress">
                  <div className="stat-icon">
                    <TrendingUp size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>प्रगति में</h3>
                    <p className="stat-number">{formatNumber(dashboardData.proposals.inProgress)}</p>
                  </div>
                </div>

                <div className="stat-card completed">
                  <div className="stat-icon">
                    <CheckCircle size={32} />
                  </div>
                  <div className="stat-content">
                    <h3>पूर्ण</h3>
                    <p className="stat-number">{formatNumber(dashboardData.proposals.completed)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Statistics */}
            <div className="stats-section">
              <h2 className="section-title">वित्तीय सांख्यिकी</h2>
              <div className="financial-grid">
                <div className="financial-card sanction">
                  <div className="financial-content">
                    <h3>कुल स्वीकृत राशि</h3>
                    <p className="financial-amount">{formatCurrency(dashboardData.financial.totalSanctionAmount)}</p>
                  </div>
                </div>

                <div className="financial-card approved">
                  <div className="financial-content">
                    <h3>कुल अनुमोदित राशि</h3>
                    <p className="financial-amount">{formatCurrency(dashboardData.financial.totalApprovedAmount)}</p>
                  </div>
                </div>

                <div className="financial-card released">
                  <div className="financial-content">
                    <h3>कुल जारी राशि</h3>
                    <p className="financial-amount">{formatCurrency(dashboardData.financial.totalReleasedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="summary-section">
              <h2 className="section-title">सारांश तालिका</h2>
              <div className="table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>विवरण</th>
                      <th>संख्या / राशि</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>कुल प्रस्ताव</td>
                      <td className="number-cell">{formatNumber(dashboardData.proposals.total)}</td>
                    </tr>
                    <tr>
                      <td>तकनीकी स्वीकृति प्रतीक्षित</td>
                      <td className="number-cell">{formatNumber(dashboardData.proposals.pendingTechnical)}</td>
                    </tr>
                    <tr>
                      <td>प्रशासकीय स्वीकृति प्रतीक्षित</td>
                      <td className="number-cell">{formatNumber(dashboardData.proposals.pendingAdministrative)}</td>
                    </tr>
                    <tr>
                      <td>प्रगति में</td>
                      <td className="number-cell">{formatNumber(dashboardData.proposals.inProgress)}</td>
                    </tr>
                    <tr>
                      <td>पूर्ण</td>
                      <td className="number-cell">{formatNumber(dashboardData.proposals.completed)}</td>
                    </tr>
                    <tr className="financial-row">
                      <td>कुल स्वीकृत राशि</td>
                      <td className="amount-cell">{formatCurrency(dashboardData.financial.totalSanctionAmount)}</td>
                    </tr>
                    <tr className="financial-row">
                      <td>कुल अनुमोदित राशि</td>
                      <td className="amount-cell">{formatCurrency(dashboardData.financial.totalApprovedAmount)}</td>
                    </tr>
                    <tr className="financial-row">
                      <td>कुल जारी राशि</td>
                      <td className="amount-cell">{formatCurrency(dashboardData.financial.totalReleasedAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report2;
