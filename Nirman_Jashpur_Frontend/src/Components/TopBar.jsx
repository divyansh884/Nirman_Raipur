import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const TopBar = ({onLogout}) => {
    const navigate = useNavigate();
      const location = useLocation();
       const params = useParams();

      // Build crumbs from current path
      const crumbs = React.useMemo(() => {
        const parts = location.pathname
          .split("/")
          .filter(Boolean)
          .map((s) =>
            s.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
          );
        return [...parts].join(" / ");
      }, [location.pathname]);
    return (
        <div className="top">
          <div className="brand">
            <div className="crumbs" id="crumbs">
              {crumbs}
            </div>
            <h1>निर्माण</h1>
          </div>
          <div className="right-top">
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
              <button 
              className="logout" 
              aria-label="Logout" 
              type="button" 
              onClick={onLogout || (() => {
                if (window.confirm('क्या आप लॉगआउट करना चाहते हैं?')) {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("userData");
                  window.location.href = '/';
                }
              })}
            >
                <i className="fa-solid fa-power-off" />
              </button>
            </div>
          </div>
        </div>
    );
};



export default TopBar;