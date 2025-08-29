import React, { useState, useEffect } from 'react';
import './WorkDetails.css';
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from '../Store/useAuthStore.js'; // Import Zustand store

const WorkDetails = ({ onLogout, onBack }) => {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [workData, setWorkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Load Font Awesome and fonts
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"], link[data-fa]')) {
      const l = document.createElement('link'); 
      l.rel = 'stylesheet'; 
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'; 
      l.setAttribute('data-fa', '1'); 
      document.head.appendChild(l);
    }
    if (!document.querySelector('link[href*="Noto+Sans+Devanagari"], link[data-noto]')) {
      const g = document.createElement('link'); 
      g.rel='stylesheet'; 
      g.href='https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap'; 
      g.setAttribute('data-noto','1'); 
      document.head.appendChild(g);
    }
  }, []);

  // Fetch work details from API using Zustand authentication
  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!workId) {
        setError("Work ID not provided");
        setLoading(false);
        return;
      }

      // Check authentication using Zustand store
      if (!isAuthenticated || !token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3000/api/work-proposals/${workId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Use token from Zustand store
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout(); // Use Zustand logout function
            setError("Session expired. Please login again.");
            return;
          }
          if (response.status === 404) {
            setError("Work not found.");
            return;
          }
          throw new Error(`Failed to fetch work details (Status: ${response.status})`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setWorkData(result.data);
        } else {
          throw new Error(result.message || 'Invalid response format');
        }

      } catch (error) {
        console.error('Error fetching work details:', error);
        setError(error.message || 'Failed to load work details');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkDetails();
  }, [workId, isAuthenticated, token, logout]);

  // Safe render function to avoid object rendering errors
  const safeRender = (value, fallback = '-') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">निर्माण / कार्य विवरण</div>
              <div className="title"><h1>निर्माण</h1></div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
            <div style={{ color: 'orange', marginBottom: '20px' }}>
              प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
            </div>
            <button 
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">निर्माण / कार्य विवरण</div>
              <div className="title"><h1>निर्माण</h1></div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <h3>डेटा लोड हो रहा है...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">निर्माण / कार्य विवरण</div>
              <div className="title"><h1>निर्माण</h1></div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>
            <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
            <h3>Error: {error}</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
              {error.includes('Session expired') || error.includes('Authentication required') ? (
                <button 
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-sign-in-alt" /> लॉगिन करें
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!workData) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">निर्माण / कार्य विवरण</div>
              <div className="title"><h1>निर्माण</h1></div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <h3>कोई कार्य विवरण नहीं मिला</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-details-ref">
      <div className="header">
        <div className="top">
          <div>
            <div className="crumbs">
              <button onClick={onBack} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', textDecoration:'underline'}}>
                निर्माण / कार्य सूची
              </button> / कार्य विवरण
            </div>
            <div className="title">
              <h1>निर्माण - कार्य विवरण</h1>
            </div>
          </div>
          <div className="user">
            <div className="ic" tabIndex={0} aria-label="User profile">
              <i className="fa-solid fa-user" />
            </div>
            <button 
              className="logout" 
              aria-label="Logout" 
              type="button" 
              onClick={onLogout || (() => {
                if (window.confirm('क्या आप लॉगआउट करना चाहते हैं?')) {
                  logout(); // Use Zustand logout function
                  navigate('/');
                }
              })}
            >
              <i className="fa-solid fa-power-off" />
            </button>
          </div>
        </div>
        <div className="subbar">
          <span className="dot" />
          <h2>कार्य विवरण</h2>
        </div>
      </div>

      <div className="wrap">
        <div className="content-grid">
          {/* Main Work Details Section */}
          <div className="main-section">
            <section className="panel work-info">
              <div className="panel-header">
                <h3>कार्य सूची - {safeRender(workData.typeOfWork)}</h3>
                <div style={{fontSize:'12px', opacity:0.9}}>
                  ID: {safeRender(workData._id)} | Serial: {safeRender(workData.serialNumber)}
                </div>
              </div>
              <div className="p-body">
                <div className="work-details-grid">
                  <div className="detail-row">
                    <label>कार्य का नाम</label>
                    <span>{safeRender(workData.nameOfWork, 'Unnamed Work')}</span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य के प्रकार</label>
                    <span>{safeRender(workData.typeOfWork)}</span>
                  </div>
                  <div className="detail-row">
                    <label>ग्राम/वार्ड</label>
                    <span>{safeRender(workData.nameOfGPWard || workData.ward)}</span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य विभाग</label>
                    <span>{safeRender(workData.workAgency)}</span>
                  </div>
                  <div className="detail-row">
                    <label>स्वीकृत वर्ष</label>
                    <span>{safeRender(workData.financialYear)}</span>
                  </div>
                  <div className="detail-row">
                    <label>योजना</label>
                    <span>{safeRender(workData.scheme)}</span>
                  </div>
                  <div className="detail-row">
                    <label>राशि (रुपये में)</label>
                    <span>₹ {workData.sanctionAmount ? workData.sanctionAmount.toLocaleString() : '0'}</span>
                  </div>
                  <div className="detail-row">
                    <label>उपयोगकर्ता विभाग</label>
                    <span>{safeRender(workData.userDepartment)}</span>
                  </div>
                  <div className="detail-row">
                    <label>स्वीकृतकर्ता विभाग</label>
                    <span>{safeRender(workData.approvingDepartment)}</span>
                  </div>
                  <div className="detail-row">
                    <label>वित्तीय वर्ष</label>
                    <span>{safeRender(workData.financialYear)}</span>
                  </div>
                  <div className="detail-row">
                    <label>विधानसभा</label>
                    <span>{safeRender(workData.assembly)}</span>
                  </div>
                  <div className="detail-row">
                    <label>देशांतर (Longitude)</label>
                    <span>{safeRender(workData.longitude)}</span>
                  </div>
                  <div className="detail-row">
                    <label>अक्षांश (Latitude)</label>
                    <span>{safeRender(workData.latitude)}</span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य समाप्ति अनुमानित दिनांक</label>
                    <span>
                      {workData.estimatedCompletionDateOfWork 
                        ? new Date(workData.estimatedCompletionDateOfWork).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य विवरण</label>
                    <span>{safeRender(workData.workDescription)}</span>
                  </div>
                  <div className="detail-row">
                    <label>वर्तमान स्थिति</label>
                    <span>{safeRender(workData.currentStatus)}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="sidebar-section">
            {/* Engineer Details */}
            <section className="panel engineer-details">
              <div className="panel-header">
                <h3>इंजीनियर</h3>
              </div>
              <div className="p-body">
                <div className="engineer-info">
                  <div className="detail-row">
                    <label>नाम</label>
                    <span>{safeRender(workData.appointedEngineer)}</span>
                  </div>
                  <div className="detail-row">
                    <label>मोबाइल नं</label>
                    <span>{safeRender(workData.engineerMobile)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* AE Details */}
            <section className="panel ae-details">
              <div className="panel-header">
                <h3>ए.ई</h3>
              </div>
              <div className="p-body">
                <div className="ae-info">
                  <div className="detail-row">
                    <label>नाम</label>
                    <span>{safeRender(workData.appointedSDO)}</span>
                  </div>
                  <div className="detail-row">
                    <label>मोबाइल नं</label>
                    <span>{safeRender(workData.sdoMobile)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Department Name */}
            <section className="panel dept-details">
              <div className="panel-header">
                <h3>कार्य विभाग का नाम</h3>
              </div>
              <div className="p-body">
                <div className="dept-info">
                  <div className="detail-row">
                    <label>नाम</label>
                    <span>{safeRender(workData.workDepartment)}</span>
                  </div>
                  <div className="detail-row">
                    <label>मोबाइल नं</label>
                    <span>-</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Current Status */}
            <section className="panel status-details">
              <div className="panel-header">
                <h3>वर्तमान स्थिति</h3>
              </div>
              <div className="p-body">
                <div className="status-info">
                  <h4>{safeRender(workData.currentStatus, 'स्थिति अज्ञात')}</h4>
                  <div className="status-dates">
                    <div className="status-item">
                      <label>सबमिशन दिनांक</label>
                      <span>
                        {workData.submissionDate 
                          ? new Date(workData.submissionDate).toLocaleDateString('en-GB')
                          : '-'
                        }
                      </span>
                    </div>
                    <div className="status-item">
                      <label>अंतिम संशोधन</label>
                      <span>
                        {workData.lastRevision 
                          ? new Date(workData.lastRevision).toLocaleDateString('en-GB')
                          : '-'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="bottom-sections">
          <div className="approval-sections">
            {/* Technical Approval */}
            <section className="panel approval-section">
              <div className="panel-header approval-header">
                <h3>तकनीकी स्वीकृति 📝</h3>
              </div>
              <div className="p-body">
                <div className="approval-grid">
                  <div className="approval-item">
                    <label>तकनीकी स्वीकृति क्रमांक</label>
                    <span>{safeRender(workData.technicalApproval?.approvalNumber)}</span>
                  </div>
                  <div className="approval-item">
                    <label>तकनीकी स्वीकृति दिनांक</label>
                    <span>
                      {workData.technicalApproval?.approvalDate 
                        ? new Date(workData.technicalApproval.approvalDate).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="approval-item">
                    <label>तकनीकी स्वीकृति राशि</label>
                    <span>
                      ₹ {workData.technicalApproval?.amountOfTechnicalSanction 
                        ? workData.technicalApproval.amountOfTechnicalSanction.toLocaleString()
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="approval-item">
                    <label>तकनीकी स्वीकृति प्रेषण दिनांक</label>
                    <span>
                      {workData.technicalApproval?.forwardingDate 
                        ? new Date(workData.technicalApproval.forwardingDate).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="approval-item">
                    <label>टिप्पणी</label>
                    <span>{safeRender(workData.technicalApproval?.remarks)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Administrative Approval */}
            <section className="panel approval-section">
              <div className="panel-header approval-header">
                <h3>प्रशासकीय स्वीकृति 📝</h3>
              </div>
              <div className="p-body">
                <div className="approval-grid">
                  <div className="approval-item">
                    <label>स्वीकृतकर्ता</label>
                    <span>{safeRender(workData.administrativeApproval?.byGovtDistrictAS)}</span>
                  </div>
                  <div className="approval-item">
                    <label>प्रशासकीय स्वीकृति क्रमांक</label>
                    <span>{safeRender(workData.administrativeApproval?.approvalNumber)}</span>
                  </div>
                  <div className="approval-item">
                    <label>प्रशासकीय स्वीकृति दिनांक</label>
                    <span>
                      {workData.administrativeApproval?.approvalDate 
                        ? new Date(workData.administrativeApproval.approvalDate).toLocaleDateString('en-GB')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="approval-item">
                    <label>प्रशासकीय स्वीकृति राशि</label>
                    <span>
                      ₹ {workData.administrativeApproval?.approvedAmount 
                        ? workData.administrativeApproval.approvedAmount.toLocaleString()
                        : '0'
                      }
                    </span>
                  </div>
                  <div className="approval-item">
                    <label>टिप्पणी</label>
                    <span>{safeRender(workData.administrativeApproval?.remarks)}</span>
                  </div>
                </div>
              </div>
            </section>
              
            {/* Work Order Section */}
            <section className="panel approval-section">
              <div className="panel-header approval-header">
                <h3>कार्य आदेश</h3>
              </div>
              <div className="p-body">
                <div className="custom-table-container">
                  <table className="custom-table">
                    <tbody>
                      <tr>
                        <td>कार्य आदेश क्रमांक</td>
                        <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder?.orderNumber)}</td>
                      </tr>
                      <tr>
                        <td>कार्य आदेश की दिनांक</td>
                        <td style={{fontWeight:'bold'}}>
                          {workData.workOrder?.orderDate 
                            ? new Date(workData.workOrder.orderDate).toLocaleDateString('en-GB')
                            : '-'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>कार्य आदेश राशि</td>
                        <td style={{fontWeight:'bold'}}>
                          ₹ {workData.workOrder?.orderAmount 
                            ? workData.workOrder.orderAmount.toLocaleString()
                            : '0'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>कार्य आदेश प्रारम्भ अनुमानित दिनांक</td>
                        <td style={{fontWeight:'bold'}}>
                          {workData.workOrder?.startDate 
                            ? new Date(workData.workOrder.startDate).toLocaleDateString('en-GB')
                            : '-'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>कार्य आदेश समाप्ति अनुमानित दिनांक</td>
                        <td style={{fontWeight:'bold'}}>
                          {workData.estimatedCompletionDateOfWork 
                            ? new Date(workData.estimatedCompletionDateOfWork).toLocaleDateString('en-GB')
                            : '-'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>ठेकेदार / ग्रामपंचायत</td>
                        <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder?.contractor || workData.nameOfGPWard)}</td>
                      </tr>
                      <tr>
                        <td>टिप्पणी</td>
                        <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder?.remarks)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetails;
