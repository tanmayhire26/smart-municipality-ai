import React from 'react';
import { 
  BarChart3, AlertCircle, MapPin, ShieldAlert, Settings 
} from 'lucide-react';
import { DemoUser } from '../types';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  activeUser: DemoUser | null;
  setDemoPanelOpen: (open: boolean) => void;
}

export function MobileNav({ activeTab, setActiveTab, activeUser, setDemoPanelOpen }: MobileNavProps) {
  if (!activeUser) return null;

  return (
    <nav className="mobile-nav">
      <div 
        className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <BarChart3 size={20} />
        <span>Dashboard</span>
      </div>

      {activeUser.role === 'CITIZEN' && (
        <div 
          className={`mobile-nav-item ${activeTab === 'new-complaint' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-complaint')}
        >
          <AlertCircle size={20} />
          <span>Raise</span>
        </div>
      )}

      {(activeUser.role === 'CHIEF_OFFICER' || activeUser.role === 'COLLECTOR') && (
        <div 
          className={`mobile-nav-item ${activeTab === 'map-view' ? 'active' : ''}`}
          onClick={() => setActiveTab('map-view')}
        >
          <MapPin size={20} />
          <span>Tracker</span>
        </div>
      )}

      {activeUser.role === 'ADMIN' && (
        <div 
          className={`mobile-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <ShieldAlert size={20} />
          <span>Admin</span>
        </div>
      )}

      <div className="mobile-nav-item" onClick={() => setDemoPanelOpen(true)}>
        <Settings size={20} />
        <span>Console</span>
      </div>
    </nav>
  );
}
