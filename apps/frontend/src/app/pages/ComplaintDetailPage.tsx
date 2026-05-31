import React, { useState } from 'react';
import { 
  FolderClosed, Sparkles, FileText, Upload, RotateCw, 
  AlertTriangle, Star, CheckCircle, Clock 
} from 'lucide-react';
import { DemoUser, Complaint, HistoryItem } from '../types';

interface ComplaintDetailPageProps {
  activeUser: DemoUser | null;
  complaint: Complaint;
  history: HistoryItem[];
  workersList: DemoUser[];
  onBack: () => void;
  onRefreshDetails: (id: string) => void;
  onRefreshDashboard: () => void;
  USER_SERVICE_URL: string;
  COMPLAINT_SERVICE_URL: string;
}

export function ComplaintDetailPage({
  activeUser,
  complaint,
  history,
  workersList,
  onBack,
  onRefreshDetails,
  onRefreshDashboard,
  USER_SERVICE_URL,
  COMPLAINT_SERVICE_URL
}: ComplaintDetailPageProps) {
  // Form input states
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assignEta, setAssignEta] = useState('');
  const [workerNotes, setWorkerNotes] = useState('');
  const [actionDetail, setActionDetail] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [nagarsevakRating, setNagarsevakRating] = useState(5);
  const [hasRated, setHasRated] = useState(false);

  if (!activeUser) return null;

  // Actions handlers
  const handleAssignWorker = async () => {
    if (!assignWorkerId || !assignEta) return;
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: assignWorkerId,
          eta: assignEta,
          coId: activeUser.id
        })
      });

      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        setAssignWorkerId('');
        setAssignEta('');
        alert('Task assigned successfully!');
      }
    } catch (e) {
      alert('Failed to connect to complaint-service.');
    }
  };

  const handleInvestigate = async () => {
    if (!workerNotes) return;
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: activeUser.id,
          notes: workerNotes,
          photos: [] // simple log notes
        })
      });

      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        setWorkerNotes('');
        alert('Investigation notes logged successfully!');
      }
    } catch (e) {
      alert('Failed to log notes.');
    }
  };

  const handleLegalAction = async () => {
    if (!actionDetail) return;
    try {
      const documents: any[] = [];
      if (actionDetail.toLowerCase().includes('rebuttal')) {
        documents.push({
          type: 'rebuttal',
          url: 'https://pdfobject.com/pdf/sample.pdf',
          name: 'municipality_rebuttal_signed.pdf'
        });
      }

      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/legal-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: activeUser.id,
          actionDetail,
          documents
        })
      });

      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        setActionDetail('');
        alert('Legal action logs updated successfully!');
      }
    } catch (e) {
      alert('Connection error.');
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes) return;
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: activeUser.id,
          resolutionNotes
        })
      });

      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        setResolutionNotes('');
        alert('Complaint successfully marked as Resolved!');
      }
    } catch (e) {
      alert('Resolution update failed.');
    }
  };

  const handleManualEscalate = async () => {
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/escalate`, {
        method: 'POST'
      });
      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        alert('Complaint escalated directly to District Collector.');
      }
    } catch (e) {
      alert('Escalation failed.');
    }
  };

  const handleUpdateSeverity = async (severityValue: string) => {
    try {
      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints/${complaint.id}/severity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: activeUser.id,
          severity: severityValue
        })
      });
      if (res.ok) {
        onRefreshDashboard();
        onRefreshDetails(complaint.id);
        alert(`Severity updated to ${severityValue.toUpperCase()}!`);
      }
    } catch (e) {
      alert('Severity update failed.');
    }
  };

  const handleRateNagarsevak = async () => {
    if (!complaint.nagarsevakId) return;
    try {
      const res = await fetch(`${USER_SERVICE_URL}/api/users/${complaint.nagarsevakId}/rating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: nagarsevakRating })
      });

      if (res.ok) {
        setHasRated(true);
        onRefreshDetails(complaint.id);
        alert('Thank you for rating your Nagarsevak!');
      }
    } catch (e) {
      alert('Rating update failed.');
    }
  };

  return (
    <div>
      <button className="btn btn-secondary btn-small" onClick={onBack} style={{ marginBottom: '16px', width: 'auto' }}>
        ← Back to Dashboard
      </button>

      <div className="glass-card">
        {/* Title details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>{complaint.title}</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              ID: {complaint.id} | Category: <strong>{complaint.category}</strong>
            </div>
          </div>
          <span className={`badge badge-${
            complaint.status.toLowerCase().replace(/_to_collector|_taken/g, '').replace('ai_', '')
          }`}>
            {complaint.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Core content detail */}
        <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Citizen Description:</div>
          <p style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{complaint.description}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div>Raised By: <strong>{complaint.citizenName}</strong></div>
            <div>Ward / Unit: <strong>Ward {complaint.wardNumber} {complaint.unitNumber ? `/ Unit ${complaint.unitNumber}` : ''}</strong></div>
            
            {complaint.nagarsevakName && (
              <div style={{ gridColumn: 'span 2' }}>
                Ward Nagarsevak: <strong>{complaint.nagarsevakName}</strong> 
                {complaint.nagarsevakRating && <span style={{ color: '#fbbf24', marginLeft: '6px' }}>★ {complaint.nagarsevakRating} / 5</span>}
              </div>
            )}
          </div>
        </div>

        {/* AI verification details */}
        {complaint.aiConfidence && (
          <div style={{ border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.05)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontWeight: 'bold', marginBottom: '4px' }}>
              <Sparkles size={14} /> AI Verification Engine Feedback
            </div>
            <div>Status Check: <strong>{complaint.status === 'AI_REJECTED' ? 'Flagged as Spam/Fake' : 'Verified Genuine'}</strong> ({ (complaint.aiConfidence * 100).toFixed(0) }% confidence)</div>
            {complaint.aiSeverity && (
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Severity Level: 
                <span className={`severity-badge severity-${complaint.aiSeverity.toLowerCase()}`} style={{ display: 'inline-flex' }}>
                  {complaint.aiSeverity}
                </span>
              </div>
            )}
            <div style={{ marginTop: '4px' }}>AI Summary: <em>{complaint.aiSummary}</em></div>
            <div style={{ marginTop: '2px' }}>Suggested Action: <em>{complaint.aiSuggestedAction}</em></div>
          </div>
        )}

        {/* DMS Layout */}
        <h4 style={{ marginBottom: '10px', fontSize: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', marginTop: '24px' }}>
          <FolderClosed size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Document Management System
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Citizen Visual Proofs:</div>
            {(!complaint.photos || complaint.photos.length === 0) && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No photos uploaded.</div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {complaint.photos?.map((url: string, index: number) => (
                <div key={index} style={{ width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <a href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Legal & Property Records:</div>
            {(!complaint.documents || complaint.documents.length === 0) && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No records uploaded.</div>
            )}
            <div className="dms-list">
              {complaint.documents?.map((doc: any, index: number) => (
                <div key={index} className="dms-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    <div>
                      <span style={{ fontWeight: '500' }}>{doc.name}</span>
                      <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-muted)' }}>Type: {doc.type.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-small" style={{ width: 'auto', padding: '4px 8px' }}>
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WORKFLOW OPERATIONS */}
        {activeUser.role !== 'CITIZEN' && activeUser.role !== 'ADMIN' && (
          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Manage Issue Resolution Workflow</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Chief Officer Assignment */}
              {activeUser.role === 'CHIEF_OFFICER' && (complaint.status === 'VERIFIED' || complaint.status === 'AI_VERIFIED') && (
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', margin: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--secondary)' }}>Assign Municipal Worker & Set ETA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <select className="form-select" value={assignWorkerId} onChange={e => setAssignWorkerId(e.target.value)}>
                      <option value="">Select Field Worker...</option>
                      {workersList.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <input type="text" className="form-input" placeholder="ETA (e.g. 24 Hours, 3 Days)" value={assignEta} onChange={e => setAssignEta(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-small" onClick={handleAssignWorker}>Assign Task</button>
                </div>
              )}

              {/* 2. Worker Investigation Notes */}
              {activeUser.role === 'WORKER' && complaint.status === 'ASSIGNED' && (
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', margin: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--secondary)' }}>Log Field Investigation Notes</div>
                  <textarea className="form-textarea" placeholder="Log site conditions and actions planned..." value={workerNotes} onChange={e => setWorkerNotes(e.target.value)} style={{ marginBottom: '10px' }} />
                  <button className="btn btn-primary btn-small" onClick={handleInvestigate}>Log Inspection</button>
                </div>
              )}

              {/* 3. Legal/Resolution Logging */}
              {complaint.status !== 'RESOLVED' && complaint.status !== 'AI_REJECTED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Legal/Action Taken logs */}
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', margin: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Log Legal Action / Rebuttal Documents</div>
                    <input type="text" className="form-input" placeholder="Describe actions (e.g. issued eviction notice)..." value={actionDetail} onChange={e => setActionDetail(e.target.value)} style={{ marginBottom: '8px' }} />
                    <button className="btn btn-secondary btn-small" onClick={handleLegalAction}>Log Action</button>
                  </div>

                  {/* Mark as Resolved */}
                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', margin: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Resolve Complaint & Close Ticket</div>
                    <input type="text" className="form-input" placeholder="Resolution notes (e.g. cleared sewer block)..." value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} style={{ marginBottom: '8px' }} />
                    <button className="btn btn-primary btn-small" onClick={handleResolve} style={{ background: 'var(--success)', boxShadow: 'none' }}>Resolve Ticket</button>
                  </div>

                </div>
              )}

              {/* Severity & Escalation controls */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(activeUser.role === 'CHIEF_OFFICER' || activeUser.role === 'COLLECTOR') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Modify Severity:</span>
                    <select 
                      className="form-select btn-small" 
                      style={{ width: 'auto', padding: '4px 28px 4px 12px' }}
                      value={complaint.aiSeverity || 'MEDIUM'}
                      onChange={e => handleUpdateSeverity(e.target.value)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="HIGHEST">Highest</option>
                    </select>
                  </div>
                )}

                {activeUser.role === 'CHIEF_OFFICER' && complaint.status !== 'RESOLVED' && complaint.status !== 'ESCALATED_TO_COLLECTOR' && (
                  <button className="btn btn-danger btn-small" onClick={handleManualEscalate} style={{ width: 'auto', gap: '4px' }}>
                    <AlertTriangle size={14} /> Force Escalate to District Collector
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Rating of Nagarsevak (Citizen Only when Resolved) */}
        {activeUser.role === 'CITIZEN' && complaint.status === 'RESOLVED' && (
          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fbbf24' }}>Rate Ward Nagarsevak Performance</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px 0' }}>Provide performance reviews on this resolved complaint for Nagarsevak <strong>{complaint.nagarsevakName}</strong>:</p>
            
            {hasRated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 'bold', fontSize: '14px' }}>
                <CheckCircle size={16} /> <span>Thank you! Your rating has been recorded successfully.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(stars => (
                    <Star 
                      key={stars} 
                      size={20} 
                      style={{ cursor: 'pointer', color: stars <= nagarsevakRating ? '#fbbf24' : 'var(--text-muted)' }} 
                      fill={stars <= nagarsevakRating ? '#fbbf24' : 'none'}
                      onClick={() => setRegVoterId && setNagarsevakRating(stars)}
                    />
                  ))}
                </div>
                <button className="btn btn-primary btn-small" onClick={handleRateNagarsevak} style={{ width: 'auto' }}>Submit Rating</button>
              </div>
            )}
          </div>
        )}

        {/* Timeline Log audits */}
        <h4 style={{ marginBottom: '16px', fontSize: '16px', marginTop: '32px' }}>Complaint Verification Timeline Audit</h4>
        <div className="timeline">
          {history.map((item, idx) => (
            <div className="timeline-item" key={item.id}>
              <span className={`timeline-marker ${idx === 0 ? 'active' : ''}`} />
              <div className="timeline-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
                  <span>{item.actionTaken}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Status: <strong>{item.status.replace(/_/g, ' ')}</strong> | Actor: <strong>{item.performedByName}</strong>
                </div>
                {item.notes && <p style={{ margin: '6px 0 0 0', opacity: 0.9 }}>{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
