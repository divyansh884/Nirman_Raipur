import React, { useState, useEffect, useMemo } from "react";
import "./Table.css";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from "../Store/useAuthStore.js";
import { BASE_SERVER_URL } from '../constants.jsx';

const Table = ({
  onLogout,
  onAddNew,
  addButtonLabel,
  showAddButton,
  onView,
  workStage = null,
  pageTitle = "कार्य की सूची",
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    plan: "",
    q: "",
    city: "",
    workDepartment: "",
    assembly: "",
    engineer: "",
    ward: "",
    typeOfLocation: "",
    workAgency: ""
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [toast, setToast] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  // Dynamic dropdown data
  const [dropdownData, setDropdownData] = useState({
    typeOfWorks: [],
    schemes: [],
    cities: [],
    workDepartments: [],
    wards: [],
    typeOfLocations: [],
    workAgencies: [],
    engineers: []
  });

  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout, verifyToken, user } = useAuthStore();

  // Check if user is admin
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }
      
      const isValid = await verifyToken();
      if (!isValid) {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }
    };
    
    checkAuth();
  }, [isAuthenticated, token, verifyToken]);

  // Enhanced fetch function to include engineers
  const fetchDropdownData = async () => {
    if (!isAuthenticated || !token) return;

    try {
      const endpoints = [
        { key: 'typeOfWorks', url: '/admin/type-of-work' },
        { key: 'schemes', url: '/admin/scheme' },
        { key: 'cities', url: '/admin/city' },
        { key: 'workDepartments', url: '/admin/department' },
        { key: 'wards', url: '/admin/ward' },
        { key: 'typeOfLocations', url: '/admin/type-of-location' },
        { key: 'workAgencies', url: '/admin/work-agency' }
      ];

      // Fetch regular dropdown data
      const promises = endpoints.map(endpoint =>
        fetch(`${BASE_SERVER_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${endpoint.key}`);
          return res.json();
        }).then(data => ({ 
          key: endpoint.key, 
          data: Array.isArray(data.success ? data.data : (data.data || data)) 
            ? (data.success ? data.data : (data.data || data))
            : []
        })).catch(err => {
          console.error(`Error fetching ${endpoint.key}:`, err);
          return { key: endpoint.key, data: [] };
        })
      );

      // Add engineers fetch promise
      const engineersPromise = fetch(`${BASE_SERVER_URL}/admin/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      }).then(data => {
        // Filter users with role "Engineer"
        const allUsers = data.success ? data.data : (data.data || data || []);
        const engineers = Array.isArray(allUsers) 
          ? allUsers.filter(user => user.role === 'Engineer' && user.isActive === true)
          : [];
        
        console.log('Filtered engineers:', engineers);
        
        return { key: 'engineers', data: engineers };
      }).catch(err => {
        console.error('Error fetching engineers:', err);
        return { key: 'engineers', data: [] };
      });

      // Wait for all promises including engineers
      const allPromises = [...promises, engineersPromise];
      const results = await Promise.all(allPromises);
      const newDropdownData = {};
      
      results.forEach(result => {
        newDropdownData[result.key] = Array.isArray(result.data) ? result.data : [];
      });

      console.log('Final dropdown data:', newDropdownData);
      setDropdownData(newDropdownData);

    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  // Check if delete button should be shown based on page and user role
  function canShowDeleteButton() {
    if (!isAdmin) return false;
    
    const allowedPages = [
      "प्रशासकीय स्वीकृति",
      "तकनीकी स्वीकृति", 
      "Add New Work"
    ];
    return allowedPages.includes(addButtonLabel);
  }

  // CORRECTED: Enhanced transform function to handle nested objects properly
  function transformApiData(apiData) {
    if (!Array.isArray(apiData)) {
      console.error('transformApiData: apiData is not an array:', apiData);
      return [];
    }
    
    return apiData.map((item) => {
      const transformed = {
        id: item._id || item.id || '',
        serialNumber: String(item.serialNumber || ''),
        type: typeof item.typeOfWork === 'object' 
          ? String(item.typeOfWork?.name || '') 
          : String(item.typeOfWork || ''),
        year: String(item.financialYear || ''),
        vname: item.nameOfGPWard.name || 
               (typeof item.ward === 'object' ? String(item.ward?.name || '') : String(item.ward || '')),
        city: typeof item.city === 'object' 
          ? String(item.city?.name || '') 
          : String(item.city || ''),
        name: String(item.nameOfWork || ''),
        agency: typeof item.workAgency === 'object' 
          ? String(item.workAgency?.name || 'N/A') 
          : String(item.workAgency || 'N/A'),
        plan: typeof item.scheme === 'object' 
          ? String(item.scheme?.name || '') 
          : String(item.scheme || ''),
        amount: item.sanctionAmount ? String(item.sanctionAmount.toFixed(2)) : '0.00',
        status: String(item.currentStatus || item.workProgressStage || ''),
        modified: item.lastRevision 
          ? new Date(item.lastRevision).toLocaleDateString('en-GB') 
          : (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB') : ''),
        originalData: item
      };
      
      return transformed;
    });
  }

  // Fetch data from API with proper server-side pagination
  async function fetchWorkProposals() {
    if (!isAuthenticated || !token) {
      setError("Authentication required. Please login.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Build query parameters for server-side filtering and pagination
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: size.toString()
      });

      // Add filters to query if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value);
        }
      });

      // Add work stage filter if specified
      if (workStage) {
        queryParams.append('status', workStage);
      }

      // Add sorting if specified
      if (sortKey) {
        queryParams.append('sortBy', sortKey);
        queryParams.append('sortOrder', sortDir);
      }
      
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error(result.message || 'Failed to fetch work proposals');
      }

      if (result.success && result.data) {
        const transformedData = transformApiData(result.data);
        setData(transformedData);
        
        // Use server-side pagination info
        if (result.pagination) {
          setPagination({
            current: result.pagination.current || page,
            pages: result.pagination.pages || 1,
            total: result.pagination.total || 0,
            limit: result.pagination.limit || size
          });
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching work proposals:', error);
      setError(error.message || 'Failed to load data');
      // Reset pagination on error
      setPagination({
        current: 1,
        pages: 1,
        total: 0,
        limit: size
      });
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when page, size, filters, or sorting changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWorkProposals();
    }
  }, [page, size, filters, sortKey, sortDir, workStage, isAuthenticated, token]);

  // Fetch dropdown data once on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDropdownData();
    }
  }, [isAuthenticated, token]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, size, sortKey, sortDir]);

  // Refresh data function
  function refreshData() {
    if (isAuthenticated && token) {
      fetchWorkProposals();
    }
  }

  // Get stage title
  const getStageTitle = () => {
    const stageTitles = {
      "दर्ज कार्य": "दर्ज कार्य की सूची",
      "आरंभ": "आरंभित कार्य की सूची", 
      "तकनीकी स्वीकृति": "तकनीकी स्वीकृति की सूची",
      "प्रशासकीय स्वीकृति": "प्रशासकीय स्वीकृति की सूची",
      "निविदा स्तर पर": "निविदा स्तर पर कार्य की सूची",
      "कार्य आदेश लंबित": "कार्य आदेश लंबित की सूची",
      "कार्य आदेश जारी": "कार्य आदेश जारी की सूची",
      "कार्य प्रगति पर": "कार्य प्रगति पर की सूची",
      "कार्य पूर्ण": "कार्य पूर्ण की सूची",
      "कार्य निरस्त": "कार्य निरस्त की सूची",
      "कार्य बंद": "कार्य बंद की सूची",
      "30 दिनों से लंबित कार्य": "30 दिनों से लंबित कार्य की सूची",
      "फोटो रहित कार्य": "फोटो रहित कार्य की सूची",
    };
    
    return workStage ? stageTitles[workStage] || `${workStage} की सूची` : pageTitle;
  };

  // Use server-side pagination values
  const pages = pagination.pages || 1;
  const totalItems = pagination.total || 0;
  const currentPage = pagination.current || page;
  const pageSize = pagination.limit || size;
  
  // Calculate display values for current page
  const start = ((currentPage - 1) * pageSize);
  const end = Math.min(start + pageSize, totalItems);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function resetFilters() {
    setFilters({ 
      type: "", 
      plan: "", 
      q: "", 
      city: "",
      workDepartment: "",
      assembly: "",
      engineer: "",
      ward: "",
      typeOfLocation: "",
      workAgency: ""
    });
    setPage(1);
  }

  function exportCSV() {
    const rows = data.map((r) => [
      r.serialNumber || r.id,
      r.type,
      r.year,
      r.city,
      r.vname,
      r.name,
      r.agency,
      r.plan,
      r.amount,
      r.status,
      r.modified,
    ]);
    let csv = "Serial No,Type,Year,City,Village/Ward,Name,Agency,Plan,Amount,Status,Modified\n";
    rows.forEach((r) => {
      csv +=
        r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",") +
        "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `work_proposals_${workStage ? workStage.replace(/\s+/g, '_') : 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Enhanced delete function with admin check
  async function deleteRow(id) {
    if (!isAdmin) {
      showToast("केवल प्रशासकों को कार्य हटाने की अनुमति है।");
      return;
    }

    if (!window.confirm("क्या आप वाकई इस कार्य को हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।")) return;
    
    if (!isAuthenticated || !token) {
      showToast("प्रमाणीकरण आवश्यक है। कृपया पुनः लॉगिन करें।");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals/${id}`, {
        method: 'DELETE',
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
        if (response.status === 403) {
          showToast("आपको इस कार्य को हटाने की अनुमति नहीं है।");
          return;
        }
        if (response.status === 404) {
          showToast("कार्य नहीं मिला। यह पहले से हटाया जा चुका हो सकता है।");
          refreshData();
          return;
        }
        
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Failed to delete work proposal (Status: ${response.status})`);
      }

      await refreshData();
      showToast("कार्य सफलतापूर्वक हटाया गया।");
      
    } catch (error) {
      console.error('Error deleting work proposal:', error);
      showToast(`हटाने में त्रुटि: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const keyMap = [
    "id",
    null,
    "type",
    "year", 
    "city",
    "vname",
    "name",
    "agency",
    "plan",
    "amount",
    "status",
    "modified",
    null,
  ];

  function toggleSort(idx) {
    const k = keyMap[idx];
    if (!k) return;
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const crumbs = pathParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");

  const meta = {
    crumbs: crumbs,
    title: "निर्माण",
  };

  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"], link[data-fa]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
      l.setAttribute("data-fa", "1");
      document.head.appendChild(l);
    }
    if (
      !document.querySelector(
        'link[href*="Noto+Sans+Devanagari"], link[data-noto]',
      )
    ) {
      const g = document.createElement("link");
      g.rel = "stylesheet";
      g.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap";
      g.setAttribute("data-noto", "1");
      document.head.appendChild(g);
    }
  }, []);

  // Debug pagination
  console.log('Pagination Debug:', {
    currentPage,
    pages,
    totalItems,
    pageSize,
    start,
    end,
    dataLength: data.length
  });
  
  if (!isAuthenticated) {
    return (
      <div className="work-ref">
        <div className="header">
          <div className="table-top">
            <div>
              <div className="crumbs">{meta.crumbs}</div>
              <div className="title">
                <h1>{meta.title}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '10px', color: 'orange' }}></i>
              <div style={{ color: 'orange', marginBottom: '20px' }}>
                प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।
              </div>
              <button className="btn blue" onClick={() => navigate('/login')}>
                <i className="fa-solid fa-sign-in-alt" /> लॉगिन पेज पर जाएं
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="work-ref">
        <div className="header">
          <div className="table-top">
            <div>
              <div className="crumbs">{meta.crumbs}</div>
              <div className="title">
                <h1>{meta.title}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
              <div>डेटा लोड हो रहा है...</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="work-ref">
        <div className="header">
          <div className="table-top">
            <div>
              <div className="crumbs">{meta.crumbs}</div>
              <div className="title">
                <h1>{meta.title}</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <section className="panel">
            <div className="p-body" style={{ textAlign: 'center', padding: '50px' }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '10px', color: 'red' }}></i>
              <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn blue" onClick={refreshData}>
                  <i className="fa-solid fa-refresh" /> पुनः प्रयास करें
                </button>
                {error.includes('Session expired') || error.includes('Authentication required') ? (
                  <button className="btn green" onClick={() => navigate('/login')}>
                    <i className="fa-solid fa-sign-in-alt" /> लॉगिन करें
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  // Show authentication error if not authenticated
  return (
    <div className="work-ref">
      <div className="header">
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>{getStageTitle()} - कुल: {totalItems}</h2>
        </div>
      </div>
      <div className="wrap">
        <section className="panel">
          <div className="p-body">
            {/* CORRECTED: Enhanced Filters with Dynamic Data */}
            <div className="filters">
              {/* Type of Work Dropdown */}
              <div className="field">
                <label>कार्य के प्रकार</label>
                <select
                  className="select"
                  value={filters.type}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, type: e.target.value }));
                  }}
                >
                  <option value="">--कार्य के प्रकार चुने--</option>
                  {dropdownData.typeOfWorks.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || '')}>
                      {String(item.name || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Department Dropdown */}
              <div className="field">
                <label>कार्य विभाग</label>
                <select 
                  className="select"
                  value={filters.workDepartment}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, workDepartment: e.target.value }));
                  }}
                >
                  <option value="">--कार्य विभाग चुने--</option>
                  {dropdownData.workDepartments.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || item.workDeptName || '')}>
                      {String(item.name || item.workDeptName || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Engineer Dropdown */}
              <div className="field">
                <label>इंजीनियर</label>
                <select 
                  className="select"
                  value={filters.engineer}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, engineer: e.target.value }));
                  }}
                >
                  <option value="">--इंजीनियर चुने--</option>
                  {dropdownData.engineers.map((engineer) => (
                    <option key={engineer.id || engineer._id || Math.random()} value={String(engineer.id || engineer._id || '')}>
                      {`${String(engineer.fullName || 'Unknown')} (${String(engineer.role || 'Engineer')})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheme/Plan Dropdown */}
              <div className="field">
                <label>योजना</label>
                <select
                  className="select"
                  value={filters.plan}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, plan: e.target.value }));
                  }}
                >
                  <option value="">--योजना चुने--</option>
                  {dropdownData.schemes.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || '')}>
                      {String(item.name || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Agency Dropdown */}
              <div className="field">
                <label>कार्य एजेंसी</label>
                <select 
                  className="select"
                  value={filters.workAgency || ''}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, workAgency: e.target.value }));
                  }}
                >
                  <option value="">--कार्य एजेंसी चुने--</option>
                  {dropdownData.workAgencies.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || '')}>
                      {String(item.name || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type of Location Dropdown */}
              <div className="field">
                <label>क्षेत्र</label>
                <select 
                  className="select"
                  value={filters.typeOfLocation}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, typeOfLocation: e.target.value }));
                  }}
                >
                  <option value="">--क्षेत्र चुने--</option>
                  {dropdownData.typeOfLocations.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || '')}>
                      {String(item.name || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div className="field">
                <label>शहर</label>
                <select
                  className="select"
                  value={filters.city}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, city: e.target.value }));
                  }}
                >
                  <option value="">--शहर चुने--</option>
                  {dropdownData.cities.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || item.cityName || '')}>
                      {String(item.name || item.cityName || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Dropdown */}
              <div className="field">
                <label>वार्ड</label>
                <select
                  className="select"
                  value={filters.ward}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, ward: e.target.value }));
                  }}
                >
                  <option value="">--वार्ड चुने--</option>
                  {dropdownData.wards.map((item) => (
                    <option key={item._id || item.id || Math.random()} value={String(item.name || '')}>
                      {String(item.name || 'N/A')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <label>दिनांक के अनुसार खोज</label>
                <input className="input" placeholder="dd-mm-yyyy" type="date" />
              </div>
            </div>

            <div className="actions">
              <button
                className="btn blue"
                type="button"
                title="खोज"
                onClick={refreshData}
              >
                <i className="fa-solid fa-search" />
              </button>
              <button
                className="btn dark"
                type="button"
                title="रीसेट"
                onClick={resetFilters}
              >
                <i className="fa-solid fa-rotate" />
              </button>
              <button
                className="btn dark"
                type="button"
                title="रिफ्रेश"
                onClick={refreshData}
              >
                <i className="fa-solid fa-sync" />
              </button>
              <button
                className="btn dark"
                type="button"
                title="प्रिंट"
                onClick={() => window.print()}
              >
                <i className="fa-solid fa-print" />
              </button>
              <button
                className="btn dark"
                type="button"
                title="एक्सपोर्ट"
                onClick={exportCSV}
              >
                <i className="fa-solid fa-file-export" />
              </button>

              {showAddButton && (
                <button
                  className="btn green"
                  type="button"
                  onClick={() => navigate(`${onAddNew}`)}
                >
                  <i className="fa-solid fa-plus" /> {addButtonLabel}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="panel table-card">
          <div className="table-head">
            <div>{getStageTitle()}</div>
            <small>
              Show{" "}
              <select
                value={size}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value) || 10;
                  setSize(newSize);
                }}
              >
                <option style={{color:"black"}}>10</option>
                <option style={{color:"black"}}>25</option>
                <option style={{color:"black"}}>50</option>
              </select>{" "}
              entries
            </small>
          </div>
          <div className="p-body">
            <div className="toolbar">
              <label className="small">Search:</label>
              <input
                value={filters.q}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, q: e.target.value }));
                }}
                placeholder="खोजें..."
              />
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "क्र.",
                      "इमेज",
                      "कार्य के प्रकार",
                      "स्वी. वर्ष",
                      "शहर/नगर",
                      "ज. प./वि. ख./वार्ड का नाम",
                      "कार्य का नाम",
                      "कार्य एजेंसी",
                      "योजना | राशि (लाख रुपये)",
                      "कार्य की भौतिक स्थिति",
                      "अंतिम संशोधन",
                      "कार्रवाई",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={keyMap[i] ? "sortable" : ""}
                        onClick={() => keyMap[i] && toggleSort(i)}
                      >
                        {h}
                        {keyMap[i] && <i className="fa-solid fa-sort sort" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={r.id}>
                      <td>{start + i + 1}</td>
                      <td>
                        <div
                          style={{
                            width: 58,
                            height: 38,
                            border: "1px dashed #cfe2f0",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {r.serialNumber ? String(r.serialNumber).slice(-3) : 'IMG'}
                        </div>
                      </td>
                      <td>{String(r.type || '')}</td>
                      <td>{String(r.year || '')}</td>
                      <td>{String(r.city || '')}</td>
                      <td>{String(r.vname || '')}</td>
                      <td>{String(r.name || '')}</td>
                      <td>{String(r.agency || '')}</td>
                      <td>
                        <div className="plan-multiline">
                          <div className="plan-name">
                            {String(r.plan || '').split(" ").map((word, idx) => (
                              <div key={idx}>{word}</div>
                            ))}
                          </div>
                          <div className="plan-amount">₹{String(r.amount || '0.00')}</div>
                        </div>
                      </td>
                      <td>{String(r.status || '')}</td>
                      <td>{String(r.modified || '')}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn view"
                            type="button"
                            title="देखें"
                            aria-label="देखें"
                            onClick={() => navigate(`${onView}/${r.id}`)}
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          {canShowDeleteButton() && (
                            <button
                              className="icon-btn del"
                              type="button"
                              title="हटाएँ"
                              aria-label="हटाएँ"
                              onClick={() => deleteRow(r.id)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={12}
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        {workStage ? `${workStage} में कोई रिकॉर्ड नहीं मिला` : 'कोई रिकॉर्ड नहीं मिला'}
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={12}
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        डेटा लोड हो रहा है...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* FIXED: Corrected Pagination */}
            <div className="pager">
              <button
                aria-label="Previous page"
                className={"page nav" + (currentPage === 1 ? " disabled" : "")}
                onClick={() => {
                  console.log('Previous clicked, current page:', currentPage);
                  if (currentPage > 1) {
                    const newPage = Math.max(1, currentPage - 1);
                    console.log('Setting page to:', newPage);
                    setPage(newPage);
                  }
                }}
                disabled={currentPage === 1}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p >= Math.max(1, currentPage - 2) &&
                    p <= Math.min(pages, currentPage + 2),
                )
                .map((p) => (
                  <button
                    key={p}
                    className={"page" + (p === currentPage ? " active" : "")}
                    onClick={() => {
                      console.log('Page clicked:', p, 'Current page:', currentPage);
                      setPage(p);
                    }}
                  >
                    {p}
                  </button>
                ))}
              
              <button
                aria-label="Next page"
                className={"page nav" + (currentPage === pages ? " disabled" : "")}
                onClick={() => {
                  console.log('Next clicked, current page:', currentPage, 'total pages:', pages);
                  if (currentPage < pages) {
                    const newPage = Math.min(pages, currentPage + 1);
                    console.log('Setting page to:', newPage);
                    setPage(newPage);
                  }
                }}
                disabled={currentPage === pages}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
            
            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Showing {Math.min(start + 1, totalItems)} to {Math.min(end, totalItems)} of {totalItems} entries
              {workStage && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>({workStage})</span>}
              {isAdmin && <span style={{ marginLeft: '10px', color: '#28a745', fontWeight: 'bold' }}>(Admin)</span>}
              <span style={{ marginLeft: '10px', color: '#007bff' }}>
                इंजीनियर: {dropdownData.engineers.length}
              </span>
              <span style={{ marginLeft: '10px', color: '#6c757d' }}>
                Page {currentPage} of {pages}
              </span>
            </div>
          </div>
        </section>
      </div>
      <div className={"toast" + (toast ? ' show' : '')}>{toast || '\u00a0'}</div>
    </div>
  );
};

export default Table;
