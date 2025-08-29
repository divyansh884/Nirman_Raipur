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
import Report1 from "./After_Login_pages/Reports/Report1.jsx";
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

const App = () => {
  const { isAuthenticated, user, verifyToken, isAdmin } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        await verifyToken();
      }
    };
    checkAuth();
  }, [isAuthenticated, verifyToken]);

  return (
    <Router>
      <div className="app-container">
        {/* Public navbar (not logged in) */}
        {!isAuthenticated && <TopNavbar />}
        {/* Sidebar when logged in */}
        {isAuthenticated && <SideNavbar />}
        <main className={isAuthenticated ? "logged-in-main" : ""}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            {/* Login */}
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
            <Route path="/download" element={<DownloadPage />} />
            {/* Private routes */}
            {isAuthenticated && (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/work" element={<WorkPage />} />
                <Route
                  path="/Technical-Approval"
                  element={<TechnicalApprovalPage />}
                />
                <Route
                  path="/Administrative-Approval"
                  element={<AdministrativeApprovalPage />}
                />
                <Route path="/Tender" element={<TenderPage />} />
                <Route path="/Work-Order" element={<WorkOrderPage />} />
                <Route
                  path="/Work-In-Progress"
                  element={<WorkProgressPage />}
                />
                {/*Report Routes*/}
                <Route path="/add-work" element={<WorkForm />} />
                <Route path="/work/:workId" element={<WorkDetailsPage />} />
                <Route
                  path="/Administrative-Approval-Form/:workId"
                  element={<AdministrativeApprovalForm />}
                />
                <Route
                  path="/Technical-Approval-Form/:workId"
                  element={<TechnicalApprovalForm />}
                />
                <Route path="/Tender-Form/:workId" element={<TenderForm />} />
                <Route
                  path="/Work-Order-Form/:workId"
                  element={<WorkOrderForm />}
                />
                <Route
                  path="/Work-In-Progress-Form/:workId"
                  element={<WorkInProgressForm />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/gis/map" element={<MyMap />} />
                <Route path="/Report/Report1" element={<Report1 />} />
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
                
                {/* Admin-only routes - Only accessible by admin users */}
                {isAdmin() && (
                  <>
                    <Route path="/Admin/AdminDepartmentForms" element={<AdminDepartmentForms />} />
                    <Route path="/Admin/AdminUserForms" element={<AdminUserForm />} />
                    <Route path="/Admin/AdminWorkForms" element={<AdminWorkForm />} />
                  </>
                )}
              </>
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
        <nav className="nav-desktop ">
          <NavLink to="/" label="मुखपृष्ठ" icon={<Home />} />
          <NavLink to="/login" label="विभागीय लॉगिन" icon={<LogIn />} />
          <NavLink to="/download" label="ऐप डाउनलोड करे" icon={<Download />} />
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
  };

  const items = [
    { to: "/dashboard", label: "डैशबोर्ड", icon: <Home /> },
    { to: "/work", label: "कार्य", icon: <ClipboardList /> },
    { to: "/gis/map", label: "GIS मैपिंग", icon: <Map /> },
    { to: "/Technical-Approval", label: "तकनीकी स्वीकृति", icon: <FileText /> },
    {
      to: "/Administrative-Approval",
      label: "प्रशासकीय स्वीकृति",
      icon: <FileText />,
    },
    { to: "/Tender", label: "निविदा", icon: <FileText /> },
    { to: "/Work-Order", label: "कार्य आदेश", icon: <ClipboardList /> },
    { to: "/Work-In-Progress", label: "कार्य प्रगति", icon: <BarChart /> },
    {
      label: "रिपोर्ट",
      icon: <FileText />,
      children: [
        { to: "/Report/Report1", label: "वार्षिक रिपोर्ट" },
        { to: "/Report/Report2", label: "रिपोर्ट 2" },
        { to: "/Report/Report3", label: "रिपोर्ट 3" },
        { to: "/Report/Report4", label: "रिपोर्ट 4" },
        { to: "/Report/Report5", label: "रिपोर्ट 5" },
        { to: "/Report/Report6", label: "रिपोर्ट 6" },
        { to: "/Report/Report7", label: "रिपोर्ट 7" },
        { to: "/Report/Report8", label: "रिपोर्ट 8" },
        { to: "/Report/Report9", label: "रिपोर्ट 9" },
        { to: "/Report/Report10", label: "रिपोर्ट 10" },
        { to: "/Report/Report11", label: "रिपोर्ट 11" },
        { to: "/Report/Report12", label: "रिपोर्ट 12" },
      ],
    },
    // Admin-only items - Only show if user is admin
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
          <div className="s-sub">आदिवासी विकास विभाग</div>
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
