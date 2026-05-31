import React from 'react';
import { Settings, Sparkles, RotateCw } from 'lucide-react';
import { DemoUser, BackendStatuses } from '../types';

interface DemoConsoleProps {
  demoUsers: DemoUser[];
  activeUser: DemoUser | null;
  setActiveUser: (user: DemoUser | null) => void;
  demoPanelOpen: boolean;
  setDemoPanelOpen: (open: boolean) => void;
  backendStatuses: BackendStatuses;
  handleTriggerEscalationCheck: () => void;
  onDemoUserFill?: (email: string, name: string) => void;
}

export function DemoConsole({
  demoUsers,
  activeUser,
  setActiveUser,
  demoPanelOpen,
  setDemoPanelOpen,
  backendStatuses,
  handleTriggerEscalationCheck,
  onDemoUserFill
}: DemoConsoleProps) {
  if (!demoPanelOpen) return null;

  return (
    <div className="demo-drawer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Settings size={16} /> Demo Controls
        </h4>
        <button 
          onClick={() => setDemoPanelOpen(false)} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        {activeUser 
          ? 'Switch roles instantly to simulate complaints lifecycle:' 
          : 'Select a seeded account to auto-fill the login form:'
        }
      </div>

      <div className="role-btn-grid" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
        {demoUsers.map(user => (
          <button
            key={user.id}
            className={`role-select-btn ${activeUser?.id === user.id ? 'active' : ''}`}
            onClick={() => {
              if (activeUser) {
                // Instantly switch active user session for testing convenience
                setActiveUser(user);
              } else if (onDemoUserFill) {
                // Populate credentials on login screen
                onDemoUserFill(user.email, user.role);
              }
            }}
          >
            <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.name.replace(/ \(.*\)/g, '')}
            </strong>
            <div style={{ fontSize: '9px', opacity: 0.7 }}>{user.role}</div>
          </button>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '8px 0' }} />

      <div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Simulation Utilities:</div>
        <button className="btn btn-secondary btn-small" onClick={handleTriggerEscalationCheck} style={{ width: '100%', gap: '4px', height: '32px' }}>
          <RotateCw size={12} /> Force Auto-Escalation Check
        </button>
        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px', textAlign: 'center' }}>
          Escalates active complaints older than 3 minutes to the Collector.
        </div>
      </div>

      <hr style={{ borderColor: 'var(--glass-border)', margin: '8px 0' }} />

      <div style={{ fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Service Connections:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div>User Service: <span style={{ color: backendStatuses.user === 'online' ? '#10b981' : '#ef4444' }}>● {backendStatuses.user.toUpperCase()}</span></div>
          <div>Complaint: <span style={{ color: backendStatuses.complaint === 'online' ? '#10b981' : '#ef4444' }}>● {backendStatuses.complaint.toUpperCase()}</span></div>
          <div>File Upload: <span style={{ color: backendStatuses.upload === 'online' ? '#10b981' : '#ef4444' }}>● {backendStatuses.upload.toUpperCase()}</span></div>
        </div>
      </div>
    </div>
  );
}
