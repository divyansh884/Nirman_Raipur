// src/Components/YearlyTable.jsx
import React, { useState, useEffect } from "react";
import "./ReportsPage.css"; 


const YearlyTable = ({ title, rows }) => {
  const [data, setData] = useState(rows || []);
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pageRows, setPageRows] = useState([]);

  // pagination
  useEffect(() => {
    const start = (page - 1) * size;
    const end = start + size;
    setPageRows(data.slice(start, end));
  }, [data, page, size]);

  const totalPages = Math.ceil(data.length / size);

  return (
    <div className="work-ref">
      <div className="header">
        <div className="table-top">
          <div className="title">
            <h1>{title}</h1>
          </div>
        </div>
        <div className="subbar">
          <h2>{title}</h2>
        </div>
      </div>

      <div className="wrap">
        <section className="panel table-card">
          <div className="table-head">
            <div>{title}</div>
            <small>
              Show{" "}
              <select
                value={size}
                onChange={(e) => {
                  setSize(+e.target.value);
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
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>क्र.</th>
                    <th>वित्तीय वर्ष</th>
                    <th>कुल कार्य</th>
                    <th>आरंभ</th>
                    <th>निविदा स्तर पर</th>
                    <th>कार्य आदेश लंबित</th>
                    <th>कार्य आदेश जारी</th>
                    <th>कार्य प्रगति पर</th>
                    <th>कार्य पूर्ण</th>
                    <th>कार्य निरस्त</th>
                    <th>कार्य बंद</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr key={row.id}>
                      <td>{(page - 1) * size + i + 1}</td>
                      <td>{row.year}</td>
                      <td>{row.total}</td>
                      <td>{row.start}</td>
                      <td>{row.tender}</td>
                      <td>{row.orderPending}</td>
                      <td>{row.orderIssued}</td>
                      <td>{row.progress}</td>
                      <td>{row.completed}</td>
                      <td>{row.cancelled}</td>
                      <td>{row.closed}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center", padding: 30 }}>
                        कोई रिकॉर्ड नहीं
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1}>
                First
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                Last
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default YearlyTable;
