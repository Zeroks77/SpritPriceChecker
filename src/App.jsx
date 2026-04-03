import { useState, useCallback } from 'react';
import './App.css';
import MapView from './components/MapView';
import FuelStations from './components/FuelStations';
import EVChargers from './components/EVChargers';
import RoutingControl from './components/RoutingControl';
import Settings from './components/Settings';
import LocationSearch from './components/LocationSearch';
import { useGeolocation } from './hooks/useGeolocation';
import { loadSettings } from './utils/settings';

const TABS = [
  { id: 'fuel', label: '⛽ Tankstellen' },
  { id: 'ev', label: '⚡ Ladesäulen' },
  { id: 'route', label: '🗺️ Route' },
  { id: 'settings', label: '⚙️ Einstellungen' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('fuel');
  const [settings, setSettings] = useState(loadSettings);
  const [fuelStations, setFuelStations] = useState([]);
  const [evChargers, setEvChargers] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  // Manually entered position overrides geolocation
  const [manualPosition, setManualPosition] = useState(null);

  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation();

  // Active position: manual takes precedence over geolocation
  const position = manualPosition || geoPosition;

  const handleSettingsClose = useCallback(() => {
    setSettings(loadSettings());
    setActiveTab('fuel');
  }, []);

  const handleLocationSelect = useCallback((pos) => {
    setManualPosition(pos);
    // Reset data when location changes
    setFuelStations([]);
    setEvChargers([]);
    setRouteData(null);
  }, []);

  const handleGeolocate = useCallback(() => {
    setManualPosition(null);
    locate();
  }, [locate]);

  const handleSelectStation = useCallback((station) => {
    setSelectedStation(station);
    setSelectedCharger(null);
    setDestination({ lat: station.lat, lng: station.lng, name: station.brand || station.name });
    setActiveTab('route');
  }, []);

  const handleSelectCharger = useCallback((charger) => {
    setSelectedCharger(charger);
    setSelectedStation(null);
    const lat = charger.AddressInfo?.Latitude;
    const lng = charger.AddressInfo?.Longitude;
    if (lat && lng) {
      setDestination({ lat, lng, name: charger.AddressInfo?.Title || 'Ladesäule' });
      setActiveTab('route');
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md z-10 flex items-center px-4 py-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">⛽</span>
          <div>
            <h1 className="text-base font-bold leading-none">SpritPriceChecker</h1>
            <p className="text-blue-200 text-xs">Spritpreise &amp; E-Ladesäulen</p>
          </div>
        </div>

        {/* Location search */}
        <LocationSearch onLocationSelect={handleLocationSelect} />

        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          title="Meinen Standort automatisch ermitteln"
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors shrink-0"
        >
          {geoLoading ? <span className="animate-spin text-xs">⟳</span> : <span>📍</span>}
          <span className="hidden sm:inline text-xs">GPS</span>
        </button>
      </header>

      {geoError && !manualPosition && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2">
          {geoError}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden">
          {/* Tab navigation */}
          <nav className="flex border-b border-gray-200 overflow-x-auto shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-xs py-2.5 px-1 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* No-location empty state */}
          {!position && activeTab !== 'settings' && (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3">
              <span className="text-4xl">📍</span>
              <p className="text-sm font-semibold text-gray-700">Kein Standort gewählt</p>
              <p className="text-xs text-gray-500">
                Gib oben einen Ort oder eine PLZ ein, oder lass deinen Standort automatisch
                ermitteln.
              </p>
              <button
                onClick={handleGeolocate}
                disabled={geoLoading}
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
              >
                {geoLoading ? 'Ermittle Standort…' : '📍 GPS verwenden'}
              </button>
            </div>
          )}

          {/* Tab content */}
          {position && (
            <div className="flex-1 overflow-hidden">
              {activeTab === 'fuel' && (
                <FuelStations
                  position={position}
                  settings={settings}
                  fuelStations={fuelStations}
                  onStationsChange={setFuelStations}
                  onSelectStation={handleSelectStation}
                  selectedStation={selectedStation}
                />
              )}
              {activeTab === 'ev' && (
                <EVChargers
                  position={position}
                  settings={settings}
                  evChargers={evChargers}
                  onChargersChange={setEvChargers}
                  onSelectCharger={handleSelectCharger}
                  selectedCharger={selectedCharger}
                />
              )}
              {activeTab === 'route' && (
                <RoutingControl
                  position={position}
                  destination={destination}
                  settings={settings}
                  onRouteReady={setRouteData}
                />
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-hidden">
              <Settings onClose={handleSettingsClose} />
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView
            position={position}
            fuelStations={fuelStations}
            evChargers={evChargers}
            routeData={routeData}
            onSelectStation={handleSelectStation}
            onSelectCharger={handleSelectCharger}
            selectedStation={selectedStation}
            selectedCharger={selectedCharger}
          />
        </main>
      </div>
    </div>
  );
}
