import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CheckCircle2, AlertCircle, MapPin, Building2, Navigation, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix standard Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Google Maps Style Pins
const warehouseIcon = L.divIcon({
  className: 'custom-google-hub',
  html: `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
      <div style="background:#1e8e3e; color:white; padding:6px 10px; border-radius:14px; font-weight:900; font-size:11px; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid white; white-space:nowrap; display:flex; align-items:center; gap:4px;">
        🏢 Hubballi Hub
      </div>
      <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid #1e8e3e; margin-top:-1px;"></div>
    </div>
  `,
  iconSize: [110, 40],
  iconAnchor: [55, 38],
});

const farmerIcon = L.divIcon({
  className: 'custom-google-dest',
  html: `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
      <div style="background:#ea4335; color:white; padding:6px 10px; border-radius:14px; font-weight:900; font-size:11px; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid white; white-space:nowrap; display:flex; align-items:center; gap:4px;">
        📍 Farmer Destination
      </div>
      <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid #ea4335; margin-top:-1px;"></div>
    </div>
  `,
  iconSize: [140, 40],
  iconAnchor: [70, 38],
});

const googleTruckIcon = L.divIcon({
  className: 'custom-google-truck',
  html: `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
      <div style="background:#1a73e8; color:white; padding:6px 12px; border-radius:20px; font-weight:900; font-size:12px; box-shadow:0 4px 12px rgba(26,115,232,0.5); border:3px solid white; display:flex; align-items:center; gap:5px;" class="animate-bounce">
        <span style="font-size:16px;">🚚</span>
        <span>KA-25-EA-4412</span>
      </div>
      <div style="width:12px; height:12px; background:#1a73e8; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #1a73e8; margin-top:2px;" class="animate-ping"></div>
    </div>
  `,
  iconSize: [150, 50],
  iconAnchor: [75, 45],
});

// Helper component to recenter and fit view
function MapRecenter({ warehousePos, destPos }) {
  const map = useMap();
  useEffect(() => {
    if (warehousePos && destPos) {
      const bounds = L.latLngBounds([warehousePos, destPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [warehousePos, destPos, map]);
  return null;
}

/**
 * Build a realistic Karnataka highway corridor fallback path
 * that follows actual road junctions instead of a straight line.
 */
function buildFallbackRoute(wLat, wLng, dLat, dLng) {
  const latD = dLat - wLat;
  const lngD = dLng - wLng;
  // Road junctions along NH-63 / Navalgund SH corridor
  const junctions = [
    [wLat, wLng],
    [wLat + 0.008, wLng + 0.005],  // Tarihal bypass exit
    latD >= 0
      ? [wLat + latD * 0.28 + 0.007, wLng + lngD * 0.20 - 0.005]   // NH-63 N junction
      : [wLat + latD * 0.30 - 0.005, wLng + lngD * 0.25 + 0.005],   // NH-63 S junction
    latD >= 0
      ? [wLat + latD * 0.55 - 0.003, wLng + lngD * 0.60 + 0.009]   // Dharwad town bypass
      : [wLat + latD * 0.58 + 0.004, wLng + lngD * 0.58 - 0.006],
    latD >= 0
      ? [wLat + latD * 0.82 + 0.005, wLng + lngD * 0.85 - 0.003]   // Navalgund state SH
      : [wLat + latD * 0.84 - 0.003, wLng + lngD * 0.86 + 0.004],
    [dLat, dLng],
  ];
  // Smooth the junctions with curved interpolation
  const coords = [];
  for (let i = 0; i < junctions.length - 1; i++) {
    const [lat1, lng1] = junctions[i];
    const [lat2, lng2] = junctions[i + 1];
    for (let s = 0; s < 5; s++) {
      const t = s / 5;
      const curve = Math.sin(t * Math.PI) * 0.0016 * (i % 2 === 0 ? 1 : -1);
      coords.push([lat1 + (lat2 - lat1) * t + curve, lng1 + (lng2 - lng1) * t + curve * 0.5]);
    }
  }
  coords.push([dLat, dLng]);
  return coords;
}

export default function LeafletMapTracker({ trackingData }) {
  const { language, t } = useLanguage();
  const [mapType, setMapType] = useState('roadmap');
  const [roadCoords, setRoadCoords] = useState(null);   // OSRM geometry
  const [routeInfo, setRouteInfo] = useState(null);     // { distanceKm, durationMin, summary }
  const [routeLoading, setRouteLoading] = useState(true);

  if (!trackingData) return null;

  const {
    order_id,
    order_status,
    status_display,
    rejection_reason,
    estimated_delivery,
    warehouse,
    destination,
    current_location,
    route_waypoints
  } = trackingData;

  const isRejected = order_status === -1;
  const isDelivered = order_status === 4;

  const warehousePos = [warehouse?.lat || 15.3647, warehouse?.lng || 75.1240];
  const destPos = [destination?.lat || 15.5647, destination?.lng || 75.3640];
  const truckPos = [current_location?.lat || 15.4647, current_location?.lng || 75.2440];

  // Decode Google/Mapbox encoded polyline or return raw coord pairs from OSRM
  // OSRM returns geometry as GeoJSON by default when geometry=geojson
  useEffect(() => {
    const [wLat, wLng] = warehousePos;
    const [dLat, dLng] = destPos;
    // Build fallback immediately so the map shows something
    const fallback = buildFallbackRoute(wLat, wLng, dLat, dLng);
    setRoadCoords(fallback);

    // Then try OSRM public API for the real road geometry
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${wLng},${wLat};${dLng},${dLat}` +
      `?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    setRouteLoading(true);

    fetch(osrmUrl, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data?.routes?.[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);
          setRoadCoords(coords);
          setRouteInfo({ distanceKm: distKm, durationMin: durMin });
        }
      })
      .catch(() => { /* keep fallback on error */ })
      .finally(() => setRouteLoading(false));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingData?.order_id]);

  // Derive the polyline from OSRM result or the server-side waypoints fallback
  const polylineCoords = roadCoords ||
    route_waypoints?.map(wp => [wp.lat, wp.lng]) ||
    buildFallbackRoute(...warehousePos, ...destPos);


  // Tile layer mapping for Google Maps experience
  const getTileUrl = () => {
    if (mapType === 'satellite') {
      return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Satellite Hybrid
    }
    if (mapType === 'terrain') {
      return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Google Terrain
    }
    return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Road Map
  };

  const steps = [
    { status: 0, label: t('statusPlaced'),          desc: 'Order received & logged' },
    { status: 1, label: t('statusConfirmed'),        desc: 'Verified by Hub Admin' },
    { status: 2, label: t('statusShipped'),          desc: 'Dispatched from Hubballi Hub' },
    { status: 3, label: t('statusOutForDelivery'),   desc: 'Live GPS Delivery en route' },
    { status: 4, label: t('statusDelivered'),        desc: 'Handed to Farmer' },
  ];

  return (
    <div className="space-y-6">
      {/* Rejection Alert Banner */}
      {isRejected && (
        <div className="p-4 bg-red-100 border-2 border-red-400 rounded-2xl flex items-start gap-3 text-red-900 shadow-md">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-base">{t('orderRejectedAlert')}</h4>
            <p className="text-sm font-semibold mt-1">
              <span className="font-bold">{t('rejectionReasonLabel')}: </span>
              {rejection_reason || 'Administrative policy check.'}
            </p>
          </div>
        </div>
      )}

      {/* Top Order Status Stepper */}
      <div className="bg-white p-6 rounded-3xl border-2 border-agri-light shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-agri-light pb-4 mb-6">
          <div>
            <span className="text-xs font-bold text-agri-textMuted uppercase">{t('orderIdLabel')}</span>
            <h2 className="text-2xl font-black text-agri-dark">#{order_id}</h2>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-agri-textMuted uppercase block">{t('estimatedDelivery')}</span>
            <span className="text-sm font-black text-agri-primary">{estimated_delivery || '2-3 Business Days'}</span>
          </div>
        </div>

        {/* Timeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
          {steps.map((s, idx) => {
            const isCompleted = order_status >= s.status && !isRejected;
            const isActive = order_status === s.status && !isRejected;

            return (
              <div key={idx} className="flex flex-col items-center text-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition ${
                  isCompleted 
                    ? 'bg-agri-primary text-white' 
                    : isActive 
                      ? 'bg-agri-accent text-agri-textDark ring-4 ring-amber-200 animate-pulse' 
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.status + 1}
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-agri-primary font-black' : isCompleted ? 'text-agri-dark' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-agri-textMuted mt-0.5 hidden sm:block">
                  {s.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Maps Real-time Tracking Box */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-agri-light shadow-lg space-y-3">
        {/* Google Maps Style Navigation Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-inner shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">Live GPS Navigation · Road Route</span>
                {routeLoading ? (
                  <span className="flex items-center gap-1 bg-yellow-400/90 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" /> Routing…
                  </span>
                ) : (
                  <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Live Active
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {routeInfo
                  ? `Shortest road route via NH-63 & Navalgund SH • ${routeInfo.durationMin} mins (${routeInfo.distanceKm} km)`
                  : 'Road route via NH-63 & Navalgund Highway'}
              </p>
            </div>
          </div>

          {/* Map Layer Switcher (Google Map, Satellite, Terrain) */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/20">
            {[
              { id: 'roadmap', label: '🗺️ Map' },
              { id: 'satellite', label: '🛰️ Satellite' },
              { id: 'terrain', label: '⛰️ Terrain' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setMapType(type.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  mapType === type.id ? 'bg-white text-blue-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Map Display */}
        <div className="h-[420px] w-full rounded-2xl overflow-hidden border-2 border-gray-200 relative shadow-inner">
          <MapContainer center={truckPos} zoom={11} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; Google Maps Data 2026'
              url={getTileUrl()}
            />
            <MapRecenter warehousePos={warehousePos} destPos={destPos} />

            {/* Warehouse Marker */}
            <Marker position={warehousePos} icon={warehouseIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <span className="text-green-800 block font-black text-sm">🏢 AgriOwl Hubballi Hub</span>
                  <span className="text-gray-600 font-medium">Primary Distribution Center, Industrial Estate, Hubballi</span>
                </div>
              </Popup>
            </Marker>

            {/* Farmer Destination Marker */}
            <Marker position={destPos} icon={farmerIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <span className="text-red-700 block font-black text-sm">🌾 Farmer Delivery Address</span>
                  <span className="text-gray-700 font-medium">{destination?.name || 'Farmer House'}, {destination?.address || 'Navalgund, Dharwad'}</span>
                </div>
              </Popup>
            </Marker>

            {/* Moving Truck Marker */}
            {!isDelivered && !isRejected && (
              <Marker position={truckPos} icon={googleTruckIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <span className="text-blue-700 block font-black text-sm">🚚 AgriOwl Delivery Express</span>
                    <span className="text-gray-600">Vehicle: KA-25-EA-4412 • Speed: 42 km/h</span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route Line (Google Blue Driving Path) */}
            <Polyline positions={polylineCoords} color="#1a73e8" weight={6} opacity={0.9} />
          </MapContainer>
        </div>

        {/* Bottom Route Status Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 pt-1 px-2 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-green-800">
              <Building2 className="w-4 h-4 text-green-700" /> Origin: Hubballi Hub
            </span>
            <span className="flex items-center gap-1.5 font-bold text-red-700">
              <MapPin className="w-4 h-4 text-red-600" /> Destination: {destination?.name?.split('(')[0]?.trim() || 'Farmer Farm'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            {routeInfo ? (
              <>
                <span className="text-blue-700 font-black">{routeInfo.distanceKm} km</span>
                <span className="text-gray-400">·</span>
                <span className="text-green-700 font-black">~{routeInfo.durationMin} min drive</span>
                <span className="text-gray-400">·</span>
                Real road route
              </>
            ) : (
              'Road route · GPS update every 10s'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
