// src/components/AgencyReportTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./ReportsPage.css"; // reuse same CSS

const STORAGE_KEY = "agency_report_data_v1";
const defaultRows = [
  {
    id: 1,
    name: "जनपद पंचायत बगीचा",
    total: 27,
    start: 0,
    tender: 0,
    pending: 27,
    issued: 0,
    progress: 0,
    completed: 0,
    cancelled: 0,
    closed: 0,
  },
  {
    id: 2,
    name: "जनपद पंचायत फरसाबहार",
    total: 1,
    start: 0,
    tender: 0,
    pending: 0,
    issued: 0,
    progress: 1,
    completed: 0,
    cancelled: 0,
    closed: 0,
  },
  {
    id: 3,
    name: "जनपद पंचायत पटेलगाँव",
    total: 5,
    start: 0,
    tender: 0,
    pending: 5,
    issued: 0,
    progress: 0,
    completed: 0,
    cancelled: 0,
    closed: 0,
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

const Report2 = () => {
  const [data, setData] = useState(loadData());
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const A = a[sortKey] ?? "";
      const B = b[sortKey] ?? "";
      if (!isNaN(+A) && !isNaN(+B))
        return sortDir === "asc" ? +A - +B : +B - +A;
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  // Pagination
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const start = (page - 1) * size;
  const pageRows = sorted.slice(start, start + size);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  // Delete
  function deleteRow(id) {
    if (!window.confirm("क्या आप हटाना चाहते हैं?")) return;
    setData(data.filter((r) => r.id !== id));
  }

  // CSV Export
  function exportCSV() {
    const rows = data.map((r) => [
      r.name,
      r.total,
      r.start,
      r.tender,
      r.pending,
      r.issued,
      r.progress,
      r.completed,
      r.cancelled,
      r.closed,
    ]);
    let csv =
      "एजेंसी,कुल कार्य,आरंभ,निविदा स्तर,लंबित,जारी,प्रगति,पूर्ण,निरस्त,बंद\n";
    rows.forEach((r) => {
      csv +=
        r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",") +
        "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agency_report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const keyMap = [
    "id",
    "name",
    "total",
    "start",
    "tender",
    "pending",
    "issued",
    "progress",
    "completed",
    "cancelled",
    "closed",
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

  return (
    <div className="work-ref">
      <div className="header">
        <div className="table-top">
          <div className="title">
            <h1>एजेंसीवार रिपोर्ट</h1>
          </div>
        </div>
        <div className="subbar">
          <span className="dot" />
          <h2>एजेंसी सूची</h2>
        </div>
      </div>

      <div className="wrap">
        <section className="panel table-card">
          <div className="table-head">
            <div>एजेंसी सूची</div>
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
              {/* 🔹 Removed Search input */}
              <button className="btn dark" type="button" onClick={exportCSV}>
                CSV एक्सपोर्ट
              </button>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "क्र.",
                      "एजेंसी का नाम",
                      "कुल कार्य",
                      "आरंभ",
                      "निविदा स्तर",
                      "लंबित",
                      "जारी",
                      "प्रगति",
                      "पूर्ण",
                      "निरस्त",
                      "बंद",
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
                  {pageRows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{start + i + 1}</td>
                      <td>{r.name}</td>
                      <td>{r.total}</td>
                      <td>{r.start}</td>
                      <td>{r.tender}</td>
                      <td>{r.pending}</td>
                      <td>{r.issued}</td>
                      <td>{r.progress}</td>
                      <td>{r.completed}</td>
                      <td>{r.cancelled}</td>
                      <td>{r.closed}</td>
                      <td>
                        <div className="row-actions">
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
                      <td colSpan={12} style={{ textAlign: "center", padding: 30 }}>
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
                  (p) => p >= Math.max(1, page - 2) && p <= Math.min(pages, page + 2)
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
                onClick={() => page < pages && setPage((p) => Math.min(pages, p + 1))}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Report2;
