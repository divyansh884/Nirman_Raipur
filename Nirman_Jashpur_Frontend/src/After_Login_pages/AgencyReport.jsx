// src/pages/AgencyReports.jsx
import React from "react";
import AgencyReportTable from "./Reports/AgencyReportTable";

const AgencyReports = () => {
  const agencyData = [
    { name: "जनपद पंचायत बगीचा", total: 27, start: 0, tender: 0, pending: 27, issued: 0, progress: 0, completed: 0, cancelled: 0, closed: 0 },
    { name: "जनपद पंचायत फरसाबहार", total: 1, start: 0, tender: 0, pending: 0, issued: 0, progress: 1, completed: 0, cancelled: 0, closed: 0 },
    { name: "जनपद पंचायत पटेलगाँव", total: 5, start: 0, tender: 0, pending: 5, issued: 0, progress: 0, completed: 0, cancelled: 0, closed: 0 },
    { name: "जनपद पंचायत तुलडुला", total: 2, start: 0, tender: 0, pending: 2, issued: 0, progress: 0, completed: 0, cancelled: 0, closed: 0 },
    { name: "जनपद पंचायत जशपुर", total: 10, start: 0, tender: 0, pending: 10, issued: 0, progress: 0, completed: 0, cancelled: 0, closed: 0 },
    { name: "जनपद पंचायत कुनकुरी", total: 6, start: 0, tender: 0, pending: 6, issued: 0, progress: 0, completed: 0, cancelled: 0, closed: 0 },
  ];

  return <AgencyReportTable data={agencyData} />;
};

export default AgencyReports;
