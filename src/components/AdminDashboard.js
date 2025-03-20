import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import logo from '../assets/logo.png';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref as dbRef, onValue, push, update, remove, query, limitToFirst, orderByKey, startAfter } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { Bell, User } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const AdminDashboard = ({ user }) => {
  const [allRequests, setAllRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceDetails, setResourceDetails] = useState('');
  const [resourceType, setResourceType] = useState('pdf');
  const [file, setFile] = useState(null);
  const [contentUrl, setContentUrl] = useState('');
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editResourceId, setEditResourceId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pagination states
  const pageSize = 5; // Increment/decrement by 5 items
  const [displayedResources, setDisplayedResources] = useState([]); // Currently shown resources
  const [displayedRequests, setDisplayedRequests] = useState([]); // Currently shown requests
  const [resourceKeys, setResourceKeys] = useState([]); // All resource keys
  const [requestKeys, setRequestKeys] = useState([]); // All request keys
  const [resourceLastKey, setResourceLastKey] = useState(null); // Last fetched resource key
  const [requestLastKey, setRequestLastKey] = useState(null); // Last fetched request key
  const [totalResources, setTotalResources] = useState(0); // Total resources
  const [totalRequests, setTotalRequests] = useState(0); // Total requests

  useEffect(() => {
    addLog('Component mounted');
    setLoading(true);

    // Fetch all resource keys and initial data
    const resourcesRef = dbRef(db, 'resources');
    const initialResourceQuery = query(resourcesRef, orderByKey(), limitToFirst(pageSize));
    onValue(resourcesRef, (snapshot) => {
      const data = snapshot.val();
      const keys = data ? Object.keys(data).sort() : [];
      setResourceKeys(keys);
      setTotalResources(keys.length);
    }, { onlyOnce: true });
    onValue(initialResourceQuery, (snapshot) => {
      const data = snapshot.val();
      const resourceList = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            title: value.title || 'Untitled',
            description: value.description || '',
            type: value.type || 'unknown',
            content: value.content || '',
            status: value.status || 'available',
            createdAt: value.createdAt || '',
          }))
        : [];
      setDisplayedResources(resourceList);
      setResources(resourceList); // Keep full list for analytics
      setResourceLastKey(resourceList[resourceList.length - 1]?.id || null);
      checkLoadingComplete(resourceList, displayedRequests);
    }, (error) => {
      setError('Failed to load resources: ' + error.message);
      setLoading(false);
    });

    // Fetch all request keys and initial data
    const requestsRef = dbRef(db, 'requests');
    const initialRequestQuery = query(requestsRef, orderByKey(), limitToFirst(pageSize));
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      const keys = data ? Object.keys(data).sort() : [];
      setRequestKeys(keys);
      setTotalRequests(keys.length);
    }, { onlyOnce: true });
    onValue(initialRequestQuery, (snapshot) => {
      const data = snapshot.val();
      const requestList = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            userId: value.userId || 'Unknown User',
            resourceId: value.resourceId || 'Unknown Resource',
            status: value.status || 'pending',
            timestamp: value.timestamp || 'Unknown Time',
          }))
        : [];
      setDisplayedRequests(requestList);
      setAllRequests(requestList); // Keep full list for analytics
      setRequestLastKey(requestList[requestList.length - 1]?.id || null);
      checkLoadingComplete(displayedResources, requestList);
    }, (error) => {
      setError('Failed to load requests: ' + error.message);
      setLoading(false);
    });
  }, []);

  const loadMoreResources = () => {
    if (displayedResources.length >= totalResources) return;
    addLog('Loading more resources');
    const nextQuery = query(
      dbRef(db, 'resources'),
      orderByKey(),
      startAfter(resourceLastKey),
      limitToFirst(pageSize)
    );
    onValue(nextQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newResources = Object.entries(data).map(([id, value]) => ({
          id,
          title: value.title || 'Untitled',
          description: value.description || '',
          type: value.type || 'unknown',
          content: value.content || '',
          status: value.status || 'available',
          createdAt: value.createdAt || '',
        }));
        setDisplayedResources(prev => [...prev, ...newResources]);
        setResources(prev => [...prev, ...newResources]); // Update full list
        setResourceLastKey(newResources[newResources.length - 1]?.id || null);
      }
    }, { onlyOnce: true });
  };

  const loadLessResources = () => {
    if (displayedResources.length <= pageSize) return;
    addLog('Loading less resources');
    setDisplayedResources(prev => prev.slice(0, Math.max(pageSize, prev.length - pageSize)));
    setResourceLastKey(displayedResources[Math.max(pageSize - 1, displayedResources.length - pageSize - 1)]?.id || null);
  };

  const loadMoreRequests = () => {
    if (displayedRequests.length >= totalRequests) return;
    addLog('Loading more requests');
    const nextQuery = query(
      dbRef(db, 'requests'),
      orderByKey(),
      startAfter(requestLastKey),
      limitToFirst(pageSize)
    );
    onValue(nextQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newRequests = Object.entries(data).map(([id, value]) => ({
          id,
          userId: value.userId || 'Unknown User',
          resourceId: value.resourceId || 'Unknown Resource',
          status: value.status || 'pending',
          timestamp: value.timestamp || 'Unknown Time',
        }));
        setDisplayedRequests(prev => [...prev, ...newRequests]);
        setAllRequests(prev => [...prev, ...newRequests]); // Update full list
        setRequestLastKey(newRequests[newRequests.length - 1]?.id || null);
      }
    }, { onlyOnce: true });
  };

  const loadLessRequests = () => {
    if (displayedRequests.length <= pageSize) return;
    addLog('Loading less requests');
    setDisplayedRequests(prev => prev.slice(0, Math.max(pageSize, prev.length - pageSize)));
    setRequestLastKey(displayedRequests[Math.max(pageSize - 1, displayedRequests.length - pageSize - 1)]?.id || null);
  };

  const addLog = (message) => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message }]);
    console.log('AdminDashboard.js - Log:', message);
  };

  const addNotification = (message) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleApprove = async (id, userId, resourceId) => {
    try {
      await update(dbRef(db, `requests/${id}`), { status: 'approved' });
      addLog(`Request ${id} approved for user ${userId}`);
      addNotification(`Request ${id} approved`);
      setDisplayedRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
      setAllRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
    } catch (error) {
      setError('Failed to approve request: ' + error.message);
    }
  };

  const handleReject = async (id, userId, resourceId) => {
    try {
      await update(dbRef(db, `requests/${id}`), { status: 'rejected' });
      addLog(`Request ${id} rejected for user ${userId}`);
      addNotification(`Request ${id} rejected`);
      setDisplayedRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
      setAllRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
    } catch (error) {
      setError('Failed to reject request: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setContentUrl('');
    if (selectedFile) addLog(`File selected: ${selectedFile.name}`);
  };

  const handleUrlChange = (e) => {
    setContentUrl(e.target.value);
    setFile(null);
    addLog(`URL entered: ${e.target.value}`);
  };

  const handleAddResource = async () => {
    if (!resourceName) {
      setError('Please enter a resource name');
      return;
    }
    try {
      let content = '';
      if (resourceType === 'pdf' && file) {
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if ((resourceType === 'training' || resourceType === 'course') && contentUrl) {
        content = contentUrl;
      } else {
        setError('Please provide a file for PDF or a URL for training/course');
        return;
      }
      const newResource = {
        title: resourceName,
        description: resourceDetails,
        type: resourceType,
        status: 'available',
        content,
        createdAt: new Date().toISOString(),
      };
      const resourcesRef = dbRef(db, 'resources');
      const newResourceRef = await push(resourcesRef, newResource);
      addLog(`Resource added with ID: ${newResourceRef.key}`);
      addNotification(`Resource "${resourceName}" added`);
      setResourceKeys(prev => [...prev, newResourceRef.key].sort());
      setTotalResources(prev => prev + 1);
      setResourceName('');
      setResourceDetails('');
      setFile(null);
      setContentUrl('');
    } catch (error) {
      setError('Failed to add resource: ' + error.message);
    }
  };

  const handleEditResource = (resource) => {
    setEditResourceId(resource.id);
    setResourceName(resource.title);
    setResourceDetails(resource.description);
    setResourceType(resource.type);
    setContentUrl(resource.type !== 'pdf' ? resource.content : '');
    setFile(null);
    addLog(`Editing resource ${resource.id}`);
  };

  const handleSaveEdit = async () => {
    if (!resourceName) {
      setError('Resource name is required');
      return;
    }
    try {
      let content = resources.find(r => r.id === editResourceId).content;
      if (resourceType === 'pdf' && file) {
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if ((resourceType === 'training' || resourceType === 'course') && contentUrl) {
        content = contentUrl;
      }
      const updatedResource = {
        title: resourceName,
        description: resourceDetails,
        type: resourceType,
        status: 'available',
        content,
        createdAt: resources.find(r => r.id === editResourceId).createdAt,
      };
      await update(dbRef(db, `resources/${editResourceId}`), updatedResource);
      addLog(`Resource ${editResourceId} updated`);
      addNotification(`Resource "${resourceName}" updated`);
      setDisplayedResources(prev => prev.map(r => r.id === editResourceId ? { ...r, ...updatedResource } : r));
      setResources(prev => prev.map(r => r.id === editResourceId ? { ...r, ...updatedResource } : r));
      setEditResourceId(null);
      setResourceName('');
      setResourceDetails('');
      setFile(null);
      setContentUrl('');
    } catch (error) {
      setError('Failed to edit resource: ' + error.message);
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await remove(dbRef(db, `resources/${id}`));
      addLog(`Resource ${id} deleted`);
      addNotification(`Resource ${id} deleted`);
      setDisplayedResources(prev => prev.filter(r => r.id !== id));
      setResources(prev => prev.filter(r => r.id !== id));
      setResourceKeys(prev => prev.filter(k => k !== id));
      setTotalResources(prev => prev - 1);
      setResourceLastKey(displayedResources[displayedResources.length - 1]?.id || null);
    } catch (error) {
      setError('Failed to delete resource: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      setError('Logout failed: ' + error.message);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const filteredResources = displayedResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const barData = {
    labels: resources.map(r => r.title),
    datasets: [{ label: 'Requests', data: resources.map(r => allRequests.filter(req => req.resourceId === r.id).length), backgroundColor: 'rgba(75, 192, 192, 0.2)' }],
  };

  const pieData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [
        allRequests.filter(req => req.status === 'pending').length,
        allRequests.filter(req => req.status === 'approved').length,
        allRequests.filter(req => req.status === 'rejected').length,
      ],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  };

  const checkLoadingComplete = (res, reqs) => {
    if (res.length > -1 && reqs.length > -1) setLoading(false);
  };

  if (loading) {
    return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '20px', fontSize: '1.5rem' }}>Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <a href='LandingPage.js' className='logo-link'><img src={logo} className="logo" alt="CAPACITI logo" /></a>
        <h1 className="title">Resource Hub Dashboard</h1>
        <div className="user-info"><h2>Welcome, {user.name}!</h2><p>Role: {user.role}</p></div>
        <div className="user-controls">
          <button className="notification-button" onClick={toggleNotifications}>
            <Bell size={24} />
            {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <h3>Notifications</h3>
              {notifications.length > 0 ? notifications.map(notif => (
                <div key={notif.id} className="notification-item">{notif.message} - {notif.timestamp}</div>
              )) : <div className="notification-item">No notifications</div>}
            </div>
          )}
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      <nav className="navbar">
        <ul><li><Link to="/">Home</Link></li><li><Link to="/admin-dashboard">Resources</Link></li><li><Link to="/" onClick={handleLogout}>Logout</Link></li></ul>
      </nav>

      {error && <div className="error">{error}</div>}

      <div className="admin-controls">
        <h2>{editResourceId ? 'Edit Resource' : 'Manage Resources'}</h2>
        <input type="text" placeholder="Resource Name" value={resourceName} onChange={(e) => setResourceName(e.target.value)} />
        <input type="text" placeholder="Description" value={resourceDetails} onChange={(e) => setResourceDetails(e.target.value)} />
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="pdf">PDF</option><option value="training">Training</option><option value="course">Course</option>
        </select>
        {resourceType === 'pdf' ? (
          <input type="file" onChange={handleFileChange} accept=".pdf" />
        ) : (
          <input type="text" placeholder="Enter URL" value={contentUrl} onChange={handleUrlChange} />
        )}
        <button onClick={editResourceId ? handleSaveEdit : handleAddResource}>
          {editResourceId ? 'Save Changes' : 'Add Resource'}
        </button>
        {editResourceId && <button onClick={() => setEditResourceId(null)}>Cancel Edit</button>}
      </div>

      <div className="resources-list">
        <h2>Resources ({totalResources} total)</h2>
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Content</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredResources.map(resource => (
              <tr key={resource.id}>
                <td>{resource.title}</td>
                <td>{resource.type}</td>
                <td>{resource.status}</td>
                <td>{resource.type === 'pdf' ? (
                  <a href={resource.content} download={`${resource.title}.pdf`}>Download</a>
                ) : (
                  <a href={resource.content} target="_blank" rel="noopener noreferrer">Access</a>
                )}</td>
                <td>
                  <button onClick={() => handleEditResource(resource)}>Edit</button>
                  <button onClick={() => handleDeleteResource(resource.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination-controls">
          {displayedResources.length < totalResources && (
            <button className="load-more-button" onClick={loadMoreResources}>Load More</button>
          )}
          {displayedResources.length > pageSize && (
            <button className="load-less-button" onClick={loadLessResources}>Show Less</button>
          )}
        </div>
      </div>

      <div className="log-table">
        <h2>Action Logs</h2>
        <table>
          <thead><tr><th>Time</th><th>Message</th></tr></thead>
          <tbody>{logs.map((log, index) => <tr key={index}><td>{log.timestamp}</td><td>{log.message}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="pending-requests">
        <h2>All Requests ({totalRequests})</h2>
        <table>
          <thead><tr><th>User ID</th><th>Resource ID</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {displayedRequests.map(req => (
              <tr key={req.id}>
                <td>{req.userId}</td>
                <td>{req.resourceId}</td>
                <td>{req.status}</td>
                <td>
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => handleApprove(req.id, req.userId, req.resourceId)}>Approve</button>
                      <button onClick={() => handleReject(req.id, req.userId, req.resourceId)}>Reject</button>
                    </>
                  ) : req.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination-controls">
          {displayedRequests.length < totalRequests && (
            <button className="load-more-button" onClick={loadMoreRequests}>Load More</button>
          )}
          {displayedRequests.length > pageSize && (
            <button className="load-less-button" onClick={loadLessRequests}>Show Less</button>
          )}
        </div>
      </div>

      <div className="analytics-section">
        <h2>Analytics</h2>
        <div className="chart-container"><Bar data={barData} options={{ responsive: true }} /></div>
        <div className="chart-container"><Pie data={pieData} options={{ responsive: true }} /></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
