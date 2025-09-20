import React, { useState, useEffect } from "react";
import {
  Home,
  LogIn,
  Download,
  Map,
  FileText,
  ClipboardList,
  BarChart,
  Users,
  Building2,
  Settings,
} from "lucide-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import useAuthStore from "./Store/useAuthStore.js";
// Your existing imports remain the same
import LoginPage from "./Before_Login_pages/Login.jsx";
import HomePage from "./Before_Login_pages/HomePage.jsx";
import DownloadPage from "./Before_Login_pages/DownloadPage.jsx";
import DashboardPage from "./After_Login_pages/DashboardPage.jsx";
import WorkPage from "./After_Login_pages/WorkPage.jsx";
import WorkForm from "./Forms/WorkForm.jsx";
import TechnicalApprovalPage from "./After_Login_pages/TechnicalApprovalPage.jsx";
import AdministrativeApprovalPage from "./After_Login_pages/AdministrativeApprovalPage.jsx";
import TenderPage from "./After_Login_pages/TenderPage.jsx";
import WorkOrderPage from "./After_Login_pages/WorkOrderPage.jsx";
import WorkProgressPage from "./After_Login_pages/WorkProgressPage.jsx";
import WorkDetailsPage from "./After_Login_pages/WorkDetails.jsx";
import AdministrativeApprovalForm from "./Forms/AdministrativeApprovalForm.jsx";
import TechnicalApprovalForm from "./Forms/TechnicalApprovalForm.jsx";
import TenderForm from "./Forms/TenderForm.jsx";
import WorkOrderForm from "./Forms/WorkOrderForm.jsx";
import WorkInProgressForm from "./Forms/WorkInProgressForm.jsx";
import Profile from "./After_Login_pages/Profile.jsx";
import MyMap from "./After_Login_pages/GIS/Map.jsx";
// import Report1 from "./After_Login_pages/Reports/Report1.jsx";
import Report2 from "./After_Login_pages/Reports/Report2.jsx";
import Report3 from "./After_Login_pages/Reports/Report3.jsx";
import Report4 from "./After_Login_pages/Reports/Report4.jsx";
import Report5 from "./After_Login_pages/Reports/Report5.jsx";
import Report6 from "./After_Login_pages/Reports/Report6.jsx";
import Report7 from "./After_Login_pages/Reports/Report7.jsx";
import Report8 from "./After_Login_pages/Reports/Report8.jsx";
import Report9 from "./After_Login_pages/Reports/Report9.jsx";
import Report10 from "./After_Login_pages/Reports/Report10.jsx";
import Report11 from "./After_Login_pages/Reports/Report11.jsx";
import Report12 from "./After_Login_pages/Reports/Report12.jsx";
import AdminDepartmentForms from "./Forms/AdminDepartmentForms.jsx";
import AdminUserForm from "./Forms/AdminUserForm.jsx";
import AdminWorkForm from "./Forms/AdminWorkForm.jsx";
import EditTender from "./Forms/EditTender.jsx";
import EditWorkOrder from "./Forms/EditWorkOder.jsx";
import EditTechnical from "./Forms/EditTechnical.jsx";
import EditAdministrative from "./Forms/EditAdministrative.jsx";
import EditWork from "./Forms/EditWork.jsx";

const App = () => {
 // ✅ Fixed version
// ✅ CORRECT: All hooks at the top level, before any returns
const { 
  isAuthenticated, 
  user, 
  verifyToken, 
  isAdmin, 
  initializeAuth,
  isAuthLoading  
} = useAuthStore();

// ✅ CORRECT: All useEffect calls before conditional return
useEffect(() => {
  initializeAuth();
}, [initializeAuth]);

useEffect(() => {
  const checkAuth = async () => {
    if (isAuthenticated) {
      await verifyToken();
    }
  };
  checkAuth();
}, [isAuthenticated, verifyToken]);

// ✅ CORRECT: Conditional return AFTER all hooks
if (isAuthLoading) {
  return (
    <div className="loading-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p>प्रमाणीकरण जांच रहे हैं...</p>
    </div>
  );
}

// Rest of your component...


// ✅ Verify token when authentication state changes



  return (
    <Router>
      <div className="app-container">
        {/* ✅ FIXED: Show TopNavbar ONLY when NOT authenticated */}
        {!isAuthenticated && <TopNavbar />}
        
        {/* ✅ FIXED: Show SideNavbar ONLY when authenticated */}
        {isAuthenticated && <SideNavbar />}
        
        {/* ✅ FIXED: Apply logged-in-main class only when authenticated */}
        <main className={isAuthenticated ? "logged-in-main" : ""}>
          <Routes>
            {/* Public routes - Always available */}
            <Route path="/" element={<HomePage />} />
            <Route path="/download" element={<DownloadPage />} />
            
            {/* Login route - Redirect to dashboard if already logged in */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLoginSuccess={() => console.log('Login successful!')} />
                )
              }
            />
            
            {/* ✅ FIXED: Protected routes - Only render when authenticated */}
            {isAuthenticated ? (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/work" element={<WorkPage />} />
                <Route path="/Technical-Approval" element={<TechnicalApprovalPage />} />
                <Route path="/Administrative-Approval" element={<AdministrativeApprovalPage />} />
                <Route path="/Tender" element={<TenderPage />} />
                <Route path="/Work-Order" element={<WorkOrderPage />} />
                <Route path="/Work-In-Progress" element={<WorkProgressPage />} />
                
                {/* Form Routes */}
                <Route path="/add-work" element={<WorkForm />} />
                <Route path="/work/:workId" element={<WorkDetailsPage />} />
                <Route path="/Administrative-Approval-Form/:workId" element={<AdministrativeApprovalForm />} />
                <Route path="/Technical-Approval-Form/:workId" element={<TechnicalApprovalForm />} />
                <Route path="/Tender-Form/:workId" element={<TenderForm />} />
                <Route path="/Work-Order-Form/:workId" element={<WorkOrderForm />} />
                <Route path="/Work-In-Progress-Form/:workId" element={<WorkInProgressForm />} />
                
                {/* Profile and GIS */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/gis/map" element={<MyMap />} />
                
                {/* Report Routes */}
                {/* <Route path="/Report/Report1" element={<Report1 />} /> */}
                <Route path="/Report/Report2" element={<Report2 />} />
                <Route path="/Report/Report3" element={<Report3 />} />
                <Route path="/Report/Report4" element={<Report4 />} />
                <Route path="/Report/Report5" element={<Report5 />} />
                <Route path="/Report/Report6" element={<Report6 />} />
                <Route path="/Report/Report7" element={<Report7 />} />
                <Route path="/Report/Report8" element={<Report8 />} />
                <Route path="/Report/Report9" element={<Report9 />} />
                <Route path="/Report/Report10" element={<Report10 />} />
                <Route path="/Report/Report11" element={<Report11 />} />
                <Route path="/Report/Report12" element={<Report12 />} />
                <Route path="/Edit-Tender/:workId" element={<EditTender />} />
                <Route path="/Edit-Work-Order/:workId" element={<EditWorkOrder />} />
                <Route path="/Edit-Technical/:workId" element={<EditTechnical />} />
                <Route path="/Edit-Administrative/:workId" element={<EditAdministrative />} />
                <Route path="/Edit-Work/:workId" element={<EditWork />} />
                
                {/* ✅ FIXED: Admin-only routes with proper conditional rendering */}
                {isAdmin() && (
                  <>
                    <Route path="/Admin/AdminDepartmentForms" element={<AdminDepartmentForms />} />
                    <Route path="/Admin/AdminUserForms" element={<AdminUserForm />} />
                    <Route path="/Admin/AdminWorkForms" element={<AdminWorkForm />} />
                  </>
                )}
                
                {/* ✅ Redirect any unmatched routes to dashboard for authenticated users */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              /* ✅ FIXED: Redirect unauthenticated users trying to access protected routes */
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const TopNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const NavLink = ({ to, label, icon }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => navigate(to)}
        className={`nav-link ${isActive ? "active" : ""}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };
  
  return (
    <header className="app-header">
      <div className="container">
        <div className="logo-group">
          <div className="logo-text">
            <span className="logo-cg">CG</span>
            <span className="logo-name">निर्माण रायपुर</span>
          </div>
          <span className="jashpur-text">Raipur</span>
        </div>
        <nav className="nav-desktop">
          <NavLink to="/" label="मुखपृष्ठ" icon={<Home />} />
          <NavLink to="/login" label="विभागीय लॉगिन" icon={<LogIn />} />
          {/* <NavLink to="/download" label="ऐप डाउनलोड करे" icon={<Download />} /> */}
        </nav>
      </div>
    </header>
  );
};

const SideNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuthStore();
  const [openMenu, setOpenMenu] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/'); // ✅ FIXED: Redirect to home after logout
  };

  const items = [
    { to: "/dashboard", label: "डैशबोर्ड", icon: <Home /> },
    { to: "/work", label: "कार्य", icon: <ClipboardList /> },
    { to: "/gis/map", label: "GIS मैपिंग", icon: <Map /> },
    { to: "/Technical-Approval", label: "तकनीकी स्वीकृति", icon: <FileText /> },
    { to: "/Administrative-Approval", label: "प्रशासकीय स्वीकृति", icon: <FileText /> },
    { to: "/Tender", label: "निविदा", icon: <FileText /> },
    { to: "/Work-Order", label: "कार्य आदेश", icon: <ClipboardList /> },
    { to: "/Work-In-Progress", label: "कार्य प्रगति", icon: <BarChart /> },
    {
      label: "रिपोर्ट",
      icon: <FileText />,
      children: [
        // { to: "/Report/Report1", label: "वार्षिक रिपोर्ट" },
        { to: "/Report/Report2", label: "डैशबोर्ड रिपोर्ट" },
        { to: "/Report/Report3", label: "विभागवार सूची" },
        { to: "/Report/Report4", label: "स्थितिवार सूची" },
        { to: "/Report/Report5", label: "वित्तीय वार्षिक रिपोर्ट" },
        { to: "/Report/Report6", label: "कार्य प्रगति रिपोर्ट" },
        { to: "/Report/Report7", label: "एजेंसीवार विस्तृत रिपोर्ट" },
        { to: "/Report/Report8", label: "ब्लॉकवार रिपोर्ट" },
        { to: "/Report/Report9", label: "योजनावार रिपोर्ट" },
        { to: "/Report/Report10", label: "लंबित कार्य रिपोर्ट" },
        { to: "/Report/Report11", label: "अंतिम स्थिति रिपोर्ट" },
        { to: "/Report/Report12", label: "अभियंतावार रिपोर्ट" },
      ],
    },
    // ✅ FIXED: Admin-only items with proper conditional rendering
    ...(isAdmin() ? [
      { to: "/Admin/AdminDepartmentForms", label: "विभाग प्रबंधन", icon: <Building2 /> },
      { to: "/Admin/AdminUserForms", label: "उपयोगकर्ता प्रबंधन", icon: <Users /> },
      { to: "/Admin/AdminWorkForms", label: "कार्य प्रबंधन", icon: <Settings /> },
    ] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="s-logo">
        <div className="badge">
          <i className="fa-solid fa-certificate" style={{ color: "#fff" }}></i>
        </div>
        <div className="hide-sm">
          <div className="s-name">Raipur — निर्माण</div>
          <div className="s-sub">जिला प्रशासन रायपुर</div>
        </div>
      </div>
      <nav
        className="menu scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent hover:scrollbar-thumb-gray-700"
        aria-label="मुख्य नेविगेशन"
      >
        {items.map((it) =>
          !it.children ? (
            <button
              key={it.to}
              onClick={() => navigate(it.to)}
              className={location.pathname === it.to ? "active" : ""}
            >
              {it.icon}
              <span>{it.label}</span>
            </button>
          ) : (
            <div className="w-full" key={it.label}>
              <button
                className={`w-full`}
                onClick={() =>
                  setOpenMenu((prev) => (prev === it.label ? null : it.label))
                }
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
              <div
                className={`ml-10 overflow-hidden transition-all duration-300 ease-in-out ${
                  openMenu === it.label
                    ? "opacity-100"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                {it.children.map((child) => (
                  <button
                    className="w-full"
                    key={child.to}
                    onClick={() => navigate(child.to)}
                  >
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <i
            className="fa-solid fa-power-off"
            style={{ width: 26, textAlign: "center" }}
          ></i>
          <span>लॉगआउट</span>
        </button>
      </nav>
      <div className="tribal">
        <div className="art" />
      </div>
    </aside>
  );
};

export default App;
