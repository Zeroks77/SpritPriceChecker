import { useState, useCallback } from 'react';
import './App.css';
import MapView from './components/MapView';
import FuelStations from './components/FuelStations';
import EVChargers from './components/EVChargers';
import RoutingControl from './components/RoutingControl';
import Settings from './components/Settings';
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

  const { position, error: geoError, loading: geoLoading, locate } = useGeolocation();

  const handleSettingsClose = useCallback(() => {
    setSettings(loadSettings());
    setActiveTab('fuel');
  }, []);

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
      <header className="bg-blue-700 text-white shadow-md z-10 flex items-center px-4 py-3 gap-3">
        <span className="text-2xl">⛽</span>
        <div>
          <h1 className="text-lg font-bold leading-none">SpritPriceChecker</h1>
          <p className="text-blue-200 text-xs">Spritpreise &amp; E-Ladesäulen in deiner Nähe</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={locate}
            disabled={geoLoading}
            title="Meinen Standort ermitteln"
            className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
          >
            {geoLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <span>📍</span>
            )}
            {position ? 'Standort aktualisieren' : 'Standort ermitteln'}
          </button>
        </div>
      </header>

      {geoError && (
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

          {/* Tab content */}
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
            {activeTab === 'settings' && (
              <Settings onClose={handleSettingsClose} />
            )}
          </div>
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
