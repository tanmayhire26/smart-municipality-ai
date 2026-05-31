import React, { useState } from 'react';
import { 
  Sparkles, Upload, FileText, FileImage, 
  Clock, CheckCircle, RefreshCw 
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { DemoUser } from '../types';

interface NewComplaintPageProps {
  activeUser: DemoUser | null;
  FILE_UPLOAD_SERVICE_URL: string;
  COMPLAINT_SERVICE_URL: string;
  onBack: () => void;
  onRefreshDashboard: () => void;
}

// Leaflet map click coordinates selector
function NewComplaintMapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function NewComplaintPage({
  activeUser,
  FILE_UPLOAD_SERVICE_URL,
  COMPLAINT_SERVICE_URL,
  onBack,
  onRefreshDashboard
}: NewComplaintPageProps) {
  // Input fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Road Encroachment');
  const [newLat, setNewLat] = useState<number>(19.8450);
  const [newLng, setNewLng] = useState<number>(74.0016);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [attachedVideos, setAttachedVideos] = useState<string[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<any[]>([]);

  // Loading indicator states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!activeUser) return null;

  // File Upload Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'doc') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch(`${FILE_UPLOAD_SERVICE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (type === 'photo') {
          setAttachedPhotos(prev => [...prev, result.url]);
        } else if (type === 'video') {
          setAttachedVideos(prev => [...prev, result.url]);
        } else {
          setAttachedDocs(prev => [...prev, {
            type: 'signed_letter',
            url: result.url,
            name: files[0].name
          }]);
        }
      }
    } catch (e) {
      alert('File upload failed. Ensure file-upload-service is running.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Simulated rapid image uploads for easy manual evaluation
  const handleSimulateUpload = async (category: string) => {
    setUploadingFile(true);
    let fileUrl = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400&auto=format&fit=crop'; // Pothole default
    let fileName = 'road_pothole.jpg';

    if (category.includes('Sewerage') || category.includes('Drainage')) {
      fileUrl = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop';
      fileName = 'overflowing_drain.jpg';
    } else if (category.includes('Construction')) {
      fileUrl = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400&auto=format&fit=crop';
      fileName = 'encroached_structure.jpg';
    } else if (category.includes('Streetlight')) {
      fileUrl = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop';
      fileName = 'dark_streetlight.jpg';
    }

    try {
      const blob = await fetch(fileUrl).then(r => r.blob());
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${FILE_UPLOAD_SERVICE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAttachedPhotos(prev => [...prev, result.url]);
      } else {
        setAttachedPhotos(prev => [...prev, fileUrl]);
      }
    } catch (e) {
      setAttachedPhotos(prev => [...prev, fileUrl]); // local mock fallback
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSimulateSignedLetter = () => {
    setAttachedDocs(prev => [...prev, {
      type: 'signed_letter',
      url: 'https://pdfobject.com/pdf/sample.pdf',
      name: 'citizen_signed_resolution_request.pdf'
    }]);
  };

  const handleSimulateSaleDeed = () => {
    setAttachedDocs(prev => [...prev, {
      type: 'sale_deed',
      url: 'https://pdfobject.com/pdf/sample.pdf',
      name: 'property_sale_deed_extract.pdf'
    }]);
  };

  // Submit Complaint Handler
  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    setSubmitting(true);

    try {
      const payload = {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        latitude: newLat,
        longitude: newLng,
        citizenId: activeUser.id,
        photos: attachedPhotos,
        videos: attachedVideos,
        documents: attachedDocs
      };

      const res = await fetch(`${COMPLAINT_SERVICE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        setAttachedPhotos([]);
        setAttachedVideos([]);
        setAttachedDocs([]);
        
        onRefreshDashboard();
        onBack();
        alert('Complaint raised successfully! AI Verification has started in the background.');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert('Connection failed. Make sure complaint-service is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary btn-small" onClick={onBack} style={{ marginBottom: '16px', width: 'auto' }}>
        ← Back to Dashboard
      </button>

      <h2 style={{ fontSize: '28px', marginBottom: '8px', marginTop: 0 }}>Raise a New Civic Complaint</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Fill in the details below. Our AI-supervised verification system will audit the location coordinates, inspect visual attachments, and immediately compute severity tags.
      </p>

      <form onSubmit={handleRaiseSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Complaint Title *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Major drainage overflow near school gate"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category *</label>
            <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              <option value="Road Encroachment">Road Encroachment</option>
              <option value="Sewerage/Water Pollution">Sewerage/Water Pollution</option>
              <option value="Drainage Overflow">Drainage Overflow</option>
              <option value="Illegal Construction">Illegal Construction</option>
              <option value="Streetlights Issue">Streetlights Issue</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Detailed Description *</label>
          <textarea 
            className="form-textarea" 
            placeholder="Provide precise details of the public grievance (e.g. duration of issue, hazard to traffic)..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            required
          />
        </div>

        {/* Embedded map picker */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ marginBottom: '4px' }}>Tag Geolocation Location *</label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Click on the map of Sinnar to pinpoint the exact physical location of the issue:
          </span>

          <div style={{ height: '240px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
            <MapContainer center={[19.8450, 74.0016]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <NewComplaintMapClickHandler onSelect={(lat, lng) => { setNewLat(+(lat.toFixed(5))); setNewLng(+(lng.toFixed(5))); }} />
              <Marker position={[newLat, newLng]} />
            </MapContainer>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
              Latitude: <strong style={{ color: 'var(--secondary)' }}>{newLat}</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
              Longitude: <strong style={{ color: 'var(--secondary)' }}>{newLng}</strong>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '8px 0' }} />

        {/* Uploads and simulation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label className="form-label">Visual Evidences (Photos/Videos)</label>
            <div className="file-upload-zone" style={{ position: 'relative' }}>
              <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'photo')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <FileImage size={24} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Choose Photo Visual Proof</div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Or use grading simulations below:</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => handleSimulateUpload(newCategory)} style={{ flex: 1, padding: '4px 6px', fontSize: '11px', height: '28px' }}>
                Simulate Camera Capture
              </button>
            </div>

            {/* Photo preview list */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {attachedPhotos.map((url, i) => (
                <div key={i} style={{ width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <img src={url} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Signed Grievance Letters & Deeds</label>
            <div className="file-upload-zone" style={{ position: 'relative' }}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, 'doc')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <FileText size={24} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Attach Citizen DMS Record</div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Or use simulator shortcuts:</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleSimulateSignedLetter} style={{ flex: 1, padding: '4px 4px', fontSize: '10px', height: '28px' }}>
                + Add Signed Letter
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleSimulateSaleDeed} style={{ flex: 1, padding: '4px 4px', fontSize: '10px', height: '28px' }}>
                + Add Property Deed
              </button>
            </div>

            {/* Document preview list */}
            <div className="dms-list">
              {attachedDocs.map((doc, i) => (
                <div key={i} className="dms-item" style={{ padding: '4px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <FileText size={12} style={{ color: 'var(--primary)' }} />
                    <span>{doc.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '8px 0' }} />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }} disabled={submitting || uploadingFile}>
          {submitting ? <RefreshCw size={16} className="animate-spin" /> : null}
          <span>File Complaint & Engage AI-Supervisor</span>
        </button>

      </form>
    </div>
  );
}
