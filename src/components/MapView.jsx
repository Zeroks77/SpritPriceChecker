import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  GeoJSON,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { formatPrice } from '../utils/format';

// Fix Leaflet's default icon paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(emoji, bg, size = 32) {
  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.45)}px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    // Larger hit area for touch without enlarging the visual icon
    popupAnchor: [0, -(size / 2)],
  });
}

const fuelIcon         = makeIcon('⛽', '#2563eb', 32);
const fuelIconSelected = makeIcon('⛽', '#1d4ed8', 40);
const evIcon           = makeIcon('⚡', '#16a34a', 32);
const evIconSelected   = makeIcon('⚡', '#15803d', 40);

// Colours per route index: matches RoutingControl cards
const ROUTE_COLORS     = ['#2563eb', '#ea580c', '#7c3aed'];
const ROUTE_COLORS_DIM = ['#93c5fd', '#fed7aa', '#ddd6fe'];

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 13, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

function FitRoute({ routeData, selectedRouteIndex }) {
  const map = useMap();
  useEffect(() => {
    if (!routeData?.features?.length) return;
    const feature = routeData.features[selectedRouteIndex] ?? routeData.features[0];
    if (!feature?.geometry) return;
    try {
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true, duration: 0.8 });
      }
    } catch {
      // ignore invalid geometries
    }
  }, [routeData, selectedRouteIndex, map]);
  return null;
}

function RouteLayer({ routeData, selectedRouteIndex, onSelectRoute }) {
  if (!routeData?.features?.length) return null;

  const firstCoord = routeData.features[0]?.geometry?.coordinates?.[0];
  const routeKey = firstCoord?.length >= 2
    ? `${routeData.features.length}-${firstCoord[0].toFixed(4)}-${firstCoord[1].toFixed(4)}`
    : `${routeData.features.length}-fallback`;

  const features = routeData.features;
  const order = [
    ...features.map((_, i) => i).filter((i) => i !== selectedRouteIndex),
    selectedRouteIndex,
  ];

  return order.map((idx) => {
    const feature = features[idx];
    if (!feature) return null;
    const isSelected = idx === selectedRouteIndex;
    const color = isSelected ? (ROUTE_COLORS[idx] ?? '#2563eb') : (ROUTE_COLORS_DIM[idx] ?? '#d1d5db');
    return (
      <GeoJSON
        key={`route-${routeKey}-${idx}`}
        data={{ type: 'FeatureCollection', features: [feature] }}
        style={{ color, weight: isSelected ? 5 : 3, opacity: isSelected ? 0.92 : 0.55 }}
        eventHandlers={{ click: () => !isSelected && onSelectRoute && onSelectRoute(idx) }}
      />
    );
  });
}

export default function MapView({
  position,
  fuelStations,
  evChargers,
  routeData,
  selectedRouteIndex = 0,
  onSelectRoute,
  onSelectStation,
  onSelectCharger,
  selectedStation,
  selectedCharger,
}) {
  const DEFAULT_CENTER = [51.1657, 10.4515];
  const center = position ? [position.lat, position.lng] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={position ? 13 : 6}
      className="map-container"
      style={{ height: '100%', width: '100%' }}
      aria-label="Interaktive Karte mit Tankstellen und Ladesäulen"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zoom control top-right so it doesn't clash with mobile tab bar */}
      <ZoomControl position="topright" />

      {position && (
        <>
          <FlyTo position={position} />
          <CircleMarker
            center={[position.lat, position.lng]}
            radius={10}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>Dein Standort</Popup>
          </CircleMarker>
        </>
      )}

      {fuelStations.map((s) => {
        const isSelected = selectedStation?.id === s.id;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={isSelected ? fuelIconSelected : fuelIcon}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => onSelectStation(s) }}
          >
            <Popup>
              <strong className="text-sm">{s.brand || s.name}</strong>
              <br />
              <span className="text-xs text-gray-500">{s.street} {s.houseNumber}, {s.postCode} {s.place}</span>
              {(s.e5 != null || s.e10 != null || s.diesel != null) && (
                <div className="mt-1.5 grid grid-cols-3 gap-x-2 text-xs text-center">
                  {s.e5 != null    && <div><div className="text-gray-400 text-[10px]">E5</div><div className="font-semibold">{formatPrice(s.e5)}</div></div>}
                  {s.e10 != null   && <div><div className="text-gray-400 text-[10px]">E10</div><div className="font-semibold">{formatPrice(s.e10)}</div></div>}
                  {s.diesel != null && <div><div className="text-gray-400 text-[10px]">Diesel</div><div className="font-semibold">{formatPrice(s.diesel)}</div></div>}
                </div>
              )}
              <div className="mt-1 text-xs">
                <span className={s.isOpen ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                  {s.isOpen ? '✓ Geöffnet' : '✗ Geschlossen'}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {evChargers.map((c) => {
        const lat = c.AddressInfo?.Latitude;
        const lng = c.AddressInfo?.Longitude;
        if (!lat || !lng) return null;
        const isSelected = selectedCharger?.ID === c.ID;
        const maxKw = c.Connections?.reduce((max, conn) => {
          const kw = conn.PowerKW;
          return kw != null && kw > max ? kw : max;
        }, 0) || null;
        return (
          <Marker
            key={c.ID}
            position={[lat, lng]}
            icon={isSelected ? evIconSelected : evIcon}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => onSelectCharger(c) }}
          >
            <Popup>
              <strong className="text-sm">{c.AddressInfo?.Title || 'Ladesäule'}</strong>
              <br />
              <span className="text-xs text-gray-500">{c.AddressInfo?.AddressLine1}, {c.AddressInfo?.Postcode} {c.AddressInfo?.Town}</span>
              {maxKw > 0 && (
                <div className="mt-1 text-xs font-semibold text-blue-700">⚡ max. {maxKw} kW</div>
              )}
            </Popup>
          </Marker>
        );
      })}

      <RouteLayer
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        onSelectRoute={onSelectRoute}
      />
      <FitRoute routeData={routeData} selectedRouteIndex={selectedRouteIndex} />
    </MapContainer>
  );
}
