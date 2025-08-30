import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import useAuthStore from '../../Store/useAuthStore.js';
import TopBar from '../../Components/TopBar.jsx';
import './Report.css';
import { BASE_SERVER_URL } from '../../constants.jsx';

const Report1 = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  const [agencyData, setAgencyData] = useState([]);
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

    fetchAgencyData();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // API call to fetch agency data
  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Changed to agency-wise API endpoint instead of dashboard
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
        // Map API data to table structure based on your schema
        const mappedData = Array.isArray(result.data) ? result.data.map((item, index) => ({
          serialNo: index + 1,
          agencyName: item.agencyName || item.department || item.workAgency || item.userDepartment || '-',
          totalWorks: item.totalWorks || item.totalCount || item.workCount || 0,
          draft: item.draftWorks || item.pendingWorks || item.pending || 0,
          atTenderLevel: item.tenderWorks || item.atTender || item.tenderStage || 0,
          workOrderReceived: item.workOrderReceived || item.orderReceived || item.technicalApproved || 0,
          workOrderIssued: item.workOrderIssued || item.orderIssued || item.administrativeApproved || 0,
          workInProgress: item.workInProgress || item.inProgress || item.progressStage || 0,
          workComplete: item.completedWorks || item.completed || item.completedStage || 0,
          workCancelled: item.cancelledWorks || item.cancelled || item.cancelledStage || 0,
          workClosed: item.closedWorks || item.closed || item.closedStage || 0
        })) : [];
        
        setAgencyData(mappedData);
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

  // Simple CSV export function
  const handleCSVExport = () => {
    if (agencyData.length === 0) {
      alert('कोई डेटा उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'क्र.',
      'एजेंसी का नाम',
      'कुल कार्य',
      'अपार्टम',
      'निविदा स्तर पर',
      'कार्य आदेश संवित',
      'कार्य आदेश जारी',
      'कार्य प्रगति पर',
      'कार्य पूर्ण',
      'कार्य निरस्त',
      'कार्य बंद'
    ];

    const csvContent = [
      headers.join(','),
      ...agencyData.map(row => [
        row.serialNo,
        `"${row.agencyName}"`,
        row.totalWorks,
        row.draft,
        row.atTenderLevel,
        row.workOrderReceived,
        row.workOrderIssued,
        row.workInProgress,
        row.workComplete,
        row.workCancelled,
        row.workClosed
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `एजेंसीवार_सूची_${new Date().toLocaleDateString('hi-IN')}.csv`);
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
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>एजेंसीवार सूची</h1>
          <div className="action-buttons">
            <button 
              onClick={handleCSVExport}
              className="export-btn csv-btn"
              disabled={loading || agencyData.length === 0}
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
            <div className="pinner"></div>
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

        {/* Data Table */}
        {!loading && !error && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>क्र.</th>
                  <th>एजेंसी का नाम</th>
                  <th>कुल कार्य</th>
                  <th>अपार्टम</th>
                  <th>निविदा स्तर पर</th>
                  <th>कार्य आदेश संवित</th>
                  <th>कार्य आदेश जारी</th>
                  <th>कार्य प्रगति पर</th>
                  <th>कार्य पूर्ण</th>
                  <th>कार्य निरस्त</th>
                  <th>कार्य बंद</th>
                </tr>
              </thead>
              <tbody>
                {agencyData.length > 0 ? (
                  agencyData.map((row) => (
                    <tr key={row.serialNo}>
                      <td>{row.serialNo}</td>
                      <td className="text-cell">{row.agencyName}</td>
                      <td className="number-cell">{row.totalWorks}</td>
                      <td className="number-cell">{row.draft}</td>
                      <td className="number-cell">{row.atTenderLevel}</td>
                      <td className="number-cell">{row.workOrderReceived}</td>
                      <td className="number-cell">{row.workOrderIssued}</td>
                      <td className="number-cell">{row.workInProgress}</td>
                      <td className="number-cell">{row.workComplete}</td>
                      <td className="number-cell">{row.workCancelled}</td>
                      <td className="number-cell">{row.workClosed}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="-no-data">
                      कोई डेटा उपलब्ध नहीं है।
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
