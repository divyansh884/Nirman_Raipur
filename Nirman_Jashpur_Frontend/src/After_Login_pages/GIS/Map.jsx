import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TopBar from "../../Components/TopBar.jsx";
// ✅ Single icon for all markers
import { BASE_SERVER_URL } from '../../constants.jsx';
const workIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function WorksMap({ onLogout }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);


  // ✅ Fixed: Added proper React import and useMemo


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

  const authToken = localStorage.getItem("authToken");

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_SERVER_URL}/work-proposals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = await res.json();
      const worksData = json.data || [];
      setWorks(worksData);
      
      // ✅ Extract unique values for filter dropdowns
      extractFilterOptions(worksData);
      
    } catch (err) {
      console.error("API fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Extract unique values from data for dropdowns
  const extractFilterOptions = (data) => {
    const workTypes = [...new Set(data.map(w => w.typeOfWork || w.workType).filter(Boolean))];
    const financialYears = [...new Set(data.map(w => w.financialYear).filter(Boolean))];
    const departments = [...new Set(data.map(w => w.workDepartment).filter(Boolean))];
    const cities = [...new Set(data.map(w => w.city).filter(Boolean))];

    setFilterOptions({
      workTypes: workTypes.sort(),
      financialYears: financialYears.sort(),
      departments: departments.sort(),
      cities: cities.sort()
    });
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  // ✅ Filter works based on selected filters
  const filteredWorks = works.filter(work => {
    const matchesWorkType = !filters.workType || 
      (work.typeOfWork === filters.workType || work.workType === filters.workType);
    const matchesFinancialYear = !filters.financialYear || 
      work.financialYear === filters.financialYear;
    const matchesDepartment = !filters.department || 
      work.workDepartment === filters.department;
    const matchesCity = !filters.city || 
      work.city === filters.city;

    return matchesWorkType && matchesFinancialYear && matchesDepartment && matchesCity;
  });

  // ✅ Filter works with valid coordinates
  const validWorks = filteredWorks.filter(work => 
    work && 
    work.latitude != null && 
    work.longitude != null && 
    !isNaN(work.latitude) && 
    !isNaN(work.longitude) &&
    work.latitude !== 0 && 
    work.longitude !== 0
  );

  // ✅ Reset filters
  const resetFilters = () => {
    setFilters({
      workType: "",
      financialYear: "",
      department: "",
      city: "",
    });
  };

  // ✅ Safe render function to avoid object rendering errors
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="p-4" style={{ padding: 0, margin: 0 }}>
      {/* 🔹 Header */}
      <div className="header" style={{ marginBottom: 20 }}>
        <TopBar />
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
          >
            Refresh Data
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow"
          >
            Reset Filters
          </button>
        </div>

        {/* ✅ Show statistics */}
        <div className="mt-4 text-sm text-gray-600">
          Total Works: {works.length} | Filtered: {filteredWorks.length} | On Map: {validWorks.length}
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
          ) : (
            <MapContainer
              center={[21.25, 81.62]}
              zoom={12}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* ✅ Render markers with single icon and safe rendering */}
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
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                      <div className="max-w-[280px] max-h-[200px] overflow-y-auto break-words text-sm p-2">
                        <p className="font-bold text-blue-900 mb-1">
                          {safeRender(work.nameOfWork, 'Unnamed Work')}
                        </p>
                        <p className="italic text-gray-600 mb-1">
                          {safeRender(work.typeOfWork || work.workType, 'Unknown Type')}
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

            <div className="pt-3 border-t border-gray-200">
              <p className="font-medium text-gray-700 mb-2">Filter Options Available:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>• Work Types: {filterOptions.workTypes.length}</p>
                <p>• Financial Years: {filterOptions.financialYears.length}</p>
                <p>• Departments: {filterOptions.departments.length}</p>
                <p>• Cities: {filterOptions.cities.length}</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="font-medium text-gray-700 mb-2">📍 Legend</h5>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Work Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
