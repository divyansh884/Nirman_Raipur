import React, { useState, useEffect } from 'react';
import './WorkDetails.css';
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from '../Store/useAuthStore.js';
import {BASE_SERVER_URL} from '../constants.jsx';
import TopBar from '../Components/TopBar.jsx';

const WorkDetails = ({ onLogout, onBack }) => {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [originalWorkData, setOriginalWorkData] = useState(null);
  const [workData, setWorkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Entry selection states
  const [showEntryPrompt, setShowEntryPrompt] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [availableEntries, setAvailableEntries] = useState([]);
  
  // Image slideshow states
  const [allImages, setAllImages] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const { token, isAuthenticated, logout } = useAuthStore();

  // Entry Selection Modal Component
  const EntrySelectionModal = ({ entries, onSelect, onCancel }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = () => {
      const entryNum = parseInt(inputValue);
      if (entryNum >= 1 && entryNum <= entries.length) {
        onSelect(entryNum);
      } else if (inputValue === '') {
        onSelect('all');
      } else {
        alert(`कृपया 1 से ${entries.length} तक की संख्या दर्ज करें या सभी एंट्री देखने के लिए खाली छोड़ें`);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    return (
      <div className="entry-modal-overlay">
        <div className="entry-modal-box">
          <h3>प्रगति एंट्री चुनें</h3>
          <p>कुल {entries.length} प्रगति एंट्री उपलब्ध हैं</p>
          
          <div className="entry-options">
            {entries.map((_, index) => (
              <button
                key={index}
                className="entry-option-btn"
                onClick={() => onSelect(index + 1)}
              >
                Entry {index + 1}
              </button>
            ))}
            <button
              className="entry-option-btn all-entries"
              onClick={() => onSelect('all')}
            >
              All Entries
            </button>
          </div>

          <div className="manual-entry">
            <label>या एंट्री नंबर टाइप करें:</label>
            <div className="input-group">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`1 से ${entries.length} तक`}
                min="1"
                max={entries.length}
                autoFocus
              />
              <button onClick={handleSubmit} className="submit-btn">
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Entry Switcher Component
  const EntrySwitcher = ({ entries, currentEntry, onSwitch }) => {
    if (entries.length <= 1) return null;

    return (
      <div className="entry-switcher">
        <label>एंट्री बदलें:</label>
        <div className="switcher-buttons">
          <button
            onClick={() => onSwitch('all')}
            className={`switcher-btn ${currentEntry === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          {entries.map((_, index) => (
            <button
              key={index}
              onClick={() => onSwitch(index + 1)}
              className={`switcher-btn ${currentEntry === (index + 1) ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ✅ UPDATED: Image Slideshow Component - No Auto-play
 // ✅ UPDATED: Image Slideshow Component with Zoom on Click
const ImageSlideshow = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false); // ✅ NEW: Zoom modal state

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="no-slideshow">
        <i className="fa-solid fa-image" style={{fontSize: '48px', color: '#ddd', marginBottom: '10px'}}></i>
        <p>कोई छवि उपलब्ध नहीं है</p>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // ✅ NEW: Zoom functions
  const openZoom = () => {
    setShowZoomModal(true);
  };

  const closeZoom = () => {
    setShowZoomModal(false);
  };

  return (
    <>
      <div className="image-slideshow">
        <div className="slideshow-container">
          <div className="slide-wrapper">
            <img 
              src={images[currentIndex].url} 
              alt={images[currentIndex].caption}
              className="slide-image"
              onClick={openZoom} // ✅ UPDATED: Open zoom modal on click
              onError={(e) => {
                console.error("Slideshow image failed to load:", images[currentIndex].url);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
              }}
            />
            <div className="slide-overlay">
              <i className="fa-solid fa-expand"></i>
              <span>क्लिक करके बड़ा करें</span>
            </div>
          </div>

          {images.length > 1 && (
            <>
              <button onClick={prevSlide} className="slide-nav slide-prev">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button onClick={nextSlide} className="slide-nav slide-next">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </>
          )}
        </div>

        <div className="slide-caption">
          <h4>{images[currentIndex].caption}</h4>
          <p>{images[currentIndex].section}</p>
        </div>

        {images.length > 1 && (
          <div className="slide-dots">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`slide-dot ${index === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ NEW: Zoom Modal */}
      {showZoomModal && (
        <div className="zoom-modal-overlay" onClick={closeZoom}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={closeZoom}>
              <i className="fa-solid fa-times"></i>
            </button>
            
            <div className="zoom-image-container">
              <img 
                src={images[currentIndex].url} 
                alt={images[currentIndex].caption}
                className="zoomed-image"
                onError={(e) => {
                  console.error("Zoomed image failed to load:", images[currentIndex].url);
                }}
              />
            </div>
            
            <div className="zoom-image-info">
              <h3>{images[currentIndex].caption}</h3>
              <p>{images[currentIndex].section}</p>
              <span className="zoom-counter">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            
            {/* ✅ Navigation in zoom modal */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
                  className="zoom-nav zoom-prev"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
                  className="zoom-nav zoom-next"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};


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

  // ✅ UPDATED: Extract ALL images regardless of entry selection
  const extractImagesFromData = (data) => {
    const images = [];
    
    console.log("🔍 Extracting ALL images from data:", data);

    // Technical Approval images
    if (data.technicalApproval?.attachedImages?.images) {
      data.technicalApproval.attachedImages.images.forEach((img, index) => {
        if (img && img.url) {
          images.push({
            url: img.url,
            section: 'Technical Approval',
            caption: `तकनीकी स्वीकृति छवि ${index + 1}`
          });
        }
      });
    }

    // Administrative Approval images
    if (data.administrativeApproval?.attachedImages?.images) {
      data.administrativeApproval.attachedImages.images.forEach((img, index) => {
        if (img && img.url) {
          images.push({
            url: img.url,
            section: 'Administrative Approval',
            caption: `प्रशासकीय स्वीकृति छवि ${index + 1}`
          });
        }
      });
    }

    // Tender Process images
    if (data.tenderProcess?.attachedImages?.images) {
      data.tenderProcess.attachedImages.images.forEach((img, index) => {
        if (img && img.url) {
          images.push({
            url: img.url,
            section: 'Tender Process',
            caption: `निविदा प्रक्रिया छवि ${index + 1}`
          });
        }
      });
    }

    // Work Order images
    if (data.workOrder?.attachedImages?.images) {
      data.workOrder.attachedImages.images.forEach((img, index) => {
        if (img && img.url) {
          images.push({
            url: img.url,
            section: 'Work Order',
            caption: `कार्य आदेश छवि ${index + 1}`
          });
        }
      });
    }

    // ✅ ALL Work Progress images (from all entries)
    if (data.workProgress && Array.isArray(data.workProgress)) {
      data.workProgress.forEach((progress, progressIndex) => {
        if (progress.progressImages) {
          let imagesToProcess = [];
          
          if (Array.isArray(progress.progressImages)) {
            imagesToProcess = progress.progressImages;
          } else if (progress.progressImages.images && Array.isArray(progress.progressImages.images)) {
            imagesToProcess = progress.progressImages.images;
          } else if (progress.progressImages.url || progress.progressImages.Location) {
            imagesToProcess = [progress.progressImages];
          }
          
          imagesToProcess.forEach((img, imgIndex) => {
            if (img && (img.url || img.Location)) {
              const imageUrl = img.url || img.Location;
              images.push({
                url: imageUrl,
                section: `Work Progress ${progressIndex + 1}`,
                caption: `कार्य प्रगति छवि ${progressIndex + 1}-${imgIndex + 1}`,
                progressIndex: progressIndex,
                imageIndex: imgIndex
              });
            }
          });
        }
      });
    }

    console.log("📸 Total extracted images (ALL):", images.length);
    return images;
  };

  // Handle entry selection
  const handleEntrySelection = (entryNumber) => {
    setShowEntryPrompt(false);
    setSelectedEntry(entryNumber);
    
    if (!originalWorkData) return;
    
    let filteredData;
    
    if (entryNumber === 'all') {
      filteredData = originalWorkData;
    } else {
      const entryIndex = parseInt(entryNumber) - 1;
      if (originalWorkData.workProgress && originalWorkData.workProgress[entryIndex]) {
        filteredData = {
          ...originalWorkData,
          workProgress: [originalWorkData.workProgress[entryIndex]]
        };
      } else {
        filteredData = originalWorkData;
      }
    }
    
    setWorkData(filteredData);
    
    // ✅ UPDATED: Always extract ALL images regardless of selected entry
    const extractedImages = extractImagesFromData(originalWorkData);
    setAllImages(extractedImages);
    setCurrentSlideIndex(0);
  };

  // Handle entry switching (for changing on page)
  const handleEntrySwitching = (entryNumber) => {
    setSelectedEntry(entryNumber);
    
    if (!originalWorkData) return;
    
    let filteredData;
    
    if (entryNumber === 'all') {
      filteredData = originalWorkData;
    } else {
      const entryIndex = parseInt(entryNumber) - 1;
      if (originalWorkData.workProgress && originalWorkData.workProgress[entryIndex]) {
        filteredData = {
          ...originalWorkData,
          workProgress: [originalWorkData.workProgress[entryIndex]]
        };
      } else {
        filteredData = originalWorkData;
      }
    }
    
    setWorkData(filteredData);
    
    // ✅ UPDATED: Always keep ALL images, don't re-extract
    // Images remain the same regardless of entry selection
  };

  // Fetch work details from API
  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!workId) {
        setError("Work ID not provided");
        setLoading(false);
        return;
      }

      if (!isAuthenticated || !token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BASE_SERVER_URL}/work-proposals/${workId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
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
        console.log("📥 API Response:", result);

        if (result.success && result.data) {
          const workItem = Array.isArray(result.data) ? result.data[0] : result.data;
          setOriginalWorkData(workItem);
          
          // ✅ UPDATED: Always extract ALL images once
          const extractedImages = extractImagesFromData(workItem);
          setAllImages(extractedImages);
          
          // Check if there are multiple progress entries and show prompt
          if (workItem.workProgress && workItem.workProgress.length > 1) {
            setAvailableEntries(workItem.workProgress);
            setShowEntryPrompt(true);
          } else {
            // If only one or no entries, show all data
            setWorkData(workItem);
            setSelectedEntry('all');
          }
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

  // Image modal functions
  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const nextImage = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Document viewing function
  const viewDocument = (documentUrl, title = 'Document') => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      alert('दस्तावेज़ उपलब्ध नहीं है');
    }
  };

  // Document button component
  const DocumentButton = ({ document, title }) => {
    if (!document) return <span className="no-document">कोई दस्तावेज़ नहीं</span>;
    
    const documentUrl = document.url || document.Location || document.location;
    
    if (!documentUrl) return <span className="no-document">कोई दस्तावेज़ नहीं</span>;
    
    return (
      <button 
        className="document-btn"
        onClick={() => viewDocument(documentUrl, title)}
        title={`${title} देखें`}
      >
        <i className="fa-solid fa-file-pdf"></i>
        {title} देखें
      </button>
    );
  };

  // Safe render function to show names instead of IDs
  const safeRender = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback;
    
    // Handle objects with name property
    if (typeof value === 'object' && value.name) {
      return value.name;
    }
    
    // Handle objects with displayName property
    if (typeof value === 'object' && value.displayName) {
      return value.displayName;
    }
    
    // Handle objects with fullName property
    if (typeof value === 'object' && value.fullName) {
      return value.fullName;
    }
    
    // For other objects, don't show raw JSON
    if (typeof value === 'object') {
      return '[Object Data]';
    }
    
    return String(value);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹ 0';
    return `₹ ${Number(amount).toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch (error) {
      return '-';
    }
  };

  // Authentication/Loading/Error states
  if (!isAuthenticated) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <TopBar onLogout={onLogout} />
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

  if (loading) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <TopBar onLogout={onLogout} />
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

  if (error) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <topBar onLogout={onLogout} />
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show entry selection prompt
  if (showEntryPrompt) {
    return (
      <div className="work-details-ref">
        <EntrySelectionModal
          entries={availableEntries}
          onSelect={handleEntrySelection}
          onCancel={() => handleEntrySelection('all')}
        />
        <div className="header">
          <TopBar onLogout={onLogout} />
        </div>
        <div className="wrap">
          <div style={{textAlign: 'center', padding: '50px'}}>
            <h3>प्रगति एंट्री चुनें...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!workData) {
    return (
      <div className="work-details-ref">
        <div className="header">
          <TopBar onLogout={onLogout} />
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
        <TopBar onLogout={onLogout} onBack={onBack} />
        <div className="subbar">
          <span className="dot" />
          <h2>कार्य विवरण</h2>
          {selectedEntry !== 'all' && selectedEntry && (
            <div className="entry-indicator">
              <span className="entry-badge">
                <i className="fa-solid fa-filter"></i>
                Entry {selectedEntry}
              </span>
            </div>
          )}
          
          {/* Entry Switcher in Header */}
          <EntrySwitcher 
            entries={availableEntries}
            currentEntry={selectedEntry}
            onSwitch={handleEntrySwitching}
          />
        </div>
      </div>

      <div className="wrap">
        {/* Two column layout with slideshow */}
        <div className="content-grid-two">
          {/* Main Work Details Section */}
          <div className="main-section">
            <section className="panel work-info">
              <div className="panel-header">
                <h3>कार्य सूची - {safeRender(workData.typeOfWork)}</h3>
                <div style={{fontSize:'12px', opacity:0.9}}>
                  Serial: {safeRender(workData.serialNumber)}
                  {selectedEntry !== 'all' && (
                    <span style={{marginLeft: '10px', color: '#ff6b35'}}>
                      • Entry {selectedEntry} Selected
                    </span>
                  )}
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
                    <span>{safeRender(workData.ward || workData.nameOfGPWard)}</span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य एजेंसी</label>
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
                    <span>{formatCurrency(workData.sanctionAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <label>कार्य विभाग</label>
                    <span>{safeRender(workData.workDepartment)}</span>
                  </div>
                  <div className="detail-row">
                    <label>स्वीकृतकर्ता विभाग</label>
                    <span>{safeRender(workData.approvingDepartment)}</span>
                  </div>
                  <div className="detail-row">
                    <label>शहर</label>
                    <span>{safeRender(workData.city)}</span>
                  </div>
                  <div className="detail-row">
                    <label>स्थान का प्रकार</label>
                    <span>{safeRender(workData.typeOfLocation)}</span>
                  </div>
                  <div className="detail-row">
                    <label>नियुक्त इंजीनियर</label>
                    <span>{safeRender(workData.appointedEngineer)}</span>
                  </div>
                  <div className="detail-row">
                    <label>नियुक्त एस.डी.ओ</label>
                    <span>{safeRender(workData.appointedSDO)}</span>
                  </div>
                  <div className="detail-row">
                    <label>वर्तमान स्थिति</label>
                    <span className="status-badge">{safeRender(workData.currentStatus)}</span>
                  </div>
                  <div className="detail-row">
                    <label>समग्र प्रगति</label>
                    <span>{workData.overallProgress || 0}%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Progress Details Section */}
            {workData.workProgress && workData.workProgress.length > 0 && (
              <section className="panel progress-section">
                <div className="panel-header">
                  <h3>प्रगति विवरण 📊</h3>
                  <div style={{fontSize:'12px', opacity:0.9}}>
                    {selectedEntry === 'all' 
                      ? `Total Entries: ${originalWorkData?.workProgress?.length || 0}`
                      : `Entry ${selectedEntry} of ${originalWorkData?.workProgress?.length || 0}`
                    }
                  </div>
                </div>
                <div className="p-body">
                  {workData.workProgress.map((progress, index) => {
                    const actualIndex = selectedEntry === 'all' 
                      ? index 
                      : parseInt(selectedEntry) - 1;
                    
                    return (
                      <div key={progress._id || index} className="progress-detail-card">
                        <div className="progress-header">
                          <h4>Progress Entry {actualIndex + 1}</h4>
                          <span className="progress-date">{formatDate(progress.createdAt)}</span>
                        </div>
                        
                        <div className="progress-grid">
                          <div className="progress-item">
                            <label>विवरण</label>
                            <span>{safeRender(progress.desc)}</span>
                          </div>
                          <div className="progress-item">
                            <label>स्वीकृत राशि</label>
                            <span>{formatCurrency(progress.sanctionedAmount)}</span>
                          </div>
                          <div className="progress-item">
                            <label>कुल जारी राशि</label>
                            <span>{formatCurrency(progress.totalAmountReleasedSoFar)}</span>
                          </div>
                          <div className="progress-item">
                            <label>शेष राशि</label>
                            <span>{formatCurrency(progress.remainingBalance)}</span>
                          </div>
                          <div className="progress-item">
                            <label>व्यय राशि</label>
                            <span>{formatCurrency(progress.expenditureAmount)}</span>
                          </div>
                          <div className="progress-item">
                            <label>MB स्टेज</label>
                            <span>{safeRender(progress.mbStageMeasurementBookStag)}</span>
                          </div>
                          <div className="progress-item">
                            <label>दस्तावेज़</label>
                            <DocumentButton 
                              document={progress.progressDocuments} 
                              title={`प्रगति दस्तावेज़ ${actualIndex + 1}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ✅ UPDATED: Slideshow Section - Shows ALL images */}
          <div className="slideshow-section">
            <section className="panel slideshow-panel">
              <div className="panel-header">
                <h3>सभी छवियां स्लाइडशो 📸</h3>
                <div style={{fontSize:'12px', opacity:0.9}}>
                  All Images: {allImages.length}
                  <br />
                  <span style={{fontSize:'10px', opacity:0.7}}>सभी सेक्शन की छवियां</span>
                </div>
              </div>
              <div className="p-body slideshow-body">
                <ImageSlideshow images={allImages} />
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Sections - All other sections */}
        <div className="bottom-sections">
          <div className="approval-sections">
            {/* Technical Approval */}
            {workData.technicalApproval && (
              <section className="panel approval-section">
                <div className="panel-header approval-header">
                  <h3>तकनीकी स्वीकृति 📝</h3>
                  <div style={{fontSize:'12px', opacity:0.9}}>
                    Status: {workData.technicalApproval.status}
                  </div>
                </div>
                <div className="p-body">
                  <div className="approval-grid">
                    <div className="approval-item">
                      <label>तकनीकी स्वीकृति क्रमांक</label>
                      <span>{safeRender(workData.technicalApproval.approvalNumber)}</span>
                    </div>
                    <div className="approval-item">
                      <label>तकनीकी स्वीकृति दिनांक</label>
                      <span>{formatDate(workData.technicalApproval.approvalDate)}</span>
                    </div>
                    <div className="approval-item">
                      <label>स्वीकृतकर्ता</label>
                      <span>{safeRender(workData.technicalApproval.approvedBy)}</span>
                    </div>
                    <div className="approval-item">
                      <label>टिप्पणी</label>
                      <span>{safeRender(workData.technicalApproval.remarks)}</span>
                    </div>
                    <div className="approval-item">
                      <label>दस्तावेज़</label>
                      <DocumentButton 
                        document={workData.technicalApproval.attachedFile} 
                        title="तकनीकी स्वीकृति दस्तावेज़"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Administrative Approval */}
            {workData.administrativeApproval && (
              <section className="panel approval-section">
                <div className="panel-header approval-header">
                  <h3>प्रशासकीय स्वीकृति 📝</h3>
                  <div style={{fontSize:'12px', opacity:0.9}}>
                    Status: {workData.administrativeApproval.status}
                  </div>
                </div>
                <div className="p-body">
                  <div className="approval-grid">
                    <div className="approval-item">
                      <label>स्वीकृतकर्ता</label>
                      <span>{safeRender(workData.administrativeApproval.byGovtDistrictAS)}</span>
                    </div>
                    <div className="approval-item">
                      <label>प्रशासकीय स्वीकृति क्रमांक</label>
                      <span>{safeRender(workData.administrativeApproval.approvalNumber)}</span>
                    </div>
                    <div className="approval-item">
                      <label>प्रशासकीय स्वीकृति दिनांक</label>
                      <span>{formatDate(workData.administrativeApproval.approvalDate)}</span>
                    </div>
                    <div className="approval-item">
                      <label>स्वीकृतकर्ता</label>
                      <span>{safeRender(workData.administrativeApproval.approvedBy)}</span>
                    </div>
                    <div className="approval-item">
                      <label>टिप्पणी</label>
                      <span>{safeRender(workData.administrativeApproval.remarks)}</span>
                    </div>
                    <div className="approval-item">
                      <label>दस्तावेज़</label>
                      <DocumentButton 
                        document={workData.administrativeApproval.attachedFile} 
                        title="प्रशासकीय स्वीकृति दस्तावेज़"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Tender Process */}
            {workData.tenderProcess && (
              <section className="panel approval-section">
                <div className="panel-header approval-header">
                  <h3>निविदा प्रक्रिया 📋</h3>
                  <div style={{fontSize:'12px', opacity:0.9}}>
                    Status: {workData.tenderProcess.tenderStatus}
                  </div>
                </div>
                <div className="p-body">
                  <div className="approval-grid">
                    <div className="approval-item">
                      <label>निविदा शीर्षक</label>
                      <span>{safeRender(workData.tenderProcess.tenderTitle)}</span>
                    </div>
                    <div className="approval-item">
                      <label>निविदा आईडी</label>
                      <span>{safeRender(workData.tenderProcess.tenderID)}</span>
                    </div>
                    <div className="approval-item">
                      <label>विभाग</label>
                      <span>{safeRender(workData.tenderProcess.department)}</span>
                    </div>
                    <div className="approval-item">
                      <label>जारी तिथि</label>
                      <span>{formatDate(workData.tenderProcess.issuedDates)}</span>
                    </div>
                    <div className="approval-item">
                      <label>टिप्पणी</label>
                      <span>{safeRender(workData.tenderProcess.remark)}</span>
                    </div>
                    <div className="approval-item">
                      <label>दस्तावेज़</label>
                      <DocumentButton 
                        document={workData.tenderProcess.attachedFile} 
                        title="निविदा दस्तावेज़"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}
              
            {/* Work Order Section */}
            {workData.workOrder && (
              <section className="panel approval-section">
                <div className="panel-header approval-header">
                  <h3>कार्य आदेश 📄</h3>
                </div>
                <div className="p-body">
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <tbody>
                        <tr>
                          <td>कार्य आदेश क्रमांक</td>
                          <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder.workOrderNumber)}</td>
                        </tr>
                        <tr>
                          <td>कार्य आदेश की दिनांक</td>
                          <td style={{fontWeight:'bold'}}>{formatDate(workData.workOrder.dateOfWorkOrder)}</td>
                        </tr>
                        <tr>
                          <td>कार्य आदेश राशि</td>
                          <td style={{fontWeight:'bold'}}>{formatCurrency(workData.workOrderAmount)}</td>
                        </tr>
                        <tr>
                          <td>ठेकेदार / ग्रामपंचायत</td>
                          <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder.contractorOrGramPanchayat)}</td>
                        </tr>
                        <tr>
                          <td>टिप्पणी</td>
                          <td style={{fontWeight:'bold'}}>{safeRender(workData.workOrder.remark)}</td>
                        </tr>
                        <tr>
                          <td>दस्तावेज़</td>
                          <td>
                            <DocumentButton 
                              document={workData.workOrder.attachedFile} 
                              title="कार्य आदेश दस्तावेज़"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal for Full View */}
      {showImageModal && allImages.length > 0 && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeImageModal}>
              <i className="fa-solid fa-times"></i>
            </button>
            
            <div className="modal-image-container">
              <img 
                src={allImages[currentSlideIndex].url} 
                alt={allImages[currentSlideIndex].caption}
              />
            </div>
            
            <div className="modal-image-info">
              <h4>{allImages[currentSlideIndex].caption}</h4>
              <p>{allImages[currentSlideIndex].section}</p>
              <span className="image-counter">
                {currentSlideIndex + 1} / {allImages.length}
              </span>
            </div>
            
            {allImages.length > 1 && (
              <>
                <button className="modal-nav modal-prev" onClick={prevImage}>
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button className="modal-nav modal-next" onClick={nextImage}>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkDetails;
