import React, { useState } from "react";
import {
  Home,
  LogIn,
  Download,
  Map,
  FileText,
  ClipboardList,
  BarChart,
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
import ReportsPage from "./After_Login_pages/ReportsPage.jsx";
import WorkDetailsPage from "./After_Login_pages/WorkDetails.jsx";
import AdministrativeApprovalForm from "./Forms/AdministrativeApprovalForm.jsx";
import TechnicalApprovalForm from "./Forms/TechnicalApprovalForm.jsx";
import TenderForm from "./Forms/TenderForm.jsx";
import WorkOrderForm from "./Forms/WorkOrderForm.jsx";
import WorkInProgressForm from "./Forms/WorkInProgressForm.jsx";
import Profile from "./After_Login_pages/Profile.jsx";

// import ReportSub3 from "./After_Login_pages/ReportSub3.jsx";
// import ReportSub4 from "./After_Login_pages/ReportSub4.jsx";

import Yearly from "./After_Login_pages/Yearly.jsx";
import AgencyReport from "./After_Login_pages/AgencyReport.jsx";
import GISCategory from "./After_Login_pages/GIS/Category.jsx";
import GISType from "./After_Login_pages/GIS/Type.jsx";
import GISWorkList from "./After_Login_pages/GIS/WorkList.jsx";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/* Public navbar (not logged in) */}
        {!isLoggedIn && <TopNavbar setIsLoggedIn={setIsLoggedIn} />}

        {/* Sidebar when logged in */}
        {isLoggedIn && (
          <SideNavbar
            onLogout={() => {
              setIsLoggedIn(false);
            }}
          />
        )}

        <main className={isLoggedIn ? "logged-in-main" : ""}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />

            {/* Login */}
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
                )
              }
            />
            <Route path="/download" element={<DownloadPage />} />

            {/* Private routes */}
            {isLoggedIn && (
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
//                 {/*Report Routes*/}
//                 <Route path="/Report" element={<ReportsPage />} />
//                 <Route path="/Report/ReportSub3" element={<ReportSub3 />}/>
//                 <Route path="/Report/ReportSub4" element={<ReportSub4 />}/>
//                 {/* 
//                 Done by shaurya:-
//                 <Route path="/Report/Reportsub2" element={<ReportSub2 />}/>
//                 <Route path="/Report/ReportSub1" element={<ReportSub1 />}/> */}
//                 <Route path="/Report/ReportSub3" element={<ReportSub3 />}/>

                <Route path="/Report" element={<ReportsPage />} />
                <Route path="/Yearly" element={<Yearly />} />
                <Route path="/agency-report" element={<AgencyReport />} />
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
                <Route path="/gis/category" element={<GISCategory />} />
                <Route path="/gis/type" element={<GISType />} />
                <Route path="/gis/work-list" element={<GISWorkList />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const TopNavbar = ({ setIsLoggedIn }) => {
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
            <span className="logo-name">निर्माण जशपुर</span>
          </div>
          <span className="jashpur-text">Jashpur</span>
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

const SideNavbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const items = [
    { to: "/dashboard", label: "डैशबोर्ड", icon: <Home /> },
    { to: "/work", label: "कार्य", icon: <ClipboardList /> },
    {
      label: "GIS Fencing (Map)",
      icon: <Map />,
      children: [
        { to: "/gis/category", label: "GIS Category" },
        { to: "/gis/type", label: "GIS Work Type" },
        { to: "/gis/work-list", label: "GIS Work List" },
        { to: "/gis/map", label: "Map" },
      ],
    },
    { to: "/Technical-Approval", label: "तकनीकी स्वीकृति", icon: <FileText /> },
    {
      to: "/Administrative-Approval",
      label: "प्रशासकीय स्वीकृति",
      icon: <FileText />,
    },
    { to: "/Tender", label: "निविदा", icon: <FileText /> },
    { to: "/Work-Order", label: "कार्य आदेश", icon: <ClipboardList /> },
    { to: "/Work-In-Progress", label: "कार्य प्रगति", icon: <BarChart /> },
//     {
//       to: "/Report",
//       label: "रिपोर्ट",
//       icon: <FileText />,
//       children: [
//         { to: "/Report/sub1", label: "वित्तीय वर्ष" },
//         { to: "/Report/sub2", label: "कार्य एजेंसीवार रिपोर्ट" },
//         { to: "/Report/ReportSub3", label: "स्वीकृतकर्ता एजेंसीवार रिपोर्ट" },
//         { to: "/Report/ReportSub4", label: "एजेंसीवार दस्तावेज़ों की संख्या रिपोर्ट" },
//       ],
//     },
   {
    label: "रिपोर्ट",
    icon: <FileText />,
    children: [
      { to: "/Yearly", label: "वार्षिक रिपोर्ट" },
      { to: "/agency-report", label: "कार्य एजेंसीवार रिपोर्ट" },
    ],
  },
  ];

  return (
    <aside className="sidebar">
      <div className="s-logo">
        <div className="badge">
          <i className="fa-solid fa-certificate" style={{ color: "#fff" }}></i>
        </div>
        <div className="hide-sm">
          <div className="s-name">Jashpur — निर्माण</div>
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
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
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
          ),
        )}
        <button className="logout-btn" onClick={onLogout}>
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
