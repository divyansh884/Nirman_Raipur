import React, { useState } from 'react';
import { Home, LogIn, Download, Settings, User, LogOut, Map, FileText, ClipboardList, BarChart } from 'lucide-react';
import './App.css';
import LoginPage from './Before_Login_pages/Login.jsx';
import HomePage from './Before_Login_pages/HomePage.jsx';
import DownloadPage from './Before_Login_pages/DownloadPage.jsx';
import DashboardPage from './After_Login_pages/DashboardPage.jsx';
import GISPage from './After_Login_pages/GISPage.jsx';
import WorkPage from './After_Login_pages/WorkPage.jsx';
import AddToWork from './After_Login_pages/AddToWork.jsx';
import TechnicalApprovalPage from './After_Login_pages/TechnicalApprovalPage.jsx';
import AdministrativeApprovalPage from './After_Login_pages/AdministrativeApprovalPage.jsx';
import TenderPage from './After_Login_pages/TenderPage.jsx';
import WorkOrderPage from './After_Login_pages/WorkOrderPage.jsx';
import WorkProgressPage from './After_Login_pages/WorkProgressPage.jsx';
import ReportsPage from './After_Login_pages/ReportsPage.jsx';
import WorkDetails from './After_Login_pages/WorkDetails.jsx';
// this is my first react project. 
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [prefilledWorkData, setPrefilledWorkData] = useState(null);
  // Removed standalone early return; WorkPage will be embedded so navigation remains functional.
  const renderPageContent = () => {
    if (!isLoggedIn) {
      const pages = ['home', 'login', 'download'];
      switch (currentPage) {
        case 'home':
          return <HomePage />;
        case 'login':
          return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
        case 'download':
          return <DownloadPage />;
        default:
          return <HomePage />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardPage />;
  case 'gis':
          return <GISPage />;
        case 'work':
          return <WorkPage standalone={false} onAddNewWork={()=>setCurrentPage('workAdd')} onViewDetails={(id) => {
            setSelectedWorkId(id);
            setCurrentPage('workDetails');
          }} onLogout={() => {
            setIsLoggedIn(false);
            setCurrentPage('home');
          }} />;
        case 'workAdd':
          return <AddToWork 
            prefilledData={prefilledWorkData}
            onWorkAdded={() => {
              setPrefilledWorkData(null);
              setCurrentPage('work');
            }} 
          />;
        case 'workDetails':
          return <WorkDetails 
            workId={selectedWorkId}
            onBack={() => setCurrentPage('work')}
            onAcceptWork={(workData) => {
              setPrefilledWorkData(workData);
              setCurrentPage('workAdd');
            }}
            onLogout={() => {
            setIsLoggedIn(false);
            setCurrentPage('home');
          }} />;
        case 'admin':
          return <AdministrativeApprovalPage />;
        case 'tender':
          return <TenderPage />;
        case 'order':
          return <WorkOrderPage />;
        case 'progress':
          return <WorkProgressPage />;
        case 'report':
          return <ReportsPage />;
        default:
          return <DashboardPage />;
      }
    }
  };

  return (
    <div className="app-container">
      {/* Public top navbar when not logged in */}
      {!isLoggedIn && (
        <TopNavbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}
      {/* Sidebar for logged in pages except Technical (it has own full layout) */}
      {isLoggedIn && (
        <SideNavbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onLogout={() => {
            setIsLoggedIn(false);
            setCurrentPage('home');
          }}
        />
      )}
  <main className={isLoggedIn ? 'logged-in-main' : ''}>
        {currentPage === 'technical' ? <TechnicalApprovalPage onLogout={() => {
          setIsLoggedIn(false);
          setCurrentPage('home');
        }} /> : renderPageContent()}
      </main>
    </div>
  );
};

const TopNavbar = ({ currentPage, setCurrentPage }) => {
  const NavLink = ({ page, label, icon }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`nav-link ${currentPage === page ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <header className="header">
      <div className="container">
        <div className="logo-group">
          <div className="logo-text">
            <span className="logo-cg">CG</span>
            <span className="logo-name">निर्माण जशपुर</span>
          </div>
          <span className="jashpur-text">Jashpur</span>
        </div>

        <nav className="nav-desktop">
          <NavLink page="home" label="मुखपृष्ठ" icon={<Home />} />
          <NavLink page="login" label="विभागीय लॉगिन" icon={<LogIn />} />
          <NavLink page="download" label="ऐप डाउनलोड करे" icon={<Download />} />
        </nav>
      </div>
    </header>
  );
};

const SideNavbar = ({ currentPage, setCurrentPage, onLogout }) => {
  const items = [
    { k:'dashboard', label:'डैशबोर्ड', icon:<Home /> },
    { k:'work', label:'कार्य', icon:<ClipboardList /> },
    { k:'gis', label:'GIS Fencing (Map)', icon:<Map /> },
    { k:'technical', label:'तकनीकी स्वीकृति', icon:<FileText /> },
    { k:'admin', label:'प्रशासकीय स्वीकृति', icon:<FileText /> },
    { k:'tender', label:'निविदा', icon:<FileText /> },
    { k:'order', label:'कार्य आदेश', icon:<ClipboardList /> },
    { k:'progress', label:'कार्य प्रगति', icon:<BarChart /> },
    { k:'report', label:'रिपोर्ट', icon:<FileText /> }
  ];
  return (
    <aside className="sidebar">
      <div className="s-logo">
        <div className="badge"><i className="fa-solid fa-certificate" style={{ color:'#fff' }}></i></div>
        <div className="hide-sm">
          <div className="s-name">Jashpur — निर्माण</div>
          <div className="s-sub">आदिवासी विकास विभाग</div>
        </div>
      </div>
      <nav className="menu" aria-label="मुख्य नेविगेशन">
        {items.map(it => (
          <button key={it.k} className={currentPage===it.k? 'active': ''} onClick={()=>setCurrentPage(it.k)}>
            <i className="fa-solid fa-circle" style={{fontSize:6, display:'none'}}></i>{it.icon}<span>{it.label}</span>
          </button>
        ))}
        <button className="logout-btn" onClick={onLogout}><i className="fa-solid fa-power-off" style={{width:26,textAlign:'center'}}></i><span>लॉगआउट</span></button>
      </nav>
      <div className="tribal"><div className="art" /></div>
    </aside>
  );
};
export default App;
