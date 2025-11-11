import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../../Components/TopBar.jsx";
import { BASE_SERVER_URL } from '../../constants.jsx';
import useAuthStore from '../../Store/useAuthStore.js';

// Fix Leaflet default icons issue
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker icons for different statuses
const getWorkIcon = (status) => {
  const statusLower = status?.toLowerCase() || '';
  let color = 'blue';
  
  if (statusLower.includes('completed') || statusLower.includes('पूर्ण')) color = 'green';
  else if (statusLower.includes('progress') || statusLower.includes('प्रगति')) color = 'orange';
  else if (statusLower.includes('pending') || statusLower.includes('लंबित')) color = 'red';
  else if (statusLower.includes('approved') || statusLower.includes('स्वीकृत')) color = 'blue';
  
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Simple bounds calculation for map centering
const calculateMapBounds = (works) => {
  if (works.length === 0) {
    return {
      center: [21.24081703, 81.59685393],
      zoom: 12
    };
  }

  if (works.length === 1) {
    const work = works[0];
    return {
      center: [parseFloat(work.latitude), parseFloat(work.longitude)],
      zoom: 15
    };
  }

  // Calculate bounds for multiple works
  const latitudes = works.map(w => parseFloat(w.latitude));
  const longitudes = works.map(w => parseFloat(w.longitude));
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Calculate zoom level based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  let zoom = 12;
  if (maxDiff < 0.01) zoom = 16;
  else if (maxDiff < 0.05) zoom = 14;
  else if (maxDiff < 0.1) zoom = 13;
  else if (maxDiff < 0.5) zoom = 11;
  else if (maxDiff < 1) zoom = 10;
  else zoom = 9;
  
  return {
    center: [centerLat, centerLng],
    zoom: zoom
  };
};

export default function WorksMap({ onLogout }) {
  const navigate = useNavigate();

  const { 
    token, 
    isAuthenticated, 
    logout, 
    user,
    canAccessPage,
    getUserPermissions 
  } = useAuthStore();

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Performance monitoring
  const [performanceStats, setPerformanceStats] = useState({
    fetchTime: 0,
    renderTime: 0,
    totalWorks: 0
  });

  // Dynamic filter options from data
  const [filterOptions, setFilterOptions] = useState({
    workTypes: [],
    financialYears: [],
    departments: [],
    cities: [],
    statuses: []
  });

  const [filters, setFilters] = useState({
    workType: "",
    financialYear: "",
    department: "",
    city: "",
    status: "",
    limitMarkers: true // Add option to limit markers for performance
  });

  const [displayLimit, setDisplayLimit] = useState(100); // Limit markers shown

  useEffect(() => {
    document.title = "निर्माण | GIS Mapping";

    const checkAuth = () => {
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }

      const permissions = getUserPermissions();
      const canAccess = true;
      
      if (!canAccess) {
        alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
        navigate("/dashboard");
        return;
      }

      fetchWorks();
    };

    checkAuth();
  }, [isAuthenticated, token, navigate, canAccessPage, getUserPermissions]);

  // Enhanced fetch with performance monitoring
  const fetchWorks = async () => {
    if (!isAuthenticated || !token) {
      alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();
    
    try {
      console.log("📤 Fetching works data for mapping");

      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        params: {
          limit: 500 // Get up to 500 works
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setLoadingProgress(progress);
          }
        }
      });

      const fetchTime = performance.now() - startTime;
      console.log(`✅ Works data fetched in ${fetchTime.toFixed(2)}ms`);

      const worksData = response.data.data || [];
      setWorks(worksData);
      extractFilterOptions(worksData);
      
      // Update performance stats
      setPerformanceStats(prev => ({
        ...prev,
        fetchTime,
        totalWorks: worksData.length
      }));
      
    } catch (err) {
      console.error("❌ Works fetch error:", err);
      
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.message || "डेटा लोड करने में त्रुटि हुई";
        
        if (status === 401) {
          alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
          logout();
          navigate("/login");
        } else if (status === 403) {
          alert("आपको इस डेटा को देखने की अनुमति नहीं है।");
          navigate("/dashboard");
        } else if (status === 404) {
          setError("कोई कार्य प्रस्ताव नहीं मिला।");
        } else {
          setError(`त्रुटि: ${errorMessage}`);
        }
      } else if (err.request) {
        setError("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।");
      } else {
        setError("डेटा लोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
      
      setWorks([]);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  // Enhanced extract filter options with status
  const extractFilterOptions = (data) => {
    if (!Array.isArray(data)) {
      console.warn("Invalid data format for extracting filter options:", data);
      return;
    }

    const workTypes = [...new Set(
      data.map(w => {
        if (w.typeOfWork && typeof w.typeOfWork === 'object' && w.typeOfWork.name) {
          return w.typeOfWork.name;
        }
        return w.typeOfWork;
      }).filter(Boolean)
    )];

    const financialYears = [...new Set(data.map(w => w.financialYear).filter(Boolean))];

    const departments = [...new Set(
      data.map(w => {
        if (w.workDepartment && typeof w.workDepartment === 'object' && w.workDepartment.name) {
          return w.workDepartment.name;
        }
        return w.workDepartment;
      }).filter(Boolean)
    )];

    const cities = [...new Set(
      data.map(w => {
        if (w.city && typeof w.city === 'object' && w.city.name) {
          return w.city.name;
        }
        return w.city;
      }).filter(Boolean)
    )];

    const statuses = [...new Set(data.map(w => w.currentStatus).filter(Boolean))];

    setFilterOptions({
      workTypes: workTypes.sort(),
      financialYears: financialYears.sort().reverse(),
      departments: departments.sort(),
      cities: cities.sort(),
      statuses: statuses.sort()
    });
  };

  // Optimized filtering with useMemo for performance
  const filteredWorks = useMemo(() => {
    const startTime = performance.now();
    
    const filtered = works.filter(work => {
      if (!work) return false;

      const workTypeName = work.typeOfWork && typeof work.typeOfWork === 'object' && work.typeOfWork.name
        ? work.typeOfWork.name 
        : work.typeOfWork;
      const matchesWorkType = !filters.workType || workTypeName === filters.workType;

      const matchesFinancialYear = !filters.financialYear || work.financialYear === filters.financialYear;

      const departmentName = work.workDepartment && typeof work.workDepartment === 'object' && work.workDepartment.name
        ? work.workDepartment.name
        : work.workDepartment;
      const matchesDepartment = !filters.department || departmentName === filters.department;

      const cityName = work.city && typeof work.city === 'object' && work.city.name
        ? work.city.name
        : work.city;
      const matchesCity = !filters.city || cityName === filters.city;

      const matchesStatus = !filters.status || work.currentStatus === filters.status;

      return matchesWorkType && matchesFinancialYear && matchesDepartment && matchesCity && matchesStatus;
    });

    const renderTime = performance.now() - startTime;
    setPerformanceStats(prev => ({ ...prev, renderTime }));
    
    return filtered;
  }, [works, filters]);

  // Enhanced coordinate validation
  const validWorks = useMemo(() => {
    const valid = filteredWorks.filter(work => {
      if (!work || work.latitude === null || work.longitude === null) {
        return false;
      }

      const lat = parseFloat(work.latitude);
      const lng = parseFloat(work.longitude);
      
      const isValid = !isNaN(lat) && 
                     !isNaN(lng) && 
                     lat !== 0 && 
                     lng !== 0 &&
                     lat >= -90 && 
                     lat <= 90 &&
                     lng >= -180 && 
                     lng <= 180;

      return isValid;
    });

    // Apply display limit if enabled
    if (filters.limitMarkers && valid.length > displayLimit) {
      return valid.slice(0, displayLimit);
    }
    
    return valid;
  }, [filteredWorks, filters.limitMarkers, displayLimit]);

  // Calculate map bounds
  const mapBounds = useMemo(() => calculateMapBounds(validWorks), [validWorks]);

  const resetFilters = () => {
    setFilters({
      workType: "",
      financialYear: "",
      department: "",
      city: "",
      status: "",
      limitMarkers: true
    });
  };

  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      logout();
      navigate("/");
    }
  };

  const handleWorkClick = (work) => {
    const permissions = getUserPermissions();
    if (permissions?.canAccessWork || permissions?.isFullAdmin || user?.role === 'Admin') {
      navigate(`/work-details/${work._id}`);
    } else {
      alert('आपके पास कार्य विवरण देखने की अनुमति नहीं है।');
    }
  };

  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '') return fallback;
    
    if (typeof value === 'object' && value.name) {
      return value.name;
    }
    
    if (typeof value === 'object' && value.displayName) {
      return value.displayName;
    }
    
    if (typeof value === 'object' && value.fullName) {
      return value.fullName;
    }
    
    if (typeof value === 'object' && value._id && !value.name) {
      return `[ID: ${value._id.slice(-6)}]`;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  if (!isAuthenticated) {
    return (
      <div className="workorder-page">
        <div className="header">
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>GIS Mapping</h2>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
              <div style={{ color: 'orange', marginBottom: '20px' }}>
                प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 0, margin: 0 }}>
      {/* Header with performance stats */}
      <div className="header" style={{marginBottom: '10px'}}>
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>
            GIS Mapping - कुल: {works.length} | मानचित्र पर: {validWorks.length}
            {performanceStats.fetchTime > 0 && (
              <span style={{ fontSize: '0.7em', color: '#666', marginLeft: '10px' }}>
                (लोड टाइम: {performanceStats.fetchTime.toFixed(0)}ms)
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            🔍 Filter Works
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.limitMarkers}
                onChange={(e) => setFilters({ ...filters, limitMarkers: e.target.checked })}
              />
              Limit to {displayLimit} markers
            </label>
            <select
              value={displayLimit}
              onChange={(e) => setDisplayLimit(parseInt(e.target.value))}
              className="text-sm px-2 py-1 border rounded"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
            <span className="text-xs text-gray-500">
              Performance: {performanceStats.renderTime.toFixed(1)}ms
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.workType}
            onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">सभी कार्य प्रकार ({filterOptions.workTypes.length})</option>
            {filterOptions.workTypes.map((type) => (
              <option key={type} value={type}>
                {safeRender(type)}
              </option>
            ))}
          </select>

          <select
            value={filters.financialYear}
            onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">सभी वित्तीय वर्ष ({filterOptions.financialYears.length})</option>
            {filterOptions.financialYears.map((year) => (
              <option key={year} value={year}>
                {safeRender(year)}
              </option>
            ))}
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">सभी विभाग ({filterOptions.departments.length})</option>
            {filterOptions.departments.map((dept) => (
              <option key={dept} value={dept}>
                {safeRender(dept)}
              </option>
            ))}
          </select>

          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">सभी शहर ({filterOptions.cities.length})</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {safeRender(city)}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">सभी स्थितियां ({filterOptions.statuses.length})</option>
            {filterOptions.statuses.map((status) => (
              <option key={status} value={status}>
                {safeRender(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={fetchWorks}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow"
            disabled={loading}
          >
            {loading ? `डेटा लोड हो रहा है... ${loadingProgress.toFixed(0)}%` : "🔄 डेटा रिफ्रेश करें"}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow"
            disabled={loading}
          >
            ❌ फ़िल्टर रीसेट करें
          </button>
        </div>

        {/* Enhanced Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="font-bold text-blue-600">{works.length}</div>
            <div className="text-xs">कुल कार्य</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-bold text-green-600">{filteredWorks.length}</div>
            <div className="text-xs">फ़िल्टर किए गए</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="font-bold text-purple-600">{validWorks.length}</div>
            <div className="text-xs">मानचित्र पर</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="font-bold text-orange-600">{filteredWorks.length - validWorks.length}</div>
            <div className="text-xs">निर्देशांक नहीं</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="font-bold text-gray-600">{performanceStats.renderTime.toFixed(0)}ms</div>
            <div className="text-xs">रेंडर टाइम</div>
          </div>
        </div>

        {/* Show warning for large datasets */}
        {filteredWorks.length > displayLimit && filters.limitMarkers && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              ⚠️ डिस्प्ले सीमा: {filteredWorks.length} में से पहले {displayLimit} कार्य दिखाए गए हैं।
              <button
                onClick={() => setFilters({ ...filters, limitMarkers: false })}
                className="ml-2 text-amber-700 underline hover:text-amber-800"
              >
                सभी दिखाएं
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex">
        <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-200">
          {loading && works.length === 0 ? (
            <div className="flex items-center justify-center h-[600px] text-gray-600">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                मानचित्र डेटा लोड हो रहा है... {loadingProgress.toFixed(0)}%
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[600px] text-red-600">
              <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '48px', marginBottom: '20px', color: '#ef4444' }}></i>
              <p className="text-center mb-4">❌ {error}</p>
              <button 
                onClick={fetchWorks}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                🔄 पुनः प्रयास करें
              </button>
            </div>
          ) : validWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[600px] text-gray-600">
              <i className="fa-solid fa-map-marker-alt" style={{ fontSize: '48px', marginBottom: '20px', color: '#6b7280' }}></i>
              <p className="text-center mb-4">
                {filteredWorks.length === 0 
                  ? "फ़िल्टर के अनुसार कोई कार्य नहीं मिला"
                  : "कोई वैध निर्देशांक नहीं मिले"
                }
              </p>
            </div>
          ) : (
            <MapContainer
              key={`map-${mapBounds.center[0]}-${mapBounds.center[1]}-${mapBounds.zoom}`}
              center={mapBounds.center}
              zoom={mapBounds.zoom}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Render markers without clustering */}
              {validWorks.map((work, index) => {
                const lat = parseFloat(work.latitude);
                const lng = parseFloat(work.longitude);
                
                if (isNaN(lat) || isNaN(lng)) {
                  return null;
                }

                return (
                  <Marker
                    key={work._id || `marker-${index}`}
                    position={[lat, lng]}
                    icon={getWorkIcon(work.currentStatus)}
                    eventHandlers={{
                      click: () => handleWorkClick(work)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                      <div className="max-w-[300px] text-sm p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="font-bold text-blue-900 mb-2">
                          {safeRender(work.nameOfWork, 'अनामांकित कार्य')}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div><strong>प्रकार:</strong> {safeRender(work.typeOfWork)}</div>
                          <div><strong>स्थिति:</strong> {safeRender(work.currentStatus, 'अज्ञात')}</div>
                          <div><strong>एजेंसी:</strong> {safeRender(work.workAgency)}</div>
                          <div><strong>राशि:</strong> ₹{work.sanctionAmount?.toLocaleString('hi-IN') || '0'}</div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                        </div>
                        
                        <div className="text-xs text-blue-600 italic mt-2">
                          👆 विस्तार के लिए क्लिक करें
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Info Panel */}
        <div className="ml-4 w-80 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold mb-3">📊 प्रदर्शन डैशबोर्ड</h4>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">लोड किए गए कार्य</p>
              <p className="text-2xl font-bold text-blue-600">{works.length}</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">मानचित्र पर दिखाए गए</p>
              <p className="text-2xl font-bold text-green-600">{validWorks.length}</p>
              <p className="text-xs text-green-600">
                {filters.limitMarkers ? `सीमा: ${displayLimit}` : 'कोई सीमा नहीं'}
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-900">प्रदर्शन</p>
              <div className="text-xs text-yellow-700">
                <div>फ़ेच: {performanceStats.fetchTime.toFixed(0)}ms</div>
                <div>रेंडर: {performanceStats.renderTime.toFixed(0)}ms</div>
              </div>
            </div>
          </div>

          {/* Legend with status colors */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2">📍 स्थिति रंग कोड</h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>पूर्ण</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>प्रगति में</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>लंबित</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>अन्य</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
