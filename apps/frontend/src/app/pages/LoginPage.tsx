import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Mail, Lock, User, Phone, MapPin, 
  FileText, Upload, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Ward } from '../types';

interface LoginPageProps {
  USER_SERVICE_URL: string;
  FILE_UPLOAD_SERVICE_URL: string;
  wards: Ward[];
  onLoginSuccess: (token: string, user: any) => void;
  // Shared ref for DemoConsole quick fill
  demoEmail?: string;
  demoRole?: string;
  clearDemoFill?: () => void;
}

// Leaflet click handler inside registration
function RegisterMapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LoginPage({
  USER_SERVICE_URL,
  FILE_UPLOAD_SERVICE_URL,
  wards,
  onLoginSuccess,
  demoEmail,
  demoRole,
  clearDemoFill
}: LoginPageProps) {
  // Tab selector
  const [activeForm, setActiveForm] = useState<'login' | 'register'>('login');

  // Common loading / error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWard, setRegWard] = useState<number>(wards[0]?.id || 1);
  const [regLat, setRegLat] = useState<number>(19.8450);
  const [regLng, setRegLng] = useState<number>(74.0016);
  const [regVoterId, setRegVoterId] = useState('');
  const [regPhoto, setRegPhoto] = useState<string>('');
  
  // Visual states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [voterIdValid, setVoterIdValid] = useState<boolean | null>(null);

  // Listen to Demo Quick Fill events from parent orchestrator
  useEffect(() => {
    if (demoEmail) {
      setLoginEmail(demoEmail);
      // Hardcoded standard password for demo accounts
      if (demoEmail === 'admin@sinnar.in') {
        setLoginPassword('admin_password');
      } else {
        setLoginPassword('password');
      }
      setActiveForm('login');
      setErrorMessage(null);
      setRateLimitMessage(null);
      if (clearDemoFill) clearDemoFill();
    }
  }, [demoEmail, demoRole, clearDemoFill]);

  // Live Voter ID Validator (Indian EPIC Card Format: 3 letters + 7 numbers)
  useEffect(() => {
    if (!regVoterId) {
      setVoterIdValid(null);
      return;
    }
    const cleanId = regVoterId.trim().toUpperCase();
    const epicRegex = /^[A-Z]{3}[0-9]{7}$/;
    setVoterIdValid(epicRegex.test(cleanId));
  }, [regVoterId]);

  // File Upload to file-upload-service
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch(`${FILE_UPLOAD_SERVICE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setRegPhoto(result.url);
      } else {
        throw new Error('Upload server returned an error.');
      }
    } catch (error) {
      setErrorMessage('Profile photo upload failed. Make sure file-upload-service is online.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    setErrorMessage(null);
    setRateLimitMessage(null);

    try {
      const response = await fetch(`${USER_SERVICE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        onLoginSuccess(result.token, result.user);
      } else {
        setErrorMessage(result.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Connection failed. Please check if user-service is running.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Citizen Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRateLimitMessage(null);

    if (!regName || !regEmail || !regPassword || !regPhone || !regAddress) {
      setErrorMessage('Please fill in all mandatory profile inputs.');
      return;
    }

    if (regVoterId && !voterIdValid) {
      setErrorMessage('Invalid Voter ID format. Expected format: 3 letters + 7 numbers (e.g., ABC1234567).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        address: regAddress,
        wardNumber: Number(regWard),
        latitude: regLat,
        longitude: regLng,
        voterId: regVoterId || undefined,
        photo: regPhoto || undefined,
      };

      const response = await fetch(`${USER_SERVICE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status === 429) {
        setRateLimitMessage(result.message || 'Too many registration attempts. Blocked by rate limiter.');
      } else if (response.ok) {
        // Auto-login registered citizen
        alert('Citizen registration successful! Logging in...');
        
        // Log in
        const loginRes = await fetch(`${USER_SERVICE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, password: regPassword }),
        });
        
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          onLoginSuccess(loginData.token, loginData.user);
        } else {
          setActiveForm('login');
          setLoginEmail(regEmail);
        }
      } else {
        setErrorMessage(result.message || 'Registration failed. Check database logs.');
      }
    } catch (err) {
      setErrorMessage('Connection failed. Please check if user-service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* 1. Brand Banner Panel (Left Column) */}
      <div className="auth-banner-panel" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div className="banner-gradient-background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.25), transparent 60%)', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 5, maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px', marginBottom: '24px' }}>
            <Sparkles size={24} />
            <span>Sinnar AI-Governance Initiative</span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px', background: 'linear-gradient(135deg, #f3f4f6, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Direct Transparency, Empowered Citizens.
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Welcome to the Sinnar Municipal Council digital hub. Raise complaints, tag hot spots instantly on maps, upload digital Visual Proofs, and track AI-supervised resolutions directly in your ward.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', margin: 0, background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                <ShieldCheck size={18} />
                <span>AI-Assisted Severity Mapping</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Our backend routes complaints through neural validation blocks to automatically escalate and direct workers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authentication Controller Panel (Right Column) */}
      <div style={{ flex: 1, minWidth: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', borderLeft: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', overflowY: 'auto', maxHeight: '100vh' }}>
        
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          
          {/* Header tabs */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => { setActiveForm('login'); setErrorMessage(null); setRateLimitMessage(null); }}
              style={{ background: 'none', border: 'none', color: activeForm === 'login' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '18px', fontWeight: '700', cursor: 'pointer', borderBottom: activeForm === 'login' ? '2px solid var(--primary)' : 'none', paddingBottom: '6px' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveForm('register'); setErrorMessage(null); setRateLimitMessage(null); }}
              style={{ background: 'none', border: 'none', color: activeForm === 'register' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '18px', fontWeight: '700', cursor: 'pointer', borderBottom: activeForm === 'register' ? '2px solid var(--primary)' : 'none', paddingBottom: '6px' }}
            >
              Citizen Sign Up
            </button>
          </div>

          {/* Standard error banner */}
          {errorMessage && (
            <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rate-limiter 429 error banner */}
          {rateLimitMessage && (
            <div className="glass-card" style={{ background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.3)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#fb923c', fontSize: '13px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold' }}>
                <AlertCircle size={18} />
                <span>Rate Limiter Triggered</span>
              </div>
              <p style={{ margin: 0, opacity: 0.9 }}>{rateLimitMessage}</p>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeForm === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="name@sinnar.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }} disabled={loading}>
                {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
                <span>Authenticate Session</span>
              </button>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
                Tip: Click <strong>"Demo Console"</strong> floating button to select a seeded user and automatically populate credentials above.
              </div>
            </form>
          )}

          {/* CITIZEN REGISTER FORM */}
          {activeForm === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Profile Photo Uploader Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  {regPhoto ? (
                    <img src={regPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={28} style={{ color: 'var(--text-muted)' }} />
                  )}
                  {uploadingPhoto && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--secondary)' }} />
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '12px' }}>Profile Avatar</label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Select photo, auto-uploads</span>
                  
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Upload size={12} />
                    <span>Upload Picture</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Tanmay Hire"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ paddingLeft: '36px', paddingTop: '10px', paddingBottom: '10px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email ID *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="name@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ paddingTop: '10px', paddingBottom: '10px' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{ paddingTop: '10px', paddingBottom: '10px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ paddingTop: '10px', paddingBottom: '10px' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sinnar Ward *</label>
                  <select 
                    className="form-select"
                    value={regWard}
                    onChange={(e) => setRegWard(Number(e.target.value))}
                    style={{ paddingTop: '10px', paddingBottom: '10px' }}
                  >
                    {wards.map(w => (
                      <option key={w.id} value={w.id} style={{ background: 'var(--bg-secondary)' }}>
                        Ward {w.id} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Physical Home Address *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Flat 102, Shrivardhan Complex, Saraswati Nagar"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  style={{ paddingTop: '10px', paddingBottom: '10px' }}
                  required
                />
              </div>

              {/* Voter ID Input with LIVE EPIC Validator Feedback */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Optional Voter ID</label>
                  {regVoterId && (
                    <span style={{ fontSize: '10px', color: voterIdValid ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                      {voterIdValid ? '● Standard EPIC Format' : '● Invalid: ABC1234567 format expected'}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <FileText size={14} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="MHG9876543"
                    value={regVoterId}
                    onChange={(e) => setRegVoterId(e.target.value)}
                    style={{ 
                      paddingLeft: '36px', 
                      paddingTop: '10px', 
                      paddingBottom: '10px',
                      borderColor: regVoterId ? (voterIdValid ? 'var(--success)' : 'rgba(239, 68, 68, 0.4)') : 'var(--glass-border)'
                    }}
                  />
                  {regVoterId && voterIdValid && (
                    <Check size={14} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--success)' }} />
                  )}
                </div>
              </div>

              {/* Coordinates leaflet picker */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ marginBottom: '4px' }}>Set Geolocation Coordinates *</label>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Click on the map below to pinpoint your location:</span>
                
                <div style={{ height: '140px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
                  <MapContainer center={[19.8450, 74.0016]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RegisterMapClickHandler onSelect={(lat, lng) => { setRegLat(+(lat.toFixed(5))); setRegLng(+(lng.toFixed(5))); }} />
                    <Marker position={[regLat, regLng]} />
                  </MapContainer>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    Lat: <strong style={{ color: 'var(--secondary)' }}>{regLat}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    Lng: <strong style={{ color: 'var(--secondary)' }}>{regLng}</strong>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginTop: '4px' }} disabled={loading}>
                {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
                <span>Submit Citizen Registration</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
