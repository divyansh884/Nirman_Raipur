
import React from "react";
import "./Profile.css";
import { Link } from "react-router-dom";
import Table from "../Components/Table";
import { FaPowerOff } from "react-icons/fa";
import defaultProfileAvatar from "../assets/defaultProfileAvatar";

const Profile = () => {
  return (
    <div className="profile-page">
      <div className="main-content">
        <div className="header">
          <div className="table-top">
            <div>
              <div className="crumbs" id="crumbs">Dashboard / Profile</div>
              <div className="title"><h1 id="pageTitle">निर्माण</h1></div>
            </div>
            <div className="user">
              <button
                className="ic"
                tabIndex={0}
                aria-label="User profile"
                type="button"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                <i className="fa-solid fa-user" />
              </button>
              <button
                className="logout"
                aria-label="Logout"
                type="button"
                onClick={() => {
                  if (window.confirm('क्या आप लॉगआउट करना चाहते हैं?')) {
                    window.location.href = '/';
                  }
                }}
              >
                <i className="fa-solid fa-power-off" />
              </button>
            </div>
          </div>
          <div className="subbar"><span className="dot" /><h2>प्रोफाइल</h2></div>
        </div>
        <div className="profile-container">
          {/* Left Profile Details */}
          <div className="profile-details">
            <div className="profile-avatar" style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: '#e6eaf3',
              margin: '18px auto 8px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.04)'
            }}>
              <img src={defaultProfileAvatar} alt="Default avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            </div>
            <h3 style={{color: "#1976d2", marginTop: "10px", textAlign: "center"}}>Tribal Department</h3>
            <table>
              <tbody>
                <tr>
                  <td style={{fontWeight: "bold"}}>Login ID</td>
                  <td style={{fontWeight: "bold", color: "#222"}}>ACTRIBAL</td>
                </tr>
                <tr>
                  <td>Office</td>
                  <td>आदिवासी विकास विभाग, जशपुर</td>
                </tr>
                <tr>
                  <td>Mobile No</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Right Update Profile */}
          <div className="update-profile">
            <form>
              <label>नाम *</label>
              <input type="text" defaultValue="Tribal Department" />

              <label>ईमेल</label>
              <input type="text" />

              <label>मोबाइल नं. *</label>
              <input type="text" />

              <label>अपलोड प्रोफाइल फोटो</label>
              <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                <input type="file" style={{flex: 1}} />
                <span style={{fontSize: "13px", color: "#888"}}>No file chosen</span>
              </div>

              <label>कार्यालय विभाग</label>
              <select>
                <option>आदिवासी विकास विभाग, जशपुर</option>
              </select>

              <label>स्वीकृतकर्ता विभाग *</label>
              <select>
                <option>--स्वीकृतकर्ता विभाग चुने--</option>
              </select>

              <button type="submit" className="update-btn" style={{marginTop: "10px"}}>Update</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
