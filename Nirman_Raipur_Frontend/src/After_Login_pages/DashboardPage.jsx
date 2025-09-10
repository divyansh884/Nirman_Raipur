import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  CheckSquare,
  ClipboardCheck,
  FileSignature,
  Briefcase,
  ClipboardList,
  Hammer,
  CheckCircle,
  XCircle,
  Lock,
  Clock,
  ImageOff,
  BarChart3, TrendingUp
} from "lucide-react"; // icons
import "./DashboardPage.css";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js';
import { BASE_SERVER_URL } from '../constants.jsx';
export default function DashboardPage({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation();
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
  // Breadcrumbs
  const crumbs = React.useMemo(() => {
    const parts = location.pathname
      .split("/")
      .filter(Boolean)
      .map((s) =>
        s.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
      );
    return [...parts].join(" / ");
  }, [location.pathname]);

  // ✅ Set page title
  useEffect(() => {
    document.title = "निर्माण | डैशबोर्ड";
  }, []);

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      navigate("/");
    }
  };

  const topStats = [
    { label: "दर्ज कार्य", route: "/work", icon: <FileText size={28} />, color: "stat-blue" },
    { label: "आरंभ", route: "/work", icon: <CheckSquare size={28} />, color: "stat-cyan" },
    { label: "तकनीकी स्वीकृति", route: "/technical-approval", icon: <ClipboardCheck size={28} />, color: "stat-green" },
    { label: "प्रशासकीय स्वीकृति", route: "/administrative-approval", icon: <FileSignature size={28} />, color: "stat-yellow" },
    { label: "निविदा स्तर पर", route: "/tender", icon: <Briefcase size={28} />, color: "stat-purple" },
    { label: "कार्य आदेश लंबित", route: "/work-order", icon: <ClipboardList size={28} />, color: "stat-pink" },
    { label: "कार्य आदेश जारी", route: "/work", icon: <ClipboardList size={28} />, color: "stat-indigo" },
    { label: "कार्य प्रगति पर", route: "/work-in-progress", icon: <Hammer size={28} />, color: "stat-orange" },
    { label: "कार्य पूर्ण", route: "/work", icon: <CheckCircle size={28} />, color: "stat-green-dark" },
    { label: "कार्य निरस्त", route: "/work", icon: <XCircle size={28} />, color: "stat-red" },
    { label: "कार्य बंद", route: "/work", icon: <Lock size={28} />, color: "stat-gray" },
    { label: "30 दिनों से लंबित कार्य", route: "/work", icon: <Clock size={28} />, color: "stat-brown" },
    { label: "फोटो रहित कार्य", route: "/work", icon: <ImageOff size={28} />, color: "stat-teal" },
  ];



  return (
    <div className="dashboard-page">
      {/* ✅ Top bar reused from example */}
      <div className="header">
        <TopBar />
        <div className="subbar">
          <span className="dot" />
          <h2>डैशबोर्ड</h2>
        </div>
      </div>

      {/* ✅ Dashboard content */}
      <div className="dashboard-stats-grid">
        {topStats.map((stat, idx) => (
          <div
            key={idx}
            className={`dashboard-stat-card ${stat.color}`}
            onClick={() => navigate(stat.route)}
          >
            <div className="dashboard-stat-info">
              <div className="dashboard-stat-label-large">{stat.label}</div>
            </div>
            <div className="dashboard-stat-icon">{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="page-container">
        {/* Page Header */}
        

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
}
