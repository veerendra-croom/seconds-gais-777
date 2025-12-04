
import React, { useEffect, useState } from 'react';
import { DEFAULT_COLLEGE_COORDS } from '../constants';
import { api } from '../services/api';
import { ShieldCheck } from 'lucide-react';

interface SafetyMapProps {
  collegeName: string;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({ collegeName }) => {
  const [coords, setCoords] = useState(DEFAULT_COLLEGE_COORDS);

  useEffect(() => {
    // Find the college coordinates dynamically
    api.getColleges().then(colleges => {
      const matched = colleges.find(c => c.name === collegeName);
      if (matched) {
        setCoords({ lat: matched.latitude, lng: matched.longitude });
      }
    });
  }, [collegeName]);

  useEffect(() => {
    if (!(window as any).L) return;
    const L = (window as any).L;

    const container = L.DomUtil.get('safety-map');
    if(container != null){
      container._leaflet_id = null;
    }

    const map = L.map('safety-map', {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    const circle = L.circle([coords.lat, coords.lng], {
      color: '#0ea5e9',
      fillColor: '#0ea5e9',
      fillOpacity: 0.2,
      radius: 800 
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#0ea5e9;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>",
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    L.marker([coords.lat, coords.lng], { icon: icon }).addTo(map);

    return () => {
      map.remove();
    };
  }, [coords]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 relative">
      <div id="safety-map" className="w-full h-48 bg-slate-100 z-0"></div>
      
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 z-[400]">
        <ShieldCheck size={16} className="text-green-500" />
        <div>
          <p className="text-xs font-bold text-slate-800">Approximate Location</p>
          <p className="text-[10px] text-slate-500">Within {collegeName} Campus</p>
        </div>
      </div>
    </div>
  );
};
