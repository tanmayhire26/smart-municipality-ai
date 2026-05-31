import React, { useState, useEffect } from 'react';
import { Sparkles, Menu } from 'lucide-react';

// Custom components
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DemoConsole } from './components/DemoConsole';

// Custom pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { NewComplaintPage } from './pages/NewComplaintPage';
import { MapTrackerPage } from './pages/MapTrackerPage';
import { AdminPage } from './pages/AdminPage';

// Shared types
import { DemoUser, Complaint, HistoryItem, Ward, BackendStatuses, Metrics } from './types';

// Service configurations
const USER_SERVICE_URL = 'http://localhost:3001';
const COMPLAINT_SERVICE_URL = 'http://localhost:3002';
const FILE_UPLOAD_SERVICE_URL = 'http://localhost:3003';

export function App() {
  // Global & Demo state contexts
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [activeUser, setActiveUser] = useState<DemoUser | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [wards, setWards] = useState<Ward[]>([]);
  
  // Navigation & Drawer states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-complaint' | 'map-view' | 'admin'>('dashboard');
  const [demoPanelOpen, setDemoPanelOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // DemoConsole quick fill state passing to LoginPage
  const [demoFillEmail, setDemoFillEmail] = useState<string>('');
  const [demoFillRole, setDemoFillRole] = useState<string>('');

  // Active loaded data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedComplaintHistory, setSelectedComplaintHistory] = useState<HistoryItem[]>([]);
  const [workersList, setWorkersList] = useState<DemoUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0, active: 0, resolved: 0, escalated: 0
  });

  const [backendStatuses, setBackendStatuses] = useState<BackendStatuses>({
    user: 'checking',
    complaint: 'checking',
    upload: 'checking'
  });

  // 1. Lifecycle Check: Initial Setup
  useEffect(() => {
    verifyBackends();
    fetchInitialData();
    restoreSession();
  }, []);

  // 2. Refresh Dashboards whenever user switches or tab updates
  useEffect(() => {
    if (activeUser) {
      fetchDashboardData();
    }
  }, [activeUser, activeTab]);

  // 3. Keep complaint details synced if an ID is active
  useEffect(() => {
    if (selectedComplaintId) {
      fetchComplaintDetails(selectedComplaintId);
    } else {
      setSelectedComplaint(null);
      setSelectedComplaintHistory([]);
    }
  }, [selectedComplaintId]);

  // Verify online health check status of microservices
  const verifyBackends = async () => {
    const checkService = async (url: string) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        return res.ok ? 'online' : 'offline';
      } catch (e) {
        return 'offline';
      }
    };

    const userStatus = await checkService(USER_SERVICE_URL);
    const complaintStatus = await checkService(COMPLAINT_SERVICE_URL);
    const uploadStatus = await checkService(FILE_UPLOAD_SERVICE_URL);

    setBackendStatuses({
      user: userStatus,
      complaint: complaintStatus,
      upload: uploadStatus
    });
  };

  // Restore authenticated session from LocalStorage
  const restoreSession = () => {
    const storedUser = localStorage.getItem('activeUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      setActiveUser(JSON.parse(storedUser));
      setAuthToken(storedToken);
    }
  };

  const fetchInitialData = async () => {
    try {
      // Fetch platform users
      const usersRes = await fetch(`${USER_SERVICE_URL}/api/users`);
      if (usersRes.ok) {
        const users: DemoUser[] = await usersRes.json();
        setDemoUsers(users);
        
        // Populate sanitation workers
        const workers = users.filter(u => u.role === 'WORKER');
        setWorkersList(workers);
      }

      // Fetch Sinnar Wards list
      const wardsRes = await fetch(`${USER_SERVICE_URL}/api/wards`);
      if (wardsRes.ok) {
        const wardsList = await wardsRes.json();
        setWards(wardsList);
      }
    } catch (e) {
      console.error('Failed to load workspace parameters.', e);
    }
  };

  // Fetch metrics & complaint rows based on active role
  const fetchDashboardData = async () => {
    if (!activeUser) return;
    try {
      const wardParam = activeUser.role === 'NAGARSEVAK' ? `&wardNumber=${activeUser.wardNumber}` : '';
      const res = await fetch(
        `${COMPLAINT_SERVICE_URL}/api/complaints/dashboard?role=${activeUser.role}&userId=${activeUser.id}${wardParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
        setMetrics(data.metrics || { total: 0, active: 0, resolved: 0, escalated: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch dashboard registry.', e);
    }
  };

  // Fetch full details and timeline audit logs of a complaint
  const fetchComplaintDetails = async (id: string) => {
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedComplaint(data.complaint);
        setSelectedComplaintHistory(data.history || []);
      }
    } catch (e) {
      console.error('Failed to load complaint details.', e);
    }
  };

  // Cron auto-escalation check trigger
  const handleTriggerEscalationCheck = async () => {
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/trigger-escalation-check`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchDashboardData();
        if (selectedComplaintId) {
          fetchComplaintDetails(selectedComplaintId);
        }
        alert('Auto-Escalation cron scan executed! Unresolved complaints exceeding 3 minutes have been escalated.');
      }
    } catch (e) {
      console.error('Escalation check trigger failed.', e);
    }
  };

  // Login handler callback
  const handleLoginSuccess = (token: string, user: DemoUser) => {
    setActiveUser(user);
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('activeUser', JSON.stringify(user));
    
    // Set appropriate landing page
    if (user.role === 'ADMIN') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Logout handler callback
  const handleLogout = () => {
    setActiveUser(null);
    setAuthToken('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeUser');
    setSelectedComplaintId(null);
  };

  // Handler for DemoConsole filling values
  const handleDemoUserFill = (email: string, role: string) => {
    setDemoFillEmail(email);
    setDemoFillRole(role);
  };

  return (
    <div className="app-container">
      
      {/* Dynamic Demo Control Panel (Header status bar) */}
      <div className="demo-control-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: '#fbbf24' }} />
          {activeUser ? (
            <span>Active Role: <strong>{activeUser.name.replace(/ \(.*\)/g, '')} ({activeUser.role})</strong></span>
          ) : (
            <span>Active Session: <strong>Logged Out (Guest Gate)</strong></span>
          )}
          {activeUser?.wardNumber && <span style={{ opacity: 0.8 }}>| Ward {activeUser.wardNumber}</span>}
        </div>
        <div>
          <button className="demo-controls-button" onClick={() => setDemoPanelOpen(!demoPanelOpen)}>
            Demo Console
          </button>
        </div>
      </div>

      {/* Floating Drawer helper */}
      <DemoConsole
        demoUsers={demoUsers}
        activeUser={activeUser}
        setActiveUser={(user) => {
          if (user) {
            handleLoginSuccess(`mock-jwt-token.${Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')}`, user);
          } else {
            handleLogout();
          }
        }}
        demoPanelOpen={demoPanelOpen}
        setDemoPanelOpen={setDemoPanelOpen}
        backendStatuses={backendStatuses}
        handleTriggerEscalationCheck={handleTriggerEscalationCheck}
        onDemoUserFill={handleDemoUserFill}
      />

      {!activeUser ? (
        // ==================== 1. GUEST AUTH GATEWAY ====================
        <LoginPage
          USER_SERVICE_URL={USER_SERVICE_URL}
          FILE_UPLOAD_SERVICE_URL={FILE_UPLOAD_SERVICE_URL}
          wards={wards}
          onLoginSuccess={handleLoginSuccess}
          demoEmail={demoFillEmail}
          demoRole={demoFillRole}
          clearDemoFill={() => { setDemoFillEmail(''); setDemoFillRole(''); }}
        />
      ) : (
        // ==================== 2. AUTHENTICATED WORKSPACE ====================
        <>
          {/* Sidebars & Navs */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => { setActiveTab(tab); setSelectedComplaintId(null); }}
            activeUser={activeUser}
            onLogout={handleLogout}
          />

          <MobileNav
            activeTab={activeTab}
            setActiveTab={(tab) => { setActiveTab(tab); setSelectedComplaintId(null); }}
            activeUser={activeUser}
            setDemoPanelOpen={setDemoPanelOpen}
          />

          {/* Content Route Router */}
          <main className="content-area">
            {selectedComplaint ? (
              // Case audit details detail page
              <ComplaintDetailPage
                activeUser={activeUser}
                complaint={selectedComplaint}
                history={selectedComplaintHistory}
                workersList={workersList}
                onBack={() => setSelectedComplaintId(null)}
                onRefreshDetails={fetchComplaintDetails}
                onRefreshDashboard={fetchDashboardData}
                USER_SERVICE_URL={USER_SERVICE_URL}
                COMPLAINT_SERVICE_URL={COMPLAINT_SERVICE_URL}
              />
            ) : (
              // Layout page router
              <>
                {activeTab === 'dashboard' && (
                  <DashboardPage
                    activeUser={activeUser}
                    complaints={complaints}
                    metrics={metrics}
                    onComplaintSelect={setSelectedComplaintId}
                    onNewComplaintClick={() => setActiveTab('new-complaint')}
                  />
                )}

                {activeTab === 'new-complaint' && (
                  <NewComplaintPage
                    activeUser={activeUser}
                    FILE_UPLOAD_SERVICE_URL={FILE_UPLOAD_SERVICE_URL}
                    COMPLAINT_SERVICE_URL={COMPLAINT_SERVICE_URL}
                    onBack={() => setActiveTab('dashboard')}
                    onRefreshDashboard={fetchDashboardData}
                  />
                )}

                {activeTab === 'map-view' && (
                  <MapTrackerPage
                    complaints={complaints}
                    onInspectComplaint={setSelectedComplaintId}
                  />
                )}

                {activeTab === 'admin' && (
                  <AdminPage
                    USER_SERVICE_URL={USER_SERVICE_URL}
                    authToken={authToken}
                    wards={wards}
                  />
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
