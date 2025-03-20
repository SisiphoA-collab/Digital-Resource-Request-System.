import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref as dbRef, get, set } from 'firebase/database';
import { updatePassword, signOut } from 'firebase/auth';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState('default-avatar.png');
  const [theme, setTheme] = useState('light');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const avatarOptions = [
    { name: 'Default', value: 'default-avatar.png' },
    { name: 'Cartoon Robot', value: 'Cartoon Style Robot.jpg' },
    { name: 'Gesturing Robot', value: 'robot-gesturing.jpg' },
  ];

  console.log('Profile.js - Received user prop:', user);

  useEffect(() => {
    console.log('Profile.js - useEffect triggered');
    const fetchProfile = async () => {
      try {
        if (!user || !user.uid) {
          console.error('Profile.js - No user or UID provided');
          setError('No user data available');
          return;
        }

        console.log('Profile.js - Fetching profile for UID:', user.uid);
        const userRef = dbRef(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val();
        console.log('Profile.js - Fetched data:', data);

        if (data) {
          setProfileData(data);
          setEditUsername(data.name || user.email.split('@')[0]);
          setAvatar(data.avatar || 'default-avatar.png');
          setTheme(data.theme || 'light');
          console.log('Profile.js - Profile data set:', data);
        } else {
          const defaultData = {
            name: user.email.split('@')[0],
            email: user.email,
            role: user.role,
            createdAt: new Date().toISOString(),
            avatar: 'default-avatar.png',
            theme: 'light',
          };
          console.log('Profile.js - No data found, using defaults:', defaultData);
          await set(userRef, defaultData);
          console.log('Profile.js - Default data saved to database');
          setProfileData(defaultData);
          setEditUsername(defaultData.name);
          setAvatar(defaultData.avatar);
          setTheme(defaultData.theme);
        }
      } catch (error) {
        console.error('Profile.js - Error fetching profile:', error.message);
        setError(`Failed to load profile: ${error.message}`);
        const fallbackData = {
          name: user?.email?.split('@')[0] || 'Unknown',
          email: user?.email || 'N/A',
          role: user?.role || 'user',
          createdAt: new Date().toISOString(),
          avatar: 'default-avatar.png',
          theme: 'light',
        };
        setProfileData(fallbackData);
        setEditUsername(fallbackData.name);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveUsername = async () => {
    try {
      console.log('Profile.js - Saving username:', editUsername);
      await set(dbRef(db, `users/${user.uid}`), {
        ...profileData,
        name: editUsername,
      });
      setProfileData({ ...profileData, name: editUsername });
      setIsEditing(false);
      console.log('Profile.js - Username saved successfully');
    } catch (error) {
      console.error('Profile.js - Error saving username:', error.message);
      setError(`Failed to save username: ${error.message}`);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      console.log('Profile.js - Updating password');
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword('');
      alert('Password updated successfully!');
      console.log('Profile.js - Password updated successfully');
    } catch (error) {
      console.error('Profile.js - Error updating password:', error.message);
      alert(`Failed to update password: ${error.message}`);
    }
  };

  const handleSaveCustomization = async () => {
    try {
      console.log('Profile.js - Saving customization:', { avatar, theme });
      await set(dbRef(db, `users/${user.uid}`), {
        ...profileData,
        avatar,
        theme,
      });
      console.log('Profile.js - Customization saved successfully');
      alert('Profile customization saved!');
    } catch (error) {
      console.error('Profile.js - Error saving customization:', error.message);
      setError(`Failed to save customization: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Profile.js - Logging out');
      await signOut(auth);
      console.log('Profile.js - Logout successful');
      navigate('/auth');
    } catch (error) {
      console.error('Profile.js - Logout error:', error.message);
    }
  };

  const handleBackToDashboard = () => {
    console.log('Profile.js - Navigating back to dashboard');
    navigate(user.role === 'admin' ? '/admin-dashboard' : '/dashboard');
  };

  if (!profileData) {
    console.log('Profile.js - Profile data not loaded yet');
    return <div>Loading profile...</div>;
  }

  console.log('Profile.js - Rendering with profileData:', profileData);

  return (
    <div className={`dashboard-container ${theme}`}>
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'}>Dashboard</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
        </ul>
      </nav>
      <div className="profile-details">
        <h1>Profile</h1>
        {error && <p className="error">{error}</p>}
        <div className="user-info">
          <div className="status">Status: <span className="active">Active</span></div>
          <div className="info-row">
            <strong>Username: </strong>
            {isEditing ? (
              <div className="edit-row">
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
                <button onClick={handleSaveUsername}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div className="edit-row">
                <span>{profileData.name}</span>
                <button onClick={() => setIsEditing(true)}>Edit</button>
              </div>
            )}
          </div>
          <p><strong>Email:</strong> {profileData.email}</p>
          <div className="info-row">
            <strong>Password:</strong> ********
            <div className="edit-row">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button onClick={handleUpdatePassword} disabled={!newPassword}>Update Password</button>
            </div>
          </div>
          <p><strong>Role:</strong> {profileData.role}</p>
          <p><strong>Joined:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="customization">
          <h2>Customize Profile</h2>
          <div className="customization-row">
            <label>Avatar:</label>
            <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
              {avatarOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
            <img src={`/avatars/${avatar}`} alt="Avatar" className="avatar-preview" />
          </div>
          <div className="customization-row">
            <label>Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="blue">Blue</option>
            </select>
          </div>
          <button onClick={handleSaveCustomization}>Save Customization</button>
        </div>
        <div className="back-button-container">
          <button onClick={handleBackToDashboard} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;