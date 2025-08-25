import React, { useState, useEffect } from "react";
import "./Category.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ic1 from "../../assets/Icons/Dug_Well.webp";
import ic2 from "../../assets/Icons/Post_Office2.webp";
import ic3 from "../../assets/Icons/Shed.webp";
import ic4 from "../../assets/Icons/community_center.webp";
import ic5 from "../../assets/Icons/pond_deepening1.webp";

const defaultCategories = [
  { id: 1, title: "Dug well", icon: ic1 },
  { id: 2, title: "Post office", icon: ic2 },
  { id: 3, title: "Shed", icon: ic3 },
  { id: 4, title: "Community Center", icon: ic4 },
  { id: 5, title: "Pond Deepening", icon: ic5 },
];

const GISType = ({ onLogout }) => {
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
              <div className="crumbs">GIS Work Type</div>
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
            <h2>Work Type</h2>
          </div>
        </div>

        <div className="wrap">
          <div className="category-container">
            <div className="category-card">
              {/* Header */}
              <div className="category-header">
                <h2>GIS Work Type</h2>
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
                    className="border"
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
                    <th className="w-full">Title</th>
                    <th className="min-w-sm">Icon</th>
                    <th className="min-w-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}.</td>
                      <td>{row.title}</td>
                      <td>
                        <img src={row.icon} className="h-10 w-10" />
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
  const [icon, setIcon] = useState(null); // store the selected image file
  const [preview, setPreview] = useState(null); // preview URL

  useEffect(() => {
    if (open) {
      setName("");
      setIcon(null);
      setPreview(null);
    }
  }, [open]);

  if (!open) return null;
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIcon(file);
      setPreview(URL.createObjectURL(file)); // temporary preview
    }
  };

  const handleSave = () => {
    // Pass the file or URL depending on your use case
    // onSave({ name, icon });
    setName("");
    setIcon(null);
    setPreview(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Add GIS Work Type</h2>

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

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Pick an Icon
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />

            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="Selected Icon"
                  className="w-10 h-10 object-cover rounded"
                />
              </div>
            )}
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

export default GISType;
