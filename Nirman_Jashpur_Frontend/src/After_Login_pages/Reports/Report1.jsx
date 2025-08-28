// FinancialYearReport.js
import React, { useState } from "react";
import { fetchReport } from "./api"; // See previous API utility
import { downloadExcel } from "./excelDownload"; // See previous Excel utility

const tableHeaders = [
  "क्र.",           // S. No.
  "वित्तीय वर्ष",   // Financial Year
  "कुल कार्य",      // Total Works
  "अप्रारंभ",      // Not Started
  "निविदा स्तर पर", // At Tender Level
  "कार्य आदेश लंबित", // Work Order Pending
  "कार्य आदेश जारी", // Work Order Issued
  "कार्य प्रगति पर", // Work In Progress
  "कार्य पूर्ण",     // Work Completed
  "कार्य निरस्त",    // Work Cancelled
  "कार्य बंद",      // Work Closed
];

function FinancialYearReport({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    // Example call: you may adjust the API endpoint/params as needed
    const result = await fetchReport("financial", {}, token);
    if (result.success) {
      setData([
        {
          financialYear: "2024-25",
          totalWorks: 49,
          notStarted: 0,
          tenderLevel: 0,
          workOrderPending: 42,
          workOrderIssued: 0,
          inProgress: 7,
          completed: 0,
          cancelled: 0,
          closed: 0,
        },
        {
          financialYear: "2022-23",
          totalWorks: 2,
          notStarted: 0,
          tenderLevel: 0,
          workOrderPending: 2,
          workOrderIssued: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          closed: 0,
        },
      ]);
      // Use real data from result.data instead of above static array
    }
    setLoading(false);
  }

  function handleExportExcel() {
    downloadExcel(data, "FinancialYearReport.xlsx");
  }

  React.useEffect(() => {
    loadReport();
  }, []);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      maxWidth: "900px",
      margin: "32px auto",
      overflow: "hidden"
    }}>
      <div style={{ background: "#003D7C", padding: "16px", color: "#fff", fontWeight: 600, fontSize: "20px" }}>
        वित्तीय वर्ष सूची
        <div style={{ float: 'right' }}>
          <button
            style={{
              background: "#FFB400",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 24px",
              marginRight: "8px",
              fontWeight: 500,
              cursor: "pointer"
            }}
            onClick={handleExportExcel}
          >
            &#128190; Excel Export
          </button>
          <button
            style={{
              background: "#FFA400",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 24px",
              fontWeight: 500,
              cursor: "pointer"
            }}
            onClick={handleExportExcel}
          >
            &#8681; Download
          </button>
        </div>
      </div>
      <div style={{ padding: "12px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#AF872C", color: "#fff" }}>
              {tableHeaders.map((header, idx) => (
                <th key={idx} style={{
                  padding: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                  border: "1px solid #dfdfdf",
                  fontSize: "15px",
                  minWidth: "60px"
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={tableHeaders.length} style={{ textAlign: "center", padding: "36px" }}>Loading...</td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  <td style={cellStyle}>{idx + 1}</td>
                  <td style={cellStyle}>{row.financialYear}</td>
                  <td style={cellStyle}>{row.totalWorks}</td>
                  <td style={cellStyle}>{row.notStarted}</td>
                  <td style={cellStyle}>{row.tenderLevel}</td>
                  <td style={cellStyle}>{row.workOrderPending}</td>
                  <td style={cellStyle}>{row.workOrderIssued}</td>
                  <td style={cellStyle}>{row.inProgress}</td>
                  <td style={cellStyle}>{row.completed}</td>
                  <td style={cellStyle}>{row.cancelled}</td>
                  <td style={cellStyle}>{row.closed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "10px",
  textAlign: "center",
  border: "1px solid #dfdfdf",
  background: "#fff",
  fontSize: "15px"
};

export default FinancialYearReport;