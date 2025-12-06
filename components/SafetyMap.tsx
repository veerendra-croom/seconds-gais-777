import React, { useEffect, useState } from 'react';
import { DEFAULT_COLLEGE_COORDS } from '../constants';
import { api } from '../services/api';
import { ShieldCheck } from 'lucide-react';

interface SafetyMapProps {
  collegeName: string;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({ collegeName }) => {
  const [coords, setCoords] = useState(DEFAULT_COLLEGE_COORDS);
  const [mapInitialized, setMapInitialized] = useState(false);

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
    // Retry checking for Leaflet in case it loads slowly
    const checkLeaflet = setInterval(() => {
      if ((window as any).L) {
        clearInterval(checkLeaflet);
        initializeMap();
      }
    }, 100);

    const initializeMap = () => {
        const L = (window as any).L;
        if (!L) return;

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
          fillOpacity: 0.15,
          radius: 800,
          weight: 1
        }).addTo(map);

        // Custom S-Logo Icon
        const iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a" width="32" height="32">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `;

        const icon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${iconSvg}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([coords.lat, coords.lng], { icon: icon }).addTo(map);
        
        setMapInitialized(true);
        
        return () => {
          map.remove();
        };
    }

    return () => clearInterval(checkLeaflet);
  }, [coords]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 relative">
      <div id="safety-map" className="w-full h-48 bg-slate-100 z-0"></div>
      
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 z-[400]">
        <ShieldCheck size={16} className="text-green-500" />
        <div>
          <p className="text-xs font-bold text-slate-800">Verified Campus Zone</p>
          <p className="text-[10px] text-slate-500">{collegeName}</p>
        </div>
      </div>
    </div>
  );
};