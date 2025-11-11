import React, { useState, useEffect } from "react";
import "./Category.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultCategories = [
  { id: 1, title: "Proposed work", color: "#8000ff" },
  { id: 2, title: "Ongoing work", color: "#00cfff" },
  { id: 3, title: "Existing work", color: "#ff00ff" },
];

const GISCategory = ({ onLogout }) => {
  const [data, setData] = useState(defaultCategories);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = data.filter((row) =>
    row.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Load Font Awesome and fonts - this useEffect must come before any conditional returns
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
    <>
      <CategoryDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">GIS Category</div>
              <div className="title">
                <h1>निर्माण</h1>
              </div>
            </div>
            <div className="user">
              <div className="ic" tabIndex={0} aria-label="User profile">
                <i className="fa-solid fa-user" />
              </div>
              <button
                className="logout"
                aria-label="Logout"
                type="button"
                onClick={
                  onLogout ||
                  (() => {
                    if (window.confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
                      window.location.href = "/";
                    }
                  })
                }
              >
                <i className="fa-solid fa-power-off" />
              </button>
            </div>
          </div>
          <div className="subbar">
            <h2>Category</h2>
          </div>
        </div>

        <div className="wrap">
          <div className="category-container">
            <div className="category-card">
              {/* Header */}
              <div className="category-header">
                <h2>Category</h2>
                <button onClick={() => setNewOpen(true)} className="btn green">
                  Add New
                </button>
              </div>

              {/* Top Controls */}
              <div className="controls">
                <label>
                  Show{" "}
                  <select>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>{" "}
                  entries
                </label>
                <label>
                  Search:{" "}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder=""
                  />
                </label>
              </div>

              {/* Table */}
              <table className="category-table">
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>Category Title</th>
                    <th>Color</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.title}</td>
                      <td>
                        <div
                          style={{
                            width: 30,
                            height: 20,
                            backgroundColor: row.color,
                            borderRadius: 4,
                          }}
                        />
                      </td>
                      <td>
                        <button className="btn small blue">Edit</button>
                        <button className="btn small red">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="flex justify-end">
                <div className="space-y-1">
                  <div className="flex justify-end items-center">
                    <button className="cursor-pointer text-black">
                      <ChevronLeft />
                    </button>
                    <span className="text-center">1</span>
                    <button className="cursor-pointer text-black">
                      <ChevronRight />
                    </button>
                  </div>
                  <span>
                    Showing {filtered.length} of {data.length} entries
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function CategoryDialog({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");

  if (!open) return null; // don't render when closed

  const handleSave = () => {
    // onSave({ name, color });
    setName("");
    setColor("#000000");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Add Category</h2>

        <div className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Pick a Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer border rounded"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default GISCategory;
