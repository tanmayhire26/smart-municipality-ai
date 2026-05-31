import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, User, Mail, Lock, Phone, MapPin, 
  Search, Users, RefreshCw, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { DemoUser, Ward } from '../types';

interface AdminPageProps {
  USER_SERVICE_URL: string;
  authToken: string;
  wards: Ward[];
}

export function AdminPage({ USER_SERVICE_URL, authToken, wards }: AdminPageProps) {
  // Directory & list states
  const [usersList, setUsersList] = useState<DemoUser[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Register Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('NAGARSEVAK');
  const [wardNumber, setWardNumber] = useState<number>(wards[0]?.id || 1);

  // Status visual states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load directory on mount
  useEffect(() => {
    fetchUsersDirectory();
  }, []);

  const fetchUsersDirectory = async () => {
    setLoadingDirectory(true);
    try {
      const res = await fetch(`${USER_SERVICE_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error('Failed to load users directory', e);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name || !email || !password || !role) {
      setErrorMsg('Mandatory inputs missing (Name, Email, Password, Role).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        address: address || undefined,
        wardNumber: role === 'NAGARSEVAK' ? Number(wardNumber) : undefined
      };

      const res = await fetch(`${USER_SERVICE_URL}/api/users/admin/create-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setSuccessMsg(`Successfully registered ${role} account: ${email}`);
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setAddress('');
        
        // Reload users list
        fetchUsersDirectory();
      } else {
        setErrorMsg(result.message || 'Failed to create user account.');
      }
    } catch (err) {
      setErrorMsg('Connection failed. Verify if user-service is online.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users by search input
  const filteredUsers = usersList.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  // HSL avatar color helper
  const getAvatarStyle = (name: string, role: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    
    // Admin uses standard primary violet, collector uses orange, chief uses cyan, citizen uses grey
    if (role === 'ADMIN') return { background: 'var(--primary)' };
    if (role === 'COLLECTOR') return { background: 'var(--accent)' };
    if (role === 'CHIEF_OFFICER') return { background: 'var(--secondary)' };
    
    return { background: `hsl(${h}, 60%, 45%)` };
  };

  return (
    <div>
      <h2 style={{ fontSize: '28px', marginBottom: '8px', marginTop: 0 }}>Municipal Officer Provisioning Center</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Create administrative personnel credentials and oversee platforms accounts. Changes synchronize with PostgreSQL immediately.
      </p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* 1. Account Creator (Left Column) */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <form onSubmit={handleCreateUserSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '70px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} /> Register Administrative User
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>Provision Nagarsevak, Chief Officer, Workers, or Collectors.</p>

            {successMsg && (
              <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', display: 'flex', gap: '8px', alignItems: 'center', color: '#34d399', fontSize: '12px', margin: 0 }}>
                <CheckCircle2 size={16} /> <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '10px', display: 'flex', gap: '8px', alignItems: 'center', color: '#f87171', fontSize: '12px', margin: 0 }}>
                <AlertCircle size={16} /> <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="text" className="form-input" placeholder="e.g. Sunil Patil" value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '34px', paddingTop: '8px', paddingBottom: '8px' }} required />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="email" className="form-input" placeholder="patil@sinnar.in" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '34px', paddingTop: '8px', paddingBottom: '8px' }} required />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Temporary Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '34px', paddingTop: '8px', paddingBottom: '8px' }} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Role *</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  <option value="NAGARSEVAK">Nagarsevak</option>
                  <option value="CHIEF_OFFICER">Chief Officer</option>
                  <option value="WORKER">Sanitation Worker</option>
                  <option value="COLLECTOR">Collector</option>
                </select>
              </div>

              {role === 'NAGARSEVAK' ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assigned Ward *</label>
                  <select className="form-select" value={wardNumber} onChange={e => setWardNumber(Number(e.target.value))} style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                    {wards.map(w => (
                      <option key={w.id} value={w.id}>Ward {w.id} - {w.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingTop: '8px', paddingBottom: '8px' }} />
                </div>
              )}
            </div>

            {role === 'NAGARSEVAK' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingTop: '8px', paddingBottom: '8px' }} />
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Home / Office Address</label>
              <input type="text" className="form-input" placeholder="e.g. Nagar Panchayat Quarters" value={address} onChange={e => setAddress(e.target.value)} style={{ paddingTop: '8px', paddingBottom: '8px' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginTop: '6px' }} disabled={submitting}>
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : null}
              <span>Register Official</span>
            </button>
          </form>
        </div>

        {/* 2. Platform Directory (Right Column) */}
        <div style={{ flex: 1.5, minWidth: '400px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Platform Accounts Directory
              </h3>
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px' }}>
                Total Accounts: <strong>{usersList.length}</strong>
              </span>
            </div>

            {/* Search controller */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search accounts by name, email, or role..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px' }}
              />
            </div>

            {loadingDirectory ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span>Synchronizing postgres directory...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No platform accounts matched your criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto', paddingRight: '6px' }}>
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px', 
                      background: 'rgba(0,0,0,0.15)', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '65%' }}>
                      
                      {/* Circle Initials Avatar */}
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'white', 
                          fontWeight: '800', 
                          fontSize: '14px',
                          flexShrink: 0,
                          ...getAvatarStyle(user.name, user.role)
                        }}
                      >
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {user.email} | {user.phone || 'No Phone'}
                        </div>
                      </div>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`badge badge-${user.role.toLowerCase().replace(/_/g, '')}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                      {user.wardNumber ? (
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Ward Number {user.wardNumber}
                        </span>
                      ) : null}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
