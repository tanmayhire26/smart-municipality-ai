import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Complaint } from '../types';

interface MapTrackerPageProps {
  complaints: Complaint[];
  onInspectComplaint: (id: string) => void;
}

// Helper to determine Leaflet Marker custom color pins
const getMarkerIcon = (status: string) => {
  let color = 'grey';
  if (status === 'RESOLVED') color = 'green';
  else if (status === 'ESCALATED_TO_COLLECTOR') color = 'orange';
  else if (status === 'ASSIGNED') color = 'purple';
  else if (status === 'INVESTIGATED' || status === 'ACTION_TAKEN') color = 'blue';
  else if (status === 'AI_VERIFYING') color = 'gold';
  else if (status === 'AI_REJECTED') color = 'red';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export function MapTrackerPage({ complaints, onInspectComplaint }: MapTrackerPageProps) {
  const sinnarPosition: [number, number] = [19.8450, 74.0016];

  return (
    <div>
      <h2 style={{ fontSize: '28px', marginBottom: '8px', marginTop: 0 }}>Sinnar City Complaint Map Tracker</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        High-level geographical overview displaying complaint distribution hot spots color-coded by lifecycle state. Click on any pin to view details.
      </p>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ height: '500px', width: '100%' }}>
          <MapContainer center={sinnarPosition} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {complaints.filter(c => c.latitude && c.longitude).map(c => (
              <Marker 
                key={c.id} 
                position={[c.latitude!, c.longitude!]} 
                icon={getMarkerIcon(c.status)}
              >
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Category: {c.category} <br />
                      Citizen: {c.citizenName} (Ward {c.wardNumber})
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${c.status.toLowerCase().replace(/_to_collector|_taken/g, '').replace('ai_', '')}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                      <button 
                        onClick={() => onInspectComplaint(c.id)}
                        style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Map pin legends */}
      <div className="glass-card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'gold', borderRadius: '50%' }}></span>
            AI Verifying
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'blue', borderRadius: '50%' }}></span>
            Verified / Investigated
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'purple', borderRadius: '50%' }}></span>
            Assigned Worker
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'orange', borderRadius: '50%' }}></span>
            Escalated to Collector
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'green', borderRadius: '50%' }}></span>
            Resolved
          </div>
        </div>
      </div>
    </div>
  );
}
