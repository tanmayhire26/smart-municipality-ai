import React from 'react';
import { 
  FileText, Star, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { DemoUser, Complaint, Metrics } from '../types';

interface DashboardPageProps {
  activeUser: DemoUser | null;
  complaints: Complaint[];
  metrics: Metrics;
  onComplaintSelect: (id: string) => void;
  onNewComplaintClick: () => void;
}

export function DashboardPage({
  activeUser,
  complaints,
  metrics,
  onComplaintSelect,
  onNewComplaintClick
}: DashboardPageProps) {
  if (!activeUser) return null;

  return (
    <div>
      {/* Dashboard Title & Meta Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '28px', margin: 0 }}>
            {activeUser.role === 'CITIZEN' && 'Citizen Hub'}
            {activeUser.role === 'CHIEF_OFFICER' && 'Chief Officer Portal'}
            {activeUser.role === 'NAGARSEVAK' && 'Nagarsevak Ward Tracker'}
            {activeUser.role === 'WORKER' && 'Worker Field Dashboard'}
            {activeUser.role === 'COLLECTOR' && 'District Collector Control'}
            {activeUser.role === 'ADMIN' && 'Municipal Admin Portal'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
            {activeUser.role === 'CITIZEN' && 'Raise, track, and upload documentation for local ward issues.'}
            {activeUser.role === 'CHIEF_OFFICER' && 'Review AI-flagged complaints, assign tasks, set ETAs, and audit workflows.'}
            {activeUser.role === 'NAGARSEVAK' && `Track public complaints and performance metrics for Ward ${activeUser.wardNumber}.`}
            {activeUser.role === 'WORKER' && 'Examine assigned issues, submit site proofs, and log resolution actions.'}
            {activeUser.role === 'COLLECTOR' && 'Arbitrate automatically escalated civic disputes and direct closures.'}
            {activeUser.role === 'ADMIN' && 'Review registered municipal personnel and provision administrative accounts.'}
          </p>
        </div>

        {activeUser.role === 'CITIZEN' && (
          <button className="btn btn-primary" onClick={onNewComplaintClick}>
            + Raise Complaint
          </button>
        )}
      </div>

      {/* Metrics Cards Grid (Visible to all except Admin) */}
      {activeUser.role !== 'ADMIN' && activeUser.role !== 'CITIZEN' && (
        <div className="metrics-grid">
          <div className="glass-card metric-card">
            <div className="metric-num">{metrics.total}</div>
            <div className="metric-label">Total Handled</div>
          </div>
          <div className="glass-card metric-card">
            <div className="metric-num" style={{ color: 'var(--secondary)' }}>{metrics.active}</div>
            <div className="metric-label">Active / Ongoing</div>
          </div>
          <div className="glass-card metric-card">
            <div className="metric-num" style={{ color: 'var(--success)' }}>{metrics.resolved}</div>
            <div className="metric-label">Resolved</div>
          </div>
          <div className="glass-card metric-card">
            <div className="metric-num" style={{ color: 'var(--accent)' }}>{metrics.escalated}</div>
            <div className="metric-label">Escalated (Collector)</div>
          </div>
        </div>
      )}

      {/* Nagarsevak Specific Public Works Rating Card */}
      {activeUser.role === 'NAGARSEVAK' && (
        <div className="glass-card" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--secondary)', margin: 0 }}>Your Public Works Rating</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>Calculated dynamically based on resolved citizen complaints in Ward {activeUser.wardNumber}.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-title)' }}>{activeUser.rating || '5.0'}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', color: '#fbbf24' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.floor(activeUser.rating || 5) ? '#fbbf24' : 'none'} stroke={i < Math.floor(activeUser.rating || 5) ? '#fbbf24' : 'currentColor'} />
                ))}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Citizen Rated</span>
            </div>
          </div>
        </div>
      )}

      {/* List of Complaints */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px', fontSize: '20px', marginTop: 0 }}>
          {activeUser.role === 'CITIZEN' && 'My Raised Complaints'}
          {activeUser.role === 'CHIEF_OFFICER' && 'All Municipal Complaints'}
          {activeUser.role === 'NAGARSEVAK' && `Ward ${activeUser.wardNumber} Complaints`}
          {activeUser.role === 'WORKER' && 'My Active & Assignable Tasks'}
          {activeUser.role === 'COLLECTOR' && 'Escalated Disputes Registry'}
          {activeUser.role === 'ADMIN' && 'Recent Platform Complaints Audits'}
        </h3>

        {complaints.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No complaints found in this registry category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {complaints.map(c => (
              <div 
                key={c.id} 
                onClick={() => onComplaintSelect(c.id)}
                className="complaint-row"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '75%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{c.title}</strong>
                    <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                      Ward {c.wardNumber}
                    </span>
                    {c.aiSeverity && (
                      <span className={`severity-badge severity-${c.aiSeverity.toLowerCase()}`}>
                        {c.aiSeverity}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {c.description}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Raised: {new Date(c.createdAt).toLocaleDateString()} by {c.citizenName} 
                    {c.assignedWorkerName && ` | Assigned to: ${c.assignedWorkerName}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`badge badge-${c.status.toLowerCase().replace(/_to_collector|_taken/g, '').replace('ai_', '')}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                  
                  {/* Urgent Alert Icon for Escalations */}
                  {c.status === 'ESCALATED_TO_COLLECTOR' && (
                    <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      <AlertTriangle size={12} /> Collector Review
                    </div>
                  )}

                  <span style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Manage <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
