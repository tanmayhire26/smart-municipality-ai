import React from 'react';
import { 
  BarChart3, AlertCircle, MapPin, ShieldAlert, LogOut, Wrench 
} from 'lucide-react';
import { DemoUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  activeUser: DemoUser | null;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, activeUser, onLogout }: SidebarProps) {
  if (!activeUser) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Wrench size={22} style={{ color: 'var(--primary)' }} />
        <span>Sinnar AI-Gov</span>
      </div>
      
      <nav style={{ flex: 1 }}>
        <ul className="nav-menu">
          <li>
            <div 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </div>
          </li>

          {activeUser.role === 'CITIZEN' && (
            <li>
              <div 
                className={`nav-link ${activeTab === 'new-complaint' ? 'active' : ''}`}
                onClick={() => setActiveTab('new-complaint')}
              >
                <AlertCircle size={18} />
                <span>Raise Complaint</span>
              </div>
            </li>
          )}

          {(activeUser.role === 'CHIEF_OFFICER' || activeUser.role === 'COLLECTOR') && (
            <li>
              <div 
                className={`nav-link ${activeTab === 'map-view' ? 'active' : ''}`}
                onClick={() => setActiveTab('map-view')}
              >
                <MapPin size={18} />
                <span>City Maps Tracker</span>
              </div>
            </li>
          )}

          {activeUser.role === 'ADMIN' && (
            <li>
              <div 
                className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldAlert size={18} />
                <span>Admin Portal</span>
              </div>
            </li>
          )}
        </ul>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Logged as <strong>{activeUser.name.split(' ')[0]}</strong> <br />
          Role: <span style={{ color: 'var(--secondary)' }}>{activeUser.role}</span> <br />
          {activeUser.wardNumber ? `Ward ${activeUser.wardNumber}` : ''}
        </div>
        
        <button 
          className="btn btn-secondary btn-small" 
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
