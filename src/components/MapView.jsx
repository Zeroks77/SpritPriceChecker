import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon paths for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(emoji, bg, size = 28) {
  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.5)}px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const fuelIcon = makeIcon('⛽', '#2563eb');
const fuelIconSelected = makeIcon('⛽', '#1d4ed8', 36);
const evIcon = makeIcon('⚡', '#16a34a');
const evIconSelected = makeIcon('⚡', '#15803d', 36);

// Colours per route index: matches RoutingControl cards
const ROUTE_COLORS = ['#2563eb', '#ea580c', '#7c3aed'];
const ROUTE_COLORS_DIM = ['#93c5fd', '#fed7aa', '#ddd6fe']; // dimmed alternatives

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 13, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Fit map to the currently selected route feature
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

// Render each route feature as its own coloured polyline so alternatives are visible
function RouteLayer({ routeData, selectedRouteIndex, onSelectRoute }) {
  if (!routeData?.features?.length) return null;

  // Use a lightweight stable key: feature count + first coordinate of first feature
  const firstCoord = routeData.features[0]?.geometry?.coordinates?.[0];
  const routeKey = `${routeData.features.length}-${firstCoord?.[0]?.toFixed(4)}-${firstCoord?.[1]?.toFixed(4)}`;

  // Render alternatives first (behind), then selected route on top
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
        style={{
          color,
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.92 : 0.55,
        }}
        eventHandlers={{
          click: () => !isSelected && onSelectRoute && onSelectRoute(idx),
        }}
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
  const DEFAULT_CENTER = [51.1657, 10.4515]; // Germany center
  const center = position ? [position.lat, position.lng] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={position ? 13 : 6}
      className="map-container"
      style={{ height: '100%', width: '100%' }}
      aria-label="Interaktive Karte mit Tankstellen und Ladesäulen"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
              <strong>{s.brand || s.name}</strong>
              <br />
              {s.street} {s.houseNumber}
              <br />
              {s.postCode} {s.place}
            </Popup>
          </Marker>
        );
      })}

      {evChargers.map((c) => {
        const lat = c.AddressInfo?.Latitude;
        const lng = c.AddressInfo?.Longitude;
        if (!lat || !lng) return null;
        const isSelected = selectedCharger?.ID === c.ID;
        return (
          <Marker
            key={c.ID}
            position={[lat, lng]}
            icon={isSelected ? evIconSelected : evIcon}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => onSelectCharger(c) }}
          >
            <Popup>
              <strong>{c.AddressInfo?.Title || 'Ladesäule'}</strong>
              <br />
              {c.AddressInfo?.AddressLine1}
              <br />
              {c.AddressInfo?.Postcode} {c.AddressInfo?.Town}
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
