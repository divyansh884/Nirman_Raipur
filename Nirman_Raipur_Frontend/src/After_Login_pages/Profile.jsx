import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/useAuthStore.js';
import TopBar from '../Components/TopBar.jsx';
import './Profile.css';
import { BASE_SERVER_URL } from '../constants.jsx';
import defaultProfileAvatar from '../assets/defaultProfileAvatar';

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, canAccessPage } = useAuthStore();
  
  // State management
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    profilePhoto: null
  });

  // Check authentication and fetch profile
  useEffect(() => {
    if (!isAuthenticated || !token) {
      alert("प्रमाणीकरण आवश्यक है। कृपया लॉगिन करें।");
      navigate('/login');
      return;
    }

    if (!canAccessPage('profile')) {
      alert("आपके पास इस पेज तक पहुंचने की अनुमति नहीं है।");
      navigate('/dashboard');
      return;
    }

    fetchUserProfile();
  }, [isAuthenticated, token, navigate, canAccessPage]);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BASE_SERVER_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile data:', result);

      if (result.success && result.data && result.data.user) {
        const user = result.data.user;
        setUserProfile(user);
        
        // Initialize form data
        setFormData({
          fullName: user.fullName || '',
          email: user.email || '',
          contactNumber: user.contactNumber || '',
          profilePhoto: null
        });
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  // const handleInputChange = (e) => {
  //   const { name, value, files } = e.target;
    
  //   if (name === 'profilePhoto' && files) {
  //     setFormData(prev => ({
  //       ...prev,
  //       profilePhoto: files[0]
  //     }));
  //   } else {
  //     setFormData(prev => ({
  //       ...prev,
  //       [name]: value
  //     }));
  //   }
  // };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!userProfile) return;

    try {
      setUpdating(true);
      
      // Create FormData for file upload
      const updateData = new FormData();
      updateData.append('fullName', formData.fullName);
      updateData.append('email', formData.email);
      updateData.append('contactNumber', formData.contactNumber);
      
      if (formData.profilePhoto) {
        updateData.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch(`${BASE_SERVER_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: updateData
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('प्रोफाइल सफलतापूर्वक अपडेट हो गया!');
        // Refresh profile data
        fetchUserProfile();
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (err) {
      console.error('Error updating profile:', err);
      alert(`प्रोफाइल अपडेट करने में त्रुटि: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="profile-page">
        <div className="main-content">
           <div className='header'>
          <TopBar onLogout={onLogout} />
        </div>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>प्रोफाइल लोड हो रहा है...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-page">
        <div className="main-content">
           <div className='header'>
        <TopBar onLogout={onLogout} />
      </div>
          <div className="error-container">
            <h3>त्रुटि</h3>
            <p>{error}</p>
            <button onClick={fetchUserProfile} className="retry-btn">
              पुनः प्रयास करें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile data
  if (!userProfile) {
    return (
      <div className="profile-page">
        <div className="main-content">
           <div className='header'>
        <TopBar onLogout={onLogout} />
      </div>
          <div className="no-data-container">
            <p>प्रोफाइल डेटा उपलब्ध नहीं है।</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      
      <div className="main-content">
         <div className='header'>
        <TopBar onLogout={onLogout} />
      </div>
        <div className="profile-container">
          {/* Left Profile Details */}
          <div className="profile-details">
            <div className="section-header">
              <h3>Profile Details</h3>
            </div>
            
            <div className="profile-avatar">
              <img 
                src={userProfile.profilePhoto || defaultProfileAvatar} 
                alt="Profile avatar" 
              />
            </div>
            
            <h3 className="profile-name">{userProfile.fullName || 'N/A'}</h3>
            
            <table className="profile-table">
              <tbody>
                <tr>
                  <td>Login ID</td>
                  <td className="profile-value">{userProfile.username || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Office</td>
                  <td>{userProfile.department?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Mobile No</td>
                  <td>{userProfile.contactNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>{userProfile.email || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Update Profile */}
          <div className="update-profile">
            <div className="section-header">
              <h3>Profile</h3>
            </div>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>नाम *</label>
                <input disabled
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  placeholder="नाम दर्ज करें"
                  required
                />
              </div>

              <div className="form-group">
                <label>ईमेल *</label>
                <input disabled
                  type="email" 
                  name="email"
                  value={formData.email}
                  placeholder="ईमेल दर्ज करें"
                />
              </div>

              <div className="form-group">
                <label>मोबाइल नं. *</label>
                <input disabled
                  type="tel" 
                  name="contactNumber"
                  value={formData.contactNumber}
                  placeholder="मोबाइल नंबर दर्ज करें"
                  required
                />
              </div>

              <div className="form-group">
                <label>अपलोड प्रोफाइल फोटो</label>
                <div className="file-input-container">
                  <input disabled
                    type="file" 
                    name="profilePhoto"
                    accept="image/*"
                    id="profilePhoto"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>कार्य विभाग *</label>
                <select disabled>
                  <option>{userProfile.department?.name || 'N/A'}</option>
                </select>
              </div>

              <div className="form-group">
                <label>स्वीकृतकर्ता विभाग *</label>
                <select disabled>
                  <option>--स्वीकृतकर्ता विभाग चुने--</option>
                </select>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
