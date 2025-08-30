import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Search, AlertCircle, Building, ClipboardList, UserCheck, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report10 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [pendingData, setPendingData] = useState([]);
  const [summary, setSummary] = useState(null);
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

    if (!canAccessPage('reports')) {
      alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
      navigate('/dashboard');
      return;
    }

    fetchPendingData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Filter data when search term or status filter changes
  useEffect(() => {
    let filtered = pendingData.filter(item => {
      // Safe search across multiple fields
      const searchableText = [
        item.serialNumber,
        item.nameOfWork,
        item.workAgency,
        item.scheme,
        item.city,
        item.ward,
        item.workDepartment,
        item.appointedEngineer
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = !searchTerm || searchableText.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
    setFilteredData(filtered);
  }, [pendingData, searchTerm, statusFilter]);

  // API call to fetch pending data
  const fetchPendingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/reports/pending`, {
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
        setPendingData(result.data);
        setFilteredData(result.data);
        if (result.summary) {
          setSummary(result.summary);
        }
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching pending data:', error);
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

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('hi-IN');
    } catch {
      return '-';
    }
  };

  // Get status type for styling
  const getStatusType = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('technical')) return 'pending-technical';
    if (statusLower.includes('administrative')) return 'pending-admin';
    if (statusLower.includes('tender')) return 'in-progress';
    if (statusLower.includes('work order')) return 'completed';
    return 'total';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusType = getStatusType(status);
    switch (statusType) {
      case 'pending-technical': return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
      case 'pending-admin': return <Clock size={16} style={{ color: '#ef4444' }} />;
      case 'in-progress': return <ClipboardList size={16} style={{ color: '#8b5cf6' }} />;
      case 'completed': return <UserCheck size={16} style={{ color: '#10b981' }} />;
      default: return <AlertCircle size={16} style={{ color: '#6b7280' }} />;
    }
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(pendingData.map(item => item.currentStatus))].filter(Boolean);

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
      'प्रस्तुति दिनांक',
      'स्वीकृत राशि',
      'शहर',
      'वार्ड',
      'कार्य विभाग',
      'नियुक्त अभियंता'
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
        formatDate(row.submissionDate),
        row.sanctionAmount || 0,
        `"${row.city || ''}"`,
        `"${row.ward || ''}"`,
        `"${row.workDepartment || ''}"`,
        `"${row.appointedEngineer || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `लंबित_कार्य_रिपोर्ट_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
          <h1>लंबित कार्य रिपोर्ट</h1>
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
            <button onClick={fetchPendingData} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && summary && (
          <div className="stats-section">
            <h2 className="section-title">लंबित कार्य सारांश ({summary.reportYear})</h2>
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <ClipboardList size={32} />
                </div>
                <div className="stat-content">
                  <h3>कुल लंबित कार्य</h3>
                  <p className="stat-number">{formatNumber(summary.totalPendingWorks)}</p>
                </div>
              </div>

              <div className="stat-card pending-technical">
                <div className="stat-icon">
                  <AlertCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>तकनीकी प्रतीक्षित</h3>
                  <p className="stat-number">{formatNumber(summary.pendingTechnical)}</p>
                </div>
              </div>

              <div className="stat-card pending-admin">
                <div className="stat-icon">
                  <Clock size={32} />
                </div>
                <div className="stat-content">
                  <h3>प्रशासकीय प्रतीक्षित</h3>
                  <p className="stat-number">{formatNumber(summary.pendingAdministrative)}</p>
                </div>
              </div>

              <div className="stat-card in-progress">
                <div className="stat-icon">
                  <Building size={32} />
                </div>
                <div className="stat-content">
                  <h3>निविदा प्रतीक्षित</h3>
                  <p className="stat-number">{formatNumber(summary.pendingTender)}</p>
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-icon">
                  <UserCheck size={32} />
                </div>
                <div className="stat-content">
                  <h3>कार्य आदेश प्रतीक्षित</h3>
                  <p className="stat-number">{formatNumber(summary.pendingWorkOrder)}</p>
                </div>
              </div>
            </div>

            <div className="financial-grid">
              <div className="financial-card sanction">
                <div className="financial-content">
                  <h3>कुल लंबित राशि</h3>
                  <p className="financial-amount">{formatCurrency(summary.totalPendingAmount)}</p>
                </div>
              </div>
              <div className="financial-card approved">
                <div className="financial-content">
                  <h3>कुल एजेंसियां</h3>
                  <p className="financial-amount">{formatNumber(summary.uniqueAgencies)}</p>
                </div>
              </div>
              <div className="financial-card released">
                <div className="financial-content">
                  <h3>कुल योजनाएं</h3>
                  <p className="financial-amount">{formatNumber(summary.uniqueSchemes)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        {!loading && !error && pendingData.length > 0 && (
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
                placeholder="कार्य संख्या, नाम, एजेंसी, योजना खोजें..."
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
              {filteredData.length} में से {pendingData.length} कार्य दिखाए गए
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
                  <th>प्रस्तुति दिनांक</th>
                  <th>स्वीकृत राशि</th>
                  <th>शहर</th>
                  <th>वार्ड</th>
                  <th>कार्य विभाग</th>
                  <th>नियुक्त अभियंता</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={row.serialNumber || index}>
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
                          {getStatusIcon(row.currentStatus)}
                          <span style={{ fontWeight: '600' }}>{row.currentStatus || '-'}</span>
                        </div>
                      </td>
                      <td>{formatDate(row.submissionDate)}</td>
                      <td className="amount-cell">{formatCurrency(row.sanctionAmount)}</td>
                      <td>{row.city || '-'}</td>
                      <td>{row.ward || '-'}</td>
                      <td>{row.workDepartment || '-'}</td>
                      <td>{row.appointedEngineer || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" style={{ 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      fontStyle: 'italic', 
                      padding: '2rem' 
                    }}>
                      {searchTerm || statusFilter !== 'All' 
                        ? 'खोज मानदंड के लिए कोई लंबित कार्य नहीं मिला।' 
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

export default Report10;
