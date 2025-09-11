import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../../Components/TopBar.jsx";
import { BASE_SERVER_URL } from '../../constants.jsx';
import useAuthStore from '../../Store/useAuthStore.js'; // ✅ Import auth store

// ✅ Fix Leaflet default icons issue
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

const workIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function WorksMap({ onLogout }) {
  const navigate = useNavigate();

  // ✅ Get authentication from Zustand store (same pattern as AdministrativeApprovalPage)
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

  // ✅ Dynamic filter options from data
  const [filterOptions, setFilterOptions] = useState({
    workTypes: [],
    financialYears: [],
    departments: [],
    cities: []
  });

  const [filters, setFilters] = useState({
    workType: "",
    financialYear: "",
    department: "",
    city: "",
  });

  // ✅ Set page title and check authentication on component mount (same pattern as AdministrativeApprovalPage)
  useEffect(() => {
    document.title = "निर्माण | GIS Mapping";

    // Check authentication on component mount
    const checkAuth = () => {
      if (!isAuthenticated || !token) {
        alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
        navigate("/login");
        return;
      }

      // ✅ Check if user has permission to access maps/reports
      const permissions = getUserPermissions();
      const canAccess = true;
      
      if (!canAccess) {
        alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
        navigate("/dashboard");
        return;
      }

      // User is authenticated and authorized, fetch data
      fetchWorks();
    };

    checkAuth();
  }, [isAuthenticated, token, navigate, canAccessPage, getUserPermissions]);

  // ✅ Enhanced fetch with proper authentication (similar to AdministrativeApprovalPage API pattern)
  const fetchWorks = async () => {
    // Check authentication using Zustand store
    if (!isAuthenticated || !token) {
      alert("आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("📤 Fetching works data for user:", user?.email);

      // ✅ Make API call using axios with proper authentication headers (same pattern as AdministrativeApprovalPage)
      const response = await axios.get(`${BASE_SERVER_URL}/work-proposals`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("✅ Works data fetched successfully:", response.data);

      const worksData = response.data.data || [];
      setWorks(worksData);
      extractFilterOptions(worksData);
      
    } catch (err) {
      console.error("❌ Works fetch error:", err);
      
      // ✅ Handle different error scenarios (same pattern as AdministrativeApprovalPage)
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
    }
  };

  // ✅ FIXED: Extract unique values handling nested object structures
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

    setFilterOptions({
      workTypes: workTypes.sort(),
      financialYears: financialYears.sort(),
      departments: departments.sort(),
      cities: cities.sort()
    });

    console.log("Filter options extracted:", {
      workTypes: workTypes.length,
      financialYears: financialYears.length,
      departments: departments.length,
      cities: cities.length
    });
  };

  // ✅ FIXED: Filter works handling nested object structures
  const filteredWorks = works.filter(work => {
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

    return matchesWorkType && matchesFinancialYear && matchesDepartment && matchesCity;
  });

  // ✅ Enhanced coordinate validation
  const validWorks = filteredWorks.filter(work => {
    if (!work || !work.latitude || !work.longitude) {
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

    if (!isValid) {
      console.warn(`Invalid coordinates for work ${work._id}:`, {
        latitude: work.latitude,
        longitude: work.longitude,
        parsed: { lat, lng }
      });
    }

    return isValid;
  });

  const resetFilters = () => {
    setFilters({
      workType: "",
      financialYear: "",
      department: "",
      city: "",
    });
  };

  // ✅ Handle logout (same pattern as AdministrativeApprovalPage)
  const handleLogout = () => {
    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
      logout();
      navigate("/");
    }
  };

  // ✅ Handle work details navigation
  const handleWorkClick = (work) => {
    const permissions = getUserPermissions();
    if (permissions?.canAccessWork || permissions?.isFullAdmin) {
      navigate(`/work-details/${work._id}`);
    } else {
      alert('आपके पास कार्य विवरण देखने की अनुमति नहीं है।');
    }
  };

  // ✅ IMPROVED: Safe render function handling nested object structures
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
      return '[Object]';
    }
    
    return String(value);
  };

  // ✅ Show authentication error if not authenticated (same pattern as AdministrativeApprovalPage)
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
      {/* ✅ Header with user info */}
      <div className="header" style={{marginBottom: '10px'}}>
          <TopBar onLogout={onLogout} />
          <div className="subbar">
            <span className="dot" />
            <h2>GIS Mapping</h2>
          </div>
        </div>

      {/* 🔹 Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          🔍 Filter Works
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Work Type Filter */}
          <select
            value={filters.workType}
            onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">All Work Types</option>
            {filterOptions.workTypes.map((type) => (
              <option key={type} value={type}>
                {safeRender(type)}
              </option>
            ))}
          </select>

          {/* Financial Year Filter */}
          <select
            value={filters.financialYear}
            onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">All Financial Years</option>
            {filterOptions.financialYears.map((year) => (
              <option key={year} value={year}>
                {safeRender(year)}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map((dept) => (
              <option key={dept} value={dept}>
                {safeRender(dept)}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            disabled={loading}
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {safeRender(city)}
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
            {loading ? "डेटा लोड हो रहा है..." : "🔄 Refresh Data"}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow"
            disabled={loading}
          >
            ❌ Reset Filters
          </button>
        </div>

        {/* ✅ Show statistics */}
        <div className="mt-4 text-sm text-gray-600">
          Total Works: <strong>{works.length}</strong> | Filtered: <strong>{filteredWorks.length}</strong> | On Map: <strong>{validWorks.length}</strong>
          {filteredWorks.length > validWorks.length && (
            <span className="text-amber-600 ml-2">
              ({filteredWorks.length - validWorks.length} works missing coordinates)
            </span>
          )}
        </div>

        {/* ✅ Active Filters Display */}
        {(filters.workType || filters.financialYear || filters.department || filters.city) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600">Active Filters:</span>
            {filters.workType && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
                Type: {safeRender(filters.workType)}
              </span>
            )}
            {filters.financialYear && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs">
                Year: {safeRender(filters.financialYear)}
              </span>
            )}
            {filters.department && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs">
                Dept: {safeRender(filters.department)}
              </span>
            )}
            {filters.city && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs">
                City: {safeRender(filters.city)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 🔹 Map + Info Panel */}
      <div className="flex">
        <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] text-gray-600">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading map data...
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
          ) : (
            <MapContainer
              center={[21.24081703, 81.59685393]} // ✅ FIXED: Use coordinates from your data
              zoom={12}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* ✅ Render markers with click handlers */}
              {validWorks.map((work) => {
                const lat = parseFloat(work.latitude);
                const lng = parseFloat(work.longitude);
                
                if (isNaN(lat) || isNaN(lng)) {
                  console.warn(`Invalid coordinates for work ${work._id}:`, { lat: work.latitude, lng: work.longitude });
                  return null;
                }

                return (
                  <Marker
                    key={work._id || `marker-${lat}-${lng}`}
                    position={[lat, lng]}
                    icon={workIcon}
                    eventHandlers={{
                      click: () => handleWorkClick(work)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                      <div className="max-w-[280px] max-h-[200px] overflow-y-auto break-words text-sm p-2">
                        <p className="font-bold text-blue-900 mb-1">
                          {safeRender(work.nameOfWork, 'Unnamed Work')}
                        </p>
                        <p className="italic text-gray-600 mb-1">
                          <strong>Type:</strong> {safeRender(work.typeOfWork, 'Unknown Type')}
                        </p>
                        <p className="text-xs text-gray-700 mb-1">
                          <span className="font-medium">Status:</span> {safeRender(work.currentStatus, 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-700 mb-1">
                          <span className="font-medium">Agency:</span> {safeRender(work.workAgency, 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-700 mb-1">
                          <span className="font-medium">Department:</span> {safeRender(work.workDepartment, 'Unknown')}
                        </p>
                        <p className="text-xs text-gray-700 mb-1">
                          <span className="font-medium">FY:</span> {safeRender(work.financialYear, 'Unknown')}
                        </p>
                        <p className="font-semibold text-green-700 mb-1">
                          ₹ {work.sanctionAmount ? work.sanctionAmount.toLocaleString() : '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Serial: {safeRender(work.serialNumber, 'N/A')}
                        </p>
                        <p className="text-xs text-gray-400">
                          📍 {lat.toFixed(4)}, {lng.toFixed(4)}
                        </p>
                        {/* ✅ Click hint */}
                        <p className="text-xs text-blue-600 italic mt-2">
                          👆 Click marker for details
                        </p>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* 🔹 Info Panel */}
        <div className="ml-4 w-64 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold mb-3 flex items-center">
            📊 Map Summary
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Works on Map</p>
              <p className="text-2xl font-bold text-blue-600">{validWorks.length}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700">Total Works</p>
              <p className="text-xl font-semibold text-gray-600">{works.length}</p>
            </div>

            {filteredWorks.length !== works.length && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900">Filtered Results</p>
                <p className="text-xl font-semibold text-green-600">{filteredWorks.length}</p>
              </div>
            )}
          </div>

          {/* ✅ User permissions info */}
          <div className="pt-4 border-t border-gray-200 mb-4">
            <h5 className="font-medium text-gray-700 mb-2">👤 Your Access Level:</h5>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>{user?.role}</strong>
              <br />
              {getUserPermissions()?.canAccessWork ? '✅ Can view work details' : '❌ Limited work access'}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="font-medium text-gray-700 mb-2">Filter Options Available:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Work Types: {filterOptions.workTypes.length}</p>
              <p>• Financial Years: {filterOptions.financialYears.length}</p>
              <p>• Departments: {filterOptions.departments.length}</p>
              <p>• Cities: {filterOptions.cities.length}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2">📍 Legend</h5>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Work Location (clickable)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
