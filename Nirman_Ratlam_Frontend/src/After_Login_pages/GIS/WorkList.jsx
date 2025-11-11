import React, { useState, useEffect } from "react";
import "./WorkList.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultWorks = [
  {
    id: 1,
    category: "Proposed Work",
    workName: "पुलिया निर्माण",
    block: "Patthalgaon",
    gramPanchayat: "Mudapara",
    sanctionYear: 2024,
    sanctionAmount: 800000,
  },
  {
    id: 2,
    category: "Ongoing Work",
    workName: "तालाब गहरीकरण",
    block: "Pharsabahar",
    gramPanchayat: "Purain Bandh",
    sanctionYear: 2023,
    sanctionAmount: 600000,
  },
  {
    id: 3,
    category: "Existing Work",
    workName: "विद्यालय भवन",
    block: "Bagicha",
    gramPanchayat: "Jhalapara",
    sanctionYear: 2022,
    sanctionAmount: 500000,
  },
];

const WorkList = ({ onLogout }) => {
  const [data, setData] = useState(defaultWorks);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = data.filter((row) =>
    row.workName.toLowerCase().includes(search.toLowerCase())
  );

  // Load fonts/icons
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
        'link[href*="Noto+Sans+Devanagari"], link[data-noto]'
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
      <WorkDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <div className="work-details-ref">
        <div className="header">
          <div className="top">
            <div>
              <div className="crumbs">Work List</div>
              <div className="title">
                <h1>कार्य सूची</h1>
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
            <h2>Work</h2>
          </div>
        </div>

        <div className="wrap">
          <div className="category-container">
            <div className="category-card">
              {/* Header */}
              <div className="category-header">
                <h2>Work List</h2>
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
                    placeholder="Search by work name"
                  />
                </label>
              </div>

              {/* Table */}
              <table className="category-table">
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>Category</th>
                    <th>Work Name</th>
                    <th>Block</th>
                    <th>Gram Panchayat</th>
                    <th>Sanction Year</th>
                    <th>Sanction Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.category}</td>
                      <td>{row.workName}</td>
                      <td>{row.block}</td>
                      <td>{row.gramPanchayat}</td>
                      <td>{row.sanctionYear}</td>
                      <td>{row.sanctionAmount}</td>
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

function WorkDialog({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  if (!open) return null;

  const handleSave = () => {
    // onSave({ name, category, amount });
    setName("");
    setCategory("");
    setAmount("");
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
        <h2 className="text-xl font-semibold mb-4">Add Work</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Work Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter work name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sanction Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

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

export default WorkList;
