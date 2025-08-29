import React, { useState, useEffect, useMemo } from "react";
import "./Table.css";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../Components/TopBar.jsx";
import useAuthStore from '../Store/useAuthStore.js'; // Import Zustand store
import {BASE_SERVER_URL} from '../constants.jsx';
const Table1 = ({
  onLogout,
  onAddNew,
  addButtonLabel,
  showAddButton,
  onView,
  workStage = null, // Filter by work stage
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  // Get authentication from Zustand store
  const { token, isAuthenticated, logout } = useAuthStore();

  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError("Authentication required. Please login.");
      setLoading(false);
      return;
    }
  }, [isAuthenticated, token]);

  // NEW: Check if delete button should be shown based on page
  function canShowDeleteButton() {
    const allowedPages = [
      "प्रशासकीय स्वीकृति",
      "तकनीकी स्वीकृति",
      "Add New Work"
    ];
    return allowedPages.includes(addButtonLabel);
  }

  // Transform API response data to match table format
  function transformApiData(apiData) {
    return apiData.map((item) => ({
      id: item._id || item.id,
      name: item.nameOfWork || '',
      area: item.city || item.nameOfGPWard || item.ward || '',
      agency: item.workAgency || '',
      plan: item.scheme || '',
      techApproval: item.technicalApproval?.approvalNumber || item.technicalApproval?.status || "लंबित",
      adminApproval: item.administrativeApproval?.approvalNumber || item.administrativeApproval?.status || "लंबित", 
      tenderApproval: item.tenderProcess?.status || (item.isTenderOrNot ? "निविदा स्वीकृत" : "निविदा लागू नहीं है"),
      progress: item.workProgress?.progressPercentage ? `${item.workProgress.progressPercentage}%` : "-",
      details: item.currentStatus || item.workProgressStage || '',
      modified: item.lastRevision 
        ? new Date(item.lastRevision).toLocaleDateString('en-GB') 
        : new Date(item.updatedAt).toLocaleDateString('en-GB'),
      originalData: item
    }));
  }

  // Fetch data from API using Zustand token
  async function fetchWorkProposals() {
    // Check authentication first
    if (!isAuthenticated || !token) {
      setError("Authentication required. Please login.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${BASE_SERVER_URL}/work-proposals?page=${page}&limit=${size}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, logout user
          logout();
          setError("Session expired. Please login again.");
          return;
        }
        throw new Error(result.message || 'Failed to fetch work proposals');
      }

      if (result.success && result.data) {
        const transformedData = transformApiData(result.data);
        setData(transformedData);
        
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching work proposals:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Only fetch data if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWorkProposals();
    }
  }, [page, size, isAuthenticated, token]);

  function refreshData() {
    if (isAuthenticated && token) {
      fetchWorkProposals();
    }
  }

  const getStageTitle = () => {
    const stageTitles = {
      "दर्ज कार्य": "दर्ज कार्य की स्वीकृति सूची",
      "आरंभ": "आरंभित कार्य की स्वीकृति सूची",
      "तकनीकी स्वीकृति": "तकनीकी स्वीकृति की सूची",
      "प्रशासकीय स्वीकृति": "प्रशासकीय स्वीकृति की सूची",
      "निविदा स्तर पर": "निविदा स्तर पर कार्य की स्वीकृति सूची",
      "कार्य आदेश लंबित": "कार्य आदेश लंबित की स्वीकृति सूची",
      "कार्य आदेश जारी": "कार्य आदेश जारी की स्वीकृति सूची",
      "कार्य प्रगति पर": "कार्य प्रगति पर की स्वीकृति सूची",
      "कार्य पूर्ण": "कार्य पूर्ण की स्वीकृति सूची",
      "कार्य निरस्त": "कार्य निरस्त की स्वीकृति सूची",
      "कार्य बंद": "कार्य बंद की स्वीकृति सूची",
      "30 दिनों से लंबित कार्य": "30 दिनों से लंबित कार्य की स्वीकृति सूची",
      "फोटो रहित कार्य": "फोटो रहित कार्य की स्वीकृति सूची",
    };
    
    return workStage ? stageTitles[workStage] || `${workStage} की स्वीकृति सूची` : pageTitle;
  };

  const stageFiltered = useMemo(() => {
    if (!workStage) {
      return data;
    }

    return data.filter((item) => {
      return item.details === workStage;
    });
  }, [data, workStage]);

  const filtered = useMemo(() => {
    return stageFiltered.filter((d) => {
      if (filters.type && d.type && d.type.indexOf(filters.type) === -1) return false;
      if (filters.plan && (d.plan || "").indexOf(filters.plan) === -1) return false;
      if (filters.city && d.area && d.area.indexOf(filters.city) === -1) return false;
      if (filters.q) {
        const hay = Object.values(d).join(" ").toLowerCase();
        if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }, [stageFiltered, filters]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const A = (a[sortKey] ?? "").toString().toLowerCase();
      const B = (b[sortKey] ?? "").toString().toLowerCase();
      if (!isNaN(+A) && !isNaN(+B))
        return sortDir === "asc" ? +A - +B : +B - +A;
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const start = (page - 1) * size;
  const pageRows = sorted.slice(start, start + size);
  const totalFilteredItems = sorted.length;

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function resetFilters() {
    setFilters({ type: "", plan: "", q: "", city: "" });
    setPage(1);
  }

  function exportCSV() {
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.area,
      r.agency,
      r.plan,
      r.techApproval,
      r.adminApproval,
      r.tenderApproval,
      r.progress,
      r.details,
      r.modified,
    ]);
    let csv =
      "ID,कार्य का नाम,क्षेत्र,कार्य एजेंसी,योजना,तकनीकी स्वीकृति,प्रशासकीय स्वीकृति,निविदा स्वीकृति,कार्य प्रगति चरण,कार्य विवरण,अंतिम संशोधन\n";
    rows.forEach((r) => {
      csv +=
        r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",") +
        "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `work_approval_list_${workStage ? workStage.replace(/\s+/g, '_') : 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ENHANCED: Improved delete function with Zustand authentication
  async function deleteRow(id) {
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
          'Authorization': `Bearer ${token}` // Use token from Zustand store
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Logout using Zustand
          setError("Session expired. Please login again.");
          return;
        }
        if (response.status === 403) {
          showToast("आपको इस कार्य को हटाने की अनुमति नहीं है।");
          return;
        }
        if (response.status === 404) {
          showToast("कार्य नहीं मिला। यह पहले से हटाया जा चुका हो सकता है।");
          refreshData(); // Refresh to update the list
          return;
        }
        
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Failed to delete work proposal (Status: ${response.status})`);
      }

      // Success - refresh data
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
    "name",
    "area",
    "agency",
    "plan",
    "techApproval",
    "adminApproval",
    "tenderApproval",
    "progress",
    "details",
    "modified",
    null,
  ];

  function toggleSort(idx) {
    const k = keyMap[idx];
    if (!k) return;
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
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

  // Show authentication error if not authenticated
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

  return (
    <div className="work-ref">
      <div className="header">
        <TopBar onLogout={onLogout} />
        <div className="subbar">
          <span className="dot" />
          <h2>{getStageTitle()} - कुल: {totalFilteredItems}</h2>
        </div>
      </div>
      <div className="wrap">
        <section className="panel">
          <div className="p-body">
            {/* Filters section remains the same */}
            <div className="filters">
              <div className="field">
                <label>कार्य के प्रकार</label>
                <select
                  className="select"
                  value={filters.type}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, type: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">--कार्य के प्रकार चुने--</option>
                  <option>सीसी रोड</option>
                  <option>पंचायती भवन</option>
                  <option>भवन निर्माण</option>
                  <option>नाली निर्माण</option>
                  <option>सड़क मरम्मत</option>
                </select>
              </div>
              <div className="field">
                <label>कार्य विभाग</label>
                <select className="select">
                  <option value="">--कार्य विभाग चुने--</option>
                  <option>आदिवासी विकास विभाग, जशपुर</option>
                  <option>जनपद पंचायत</option>
                  <option>जिला पंचायत</option>
                  <option>राजस्व</option>
                </select>
              </div>
              <div className="field">
                <label>विधानसभा</label>
                <select className="select">
                  <option value="">--विधानसभा चुने--</option>
                  <option>कुनकुरी</option>
                  <option>जशपुर</option>
                  <option>पत्थलगांव</option>
                </select>
              </div>
              <div className="field">
                <label>इंजीनियर</label>
                <select className="select">
                  <option value="">--इंजीनियर चुने--</option>
                  <option>Engineer A</option>
                  <option>Engineer B</option>
                </select>
              </div>
              <div className="field">
                <label>योजना</label>
                <select
                  className="select"
                  value={filters.plan}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, plan: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">--योजना चुने--</option>
                  <option>CM योजना</option>
                  <option>Block Plan</option>
                  <option>Suguja Chhetra Pradhikaran</option>
                </select>
              </div>
              <div className="field">
                <label>कार्य विवरण</label>
                <select className="select">
                  <option value="">--कार्य विवरण चुने--</option>
                  <option>नाली निर्माण</option>
                  <option>सड़क मरम्मत</option>
                  <option>भवन निर्माण</option>
                </select>
              </div>
              <div className="field">
                <label>क्षेत्र</label>
                <select className="select">
                  <option value="">--क्षेत्र चुने--</option>
                  <option>ग्राम</option>
                  <option>शहर</option>
                </select>
              </div>
              <div className="field">
                <label>शहर</label>
                <select
                  className="select"
                  value={filters.city}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, city: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">--शहर चुने--</option>
                  <option>बगीचा</option>
                  <option>दुलदुला</option>
                  <option>फरसाबहार</option>
                  <option>कांसाबेल</option>
                  <option>कोटबा</option>
                  <option>मनोरा</option>
                  <option>कुनकुरी</option>
                  <option>जशपुर नगर</option>
                  <option>पत्थलगांव</option>
                </select>
              </div>
              <div className="field">
                <label>वार्ड</label>
                <input
                  className="input"
                  type="text"
                  placeholder="वार्ड का नाम लिखें"
                />
              </div>
              <div className="field full">
                <label>दिनांक के अनुसार खोज</label>
                <input className="input" placeholder="dd-mm-yyyy" />
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
                  setPage(1);
                }}
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
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
                  setPage(1);
                }}
                placeholder="खोजें..."
              />
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "क्रम",
                      "कार्य का नाम",
                      "क्षेत्र",
                      "कार्य एजेंसी",
                      "योजना",
                      "तकनीकी स्वीकृति",
                      "प्रशासकीय स्वीकृति",
                      "निविदा स्वीकृति",
                      "कार्य प्रगति चरण",
                      "कार्य विवरण",
                      "अंतिम संशोधन",
                      "कार्यवाही",
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
                  {pageRows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{start + i + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.area}</td>
                      <td>{r.agency}</td>
                      <td>{r.plan}</td>
                      <td>{r.techApproval}</td>
                      <td>{r.adminApproval}</td>
                      <td>{r.tenderApproval}</td>
                      <td>{r.progress}</td>
                      <td>{r.details}</td>
                      <td>{r.modified}</td>
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
                          {/* CONDITIONAL DELETE BUTTON - Only show on specific pages */}
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
                  {pageRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        style={{ textAlign: "center", padding: 30 }}
                      >
                        {workStage ? `${workStage} में कोई रिकॉर्ड नहीं मिला` : 'कोई रिकॉर्ड नहीं मिला'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <button
                aria-label="Previous page"
                className={"page nav" + (page === 1 ? " disabled" : "")}
                onClick={() => page > 1 && setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p >= Math.max(1, page - 2) &&
                    p <= Math.min(pages, page + 2),
                )
                .map((p) => (
                  <button
                    key={p}
                    className={"page" + (p === page ? " active" : "")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                aria-label="Next page"
                className={"page nav" + (page === pages ? " disabled" : "")}
                onClick={() =>
                  page < pages && setPage((p) => Math.min(pages, p + 1))
                }
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
            
            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Showing {Math.min(start + 1, totalFilteredItems)} to {Math.min(start + size, totalFilteredItems)} of {totalFilteredItems} entries
              {workStage && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>({workStage})</span>}
            </div>
          </div>
        </section>
      </div>
      <div className={"toast" + (toast ? ' show' : '')}>{toast || '\u00a0'}</div>
    </div>
  );
};

export default Table1;
