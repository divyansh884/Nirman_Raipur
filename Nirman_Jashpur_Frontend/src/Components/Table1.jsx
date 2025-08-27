import React, { useState, useEffect, useMemo } from "react";
import "./Table.css";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "tribal_work_data_v1";
const defaultRows = [
  {
    id: 1,
    name: "आर.सी.सी. पुलिया निर्माण कार्य",
    area: "कुनकुरी",
    agency: "जनपद पंचायत कुनकुरी",
    plan: "Suguja Chhetra Pradhikaran",
    techApproval: "TS NO - 1193",
    adminApproval: "AS NO - 135",
    tenderApproval: "निविदा लागू नहीं है",
    progress: "-",
    details: "कार्य आदेश लंबित",
    modified: "25-08-2025",
  },
  {
    id: 2,
    name: "सड़क निर्माण कार्य",
    area: "जशपुर",
    agency: "लोक निर्माण विभाग",
    plan: "Block Plan",
    techApproval: "TS NO - 889",
    adminApproval: "AS NO - 78",
    tenderApproval: "निविदा स्वीकृत",
    progress: "30%",
    details: "कार्य प्रगति पर है",
    modified: "20-08-2025",
  },
  {
    id: 3,
    name: "पंचायत भवन निर्माण",
    area: "बगीचा",
    agency: "ग्राम पंचायत बुढ़ाढांड",
    plan: "जिला पंचायत योजना",
    techApproval: "TS NO - 456",
    adminApproval: "AS NO - 102",
    tenderApproval: "निविदा स्वीकृत",
    progress: "पूर्ण",
    details: "कार्य पूर्ण हो चुका है",
    modified: "10-06-2024",
  },
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...defaultRows];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [...defaultRows];
  } catch {
    return [...defaultRows];
  }
}
function saveData(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

const Table1 = ({
  onLogout,
  onAddNew,
  addButtonLabel,
  showAddButton,
  onView,
}) => {
  const [data, setData] = useState(loadData());
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
  const navigate = useNavigate();
  const pathParts = location.pathname.split("/").filter(Boolean);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (filters.type && d.type.indexOf(filters.type) === -1) return false;
      if (filters.plan && (d.plan || "").indexOf(filters.plan) === -1)
        return false;
      if (filters.q) {
        const hay = Object.values(d).join(" ").toLowerCase();
        if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }, [data, filters]);

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
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }
  function resetFilters() {
    setFilters({ type: "", plan: "", q: "" });
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
    a.download = "work_list.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function deleteRow(id) {
    if (!window.confirm("क्या आप हटाना चाहते हैं?")) return;
    setData(data.filter((r) => r.id !== id));
    showToast("कार्य हटाया गया");
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

  return (
    <div className="work-ref">
      <div className="header">
        <div className="table-top">
          <div>
            <div className="crumbs" id="crumbs">
              {meta.crumbs}
            </div>
            <div className="title">
              <h1 id="pageTitle">{meta.title}</h1>
            </div>
          </div>
          <div className="user">

            <button
              className="ic"
              tabIndex={0}
              aria-label="User profile"
              type="button"
              onClick={() => navigate('/profile')}
            >
              <i className="fa-solid fa-user" />
            </button>
            <button className="logout" aria-label="Logout" type="button" onClick={onLogout || (() => {
              if (window.confirm('क्या आप लॉगआउट करना चाहते हैं?')) {
                window.location.href = '/';
 }
                 })

              }
            >
              <i className="fa-solid fa-power-off" />
            </button>
          </div>
        </div>
        <div className="subbar">
          <span className="dot" />
          <h2>कार्य की सूची-({addButtonLabel})</h2>
        </div>
      </div>
      <div className="wrap">
        <section className="panel">
          <div className="p-body">
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
                  <option>नाली निर्माण</option>
                  <option>सड़क मरम्मत</option>
                </select>
              </div>
              <div className="field">
                <label>कार्य विभाग</label>
                <select className="select">
                  <option value="">--कार्य विभाग चुने--</option>
                  <option>जिला पंचायत</option>
                  <option>राजस्व</option>
                  <option>जनपद</option>
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
                  <option>इंजिनियर A</option>
                  <option>इंजिनियर B</option>
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
                  <option>Suguja Chhetra Pradhikaran</option>
                  <option>Block Plan</option>
                </select>
              </div>
              <div className="field">
                <label>कार्य विवरण</label>
                <select className="select">
                  <option value="">--कार्य विवरण चुने--</option>
                  <option>नाली निर्माण</option>
                  <option>सड़क मरम्मत</option>
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
                onClick={() => setPage(1)}
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

              {/* Conditionally show Add button */}
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
            <div>कार्य सूची-({addButtonLabel})</div>
            <small>
              Show{" "}
              <select
                value={size}
                onChange={(e) => {
                  setSize(parseInt(e.target.value) || 10);
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
                          <button
                            className="icon-btn del"
                            type="button"
                            title="हटाएँ"
                            aria-label="हटाएँ"
                            onClick={() => deleteRow(r.id)}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
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
                        कोई रिकॉर्ड नहीं
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
          </div>
        </section>
      </div>
  <div className={"toast" + (toast? ' show':'')}>{toast||'\u00a0'}</div>

    </div>
  );
};

export default Table1;

