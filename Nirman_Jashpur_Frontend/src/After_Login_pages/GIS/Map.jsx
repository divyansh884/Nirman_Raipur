import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Dynamically load icons from /src/assets/Icons
const getIcon = (type) =>
  L.icon({
    iconUrl: new URL(
      `../../assets/Icons/${type.replace(/\s+/g, "_").toLowerCase()}.webp`,
      import.meta.url
    ).href,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

export default function WorksMap() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    block: "",
    gramPanchayat: "",
    category: "",
    workType: "",
  });

  const authToken = localStorage.getItem("authToken");

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/work-proposals", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = await res.json();
      setWorks(json.data || []);
    } catch (err) {
      console.error("API fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  return (
    <div className="p-4">
      {/* 🔹 Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          🔍 Filter Works
        </h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.block}
            onChange={(e) => setFilters({ ...filters, block: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
          >
            <option value="">Select Block</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>

          <select
            value={filters.gramPanchayat}
            onChange={(e) =>
              setFilters({ ...filters, gramPanchayat: e.target.value })
            }
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
          >
            <option value="">Select Gram Panchayat</option>
            <option value="GP 1">Gram Panchayat 1</option>
            <option value="GP 2">Gram Panchayat 2</option>
            <option value="GP 3">Gram Panchayat 3</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
          >
            <option value="">Select Category</option>
            <option value="Road">Road</option>
            <option value="Water">Water</option>
            <option value="Health">Health</option>
          </select>

          <select
            value={filters.workType}
            onChange={(e) =>
              setFilters({ ...filters, workType: e.target.value })
            }
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
          >
            <option value="">Select Work Type</option>
            <option value="Construction">Construction</option>
            <option value="Repair">Repair</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={fetchWorks}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow"
          >
            Search
          </button>
          <button
            onClick={() =>
              setFilters({
                block: "",
                gramPanchayat: "",
                category: "",
                workType: "",
              })
            }
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 🔹 Map + Legend */}
      <div className="flex">
        <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] text-gray-600">
              Loading map data...
            </div>
          ) : (
            <MapContainer
              center={[21.25, 81.62]} // Raipur default
              zoom={12}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {works.map((work) => (
                <Marker
                  key={work._id}
                  position={[work.latitude, work.longitude]}
                  icon={getIcon(work.typeOfWork)}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
  <div className="max-w-[220px] max-h-[150px] overflow-y-auto break-words text-sm p-1">
    <p className="font-bold">{work.nameOfWork}</p>
    <p className="italic text-gray-600">{work.typeOfWork}</p>
    <p>Status: {work.currentStatus}</p>
    <p>Agency: {work.workAgency}</p>
    <p className="font-semibold text-blue-700">
      ₹ {work.sanctionAmount?.toLocaleString()}
    </p>
  </div>
</Tooltip>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* 🔹 Legend */}
        <div className="ml-4 w-60 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <h4 className="text-lg font-semibold mb-3">📌 Legend</h4>
          {[...new Set(works.map((w) => w.typeOfWork))].map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700"
            >
              <img
                src={
                  new URL(
                    `../../assets/Icons/${type.replace(/\s+/g, "_").toLowerCase()}.webp`,
                    import.meta.url
                  ).href
                }
                alt={type}
                className="w-6 h-6"
              />
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}