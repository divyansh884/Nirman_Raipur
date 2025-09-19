import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, TrendingUp, DollarSign, CheckCircle, BarChart3 } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report5 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [financialData, setFinancialData] = useState([]);
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

    fetchFinancialData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch financial data
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/financial`, {
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
          financialYear: item._id || `वित्तीय वर्ष ${index + 1}`,
          totalProposals: item.totalProposals || 0,
          totalSanctionAmount: item.totalSanctionAmount || 0,
          totalApprovedAmount: item.totalApprovedAmount || 0,
          totalReleasedAmount: item.totalReleasedAmount || 0,
          completedWorks: item.completedWorks || 0,
          // Calculate percentages
          approvalRate: item.totalSanctionAmount ? ((item.totalApprovedAmount / item.totalSanctionAmount) * 100).toFixed(1) : 0,
          releaseRate: item.totalApprovedAmount ? ((item.totalReleasedAmount / item.totalApprovedAmount) * 100).toFixed(1) : 0,
          completionRate: item.totalProposals ? ((item.completedWorks / item.totalProposals) * 100).toFixed(1) : 0
        })) : [];
        
        setFinancialData(mappedData);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
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
    if (financialData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'वित्तीय वर्ष',
      'कुल प्रस्ताव',
      'स्वीकृत राशि (लाख रुपये)',
      // 'अनुमोदित राशि',
      // 'जारी राशि',
      // 'पूर्ण कार्य',
      // 'अनुमोदन दर (%)',
      // 'जारी दर (%)',
      // 'पूर्णता दर (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...financialData.map(row => [
        row.serialNo,
        `"${row.financialYear}"`,
        row.totalProposals,
        row.totalSanctionAmount,
        row.totalApprovedAmount,
        row.totalReleasedAmount,
        row.completedWorks,
        row.approvalRate,
        row.releaseRate,
        row.completionRate
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `वित्तीय_वार्षिक_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
  const totals = financialData.reduce((acc, item) => ({
    totalProposals: acc.totalProposals + item.totalProposals,
    totalSanctionAmount: acc.totalSanctionAmount + item.totalSanctionAmount,
    totalApprovedAmount: acc.totalApprovedAmount + item.totalApprovedAmount,
    totalReleasedAmount: acc.totalReleasedAmount + item.totalReleasedAmount,
    totalCompletedWorks: acc.totalCompletedWorks + item.completedWorks
  }), {
    totalProposals: 0,
    totalSanctionAmount: 0,
    totalApprovedAmount: 0,
    totalReleasedAmount: 0,
    totalCompletedWorks: 0
  });

  // Calculate overall rates
  const overallApprovalRate = totals.totalSanctionAmount ? ((totals.totalApprovedAmount / totals.totalSanctionAmount) * 100).toFixed(1) : 0;
  const overallReleaseRate = totals.totalApprovedAmount ? ((totals.totalReleasedAmount / totals.totalApprovedAmount) * 100).toFixed(1) : 0;
  const overallCompletionRate = totals.totalProposals ? ((totals.totalCompletedWorks / totals.totalProposals) * 100).toFixed(1) : 0;

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
          <h1>वित्तीय वार्षिक रिपोर्ट</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || financialData.length === 0}
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
            <button onClick={fetchFinancialData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && financialData.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">वित्तीय सारांश</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <BarChart3 size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल प्रस्ताव</h3>
                  <p className="stat-number">{formatNumber(totals.totalProposals)}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>पूर्ण कार्य</h3>
                  <p className="stat-number">{formatNumber(totals.totalCompletedWorks)}</p>
                </div>
              </div>

              {/* <div className="stat-card in-progress">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>पूर्णता दर</h3>
                  <p className="stat-number">{overallCompletionRate}%</p>
                </div>
              </div> */}

              {/* <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stat-content">
                  <h3>जारी दर</h3>
                  <p className="stat-number">{overallReleaseRate}%</p>
                </div>
              </div> */}
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल स्वीकृत राशि (लाख रुपये)</h3>
                  <p className="financial-amount">{formatCurrency(totals.totalSanctionAmount)}</p>
                </div>
              </div>

              {/* <div className="financial-card approved">
                <div className="financial-content">
                  <h3>कुल अनुमोदित राशि</h3>
                  <p className="financial-amount">{formatCurrency(totals.totalApprovedAmount)}</p>
                </div>
              </div>

              <div className="financial-card released">
                <div className="financial-content">
                  <h3>कुल जारी राशि</h3>
                  <p className="financial-amount">{formatCurrency(totals.totalReleasedAmount)}</p>
                </div>
              </div> */}
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
                  <th>वित्तीय वर्ष</th>
                  <th>कुल प्रस्ताव</th>
                  <th>स्वीकृत राशि (लाख रुपये)</th>
                  {/* <th>अनुमोदित राशि</th>
                  <th>जारी राशि</th>
                  <th>पूर्ण कार्य</th>
                  <th>अनुमोदन दर</th>
                  <th>जारी दर</th>
                  <th>पूर्णता दर</th> */}
                </tr>
              </thead>
              <tbody>
                {financialData.length > 0 ? (
                  financialData.map((row) => (
                    <tr key={row.serialNo}>
                      <td>{row.serialNo}</td>
                      <td style={{ textAlign: 'left', fontWeight: '600' }}>
                        {row.financialYear}
                      </td>
                      <td className="number-cell">{formatNumber(row.totalProposals)}</td>
                      <td className="amount-cell">{formatCurrency(row.totalSanctionAmount)}</td>
                      {/* <td className="amount-cell">{formatCurrency(row.totalApprovedAmount)}</td> */}
                      {/* <td className="amount-cell">{formatCurrency(row.totalReleasedAmount)}</td>
                      <td className="number-cell">{formatNumber(row.completedWorks)}</td>
                      <td className="number-cell">{row.approvalRate}%</td>
                      <td className="number-cell">{row.releaseRate}%</td>
                      <td className="number-cell">{row.completionRate}%</td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', padding: '2rem' }}>
                      कोई डेटा उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
                
                {/* Total Row */}
                {financialData.length > 0 && (
                  <tr className="financial-row" style={{ fontWeight: '700', backgroundColor: '#f0f9ff' }}>
                    <td colSpan="2" style={{ textAlign: 'center', fontWeight: '700' }}>
                      कुल योग
                    </td>
                    <td className="number-cell">{formatNumber(totals.totalProposals)}</td>
                    <td className="amount-cell">{formatCurrency(totals.totalSanctionAmount)}</td>
                    {/* <td className="amount-cell">{formatCurrency(totals.totalApprovedAmount)}</td> */}
                    {/* <td className="amount-cell">{formatCurrency(totals.totalReleasedAmount)}</td>
                    <td className="number-cell">{formatNumber(totals.totalCompletedWorks)}</td>
                    <td className="number-cell">{overallApprovalRate}%</td>
                    <td className="number-cell">{overallReleaseRate}%</td>
                    <td className="number-cell">{overallCompletionRate}%</td> */}
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

export default Report5;
