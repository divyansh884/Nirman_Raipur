import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const getIcon = (type) =>
  L.icon({
    iconUrl: `../../assets/Icons/${type.replace(/\s+/g, "_").toLowerCase()}.webp`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

export default function WorksMap() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [filters, setFilters] = useState({
    block: "",
    gramPanchayat: "",
    category: "",
    workType: "",
  });

  const fetchWorks = async () => {
    setLoading(true);
    try {
      // 🔹 build query string from filters
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:5000/api/work-proposals?${params}`);
      const json = await res.json();
      setWorks(json.data || []);
    } catch (err) {
      console.error("API fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // optional: fetch initial works on mount
  useEffect(() => {
    fetchWorks();
  }, []);

  return (
    <div>
      {/* Top Filter Bar */}
      <div className="bg-blue-50 p-4 rounded-xl shadow mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.block}
            onChange={(e) => setFilters({ ...filters, block: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-800 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            className="px-3 py-2 rounded-lg border border-gray-800 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            className="px-3 py-2 rounded-lg border border-gray-800 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            className="px-3 py-2 rounded-lg border border-gray-800 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
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
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Map + Legend */}
      <div style={{ display: "flex" }}>
        {loading ? (
          <p>Loading map data...</p>
        ) : (
          <MapContainer
            center={[21.25, 81.62]} // default Raipur
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
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ maxWidth: "220px" }}>
                    <strong>{work.nameOfWork}</strong>
                    <br />
                    <em>{work.typeOfWork}</em>
                    <br />
                    Status: {work.currentStatus}
                    <br />
                    Agency: {work.workAgency}
                    <br />₹ {work.sanctionAmount?.toLocaleString()}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div style={{ marginLeft: "10px", width: "250px" }}>
          <h4>Legend</h4>
          {[...new Set(works.map((w) => w.typeOfWork))].map((type) => (
            <div
              key={type}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <img
                src={`/icons/${type.replace(/\s+/g, "_").toLowerCase()}.png`}
                alt={type}
                width={20}
                height={20}
                style={{ marginRight: "6px" }}
              />
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
