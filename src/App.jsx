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
  { id: 'fuel',     emoji: '⛽', ariaLabel: 'Tankstellen',    shortLabel: 'Kraftstoff'   },
  { id: 'ev',       emoji: '⚡', ariaLabel: 'Ladesäulen',     shortLabel: 'Laden'        },
  { id: 'route',    emoji: '🗺️', ariaLabel: 'Route',           shortLabel: 'Route'        },
  { id: 'settings', emoji: '⚙️', ariaLabel: 'Einstellungen',  shortLabel: 'Einstellungen'},
];

export default function App() {
  const [activeTab, setActiveTab] = useState('fuel');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [fuelStations, setFuelStations] = useState([]);
  const [evChargers, setEvChargers] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [manualPosition, setManualPosition] = useState(null);

  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation();
  const position = manualPosition || geoPosition;

  const handleSettingsClose = useCallback(() => {
    setSettings(loadSettings());
    setActiveTab('fuel');
  }, []);

  const handleLocationSelect = useCallback((pos) => {
    setManualPosition(pos);
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
    setMobilePanelOpen(true);
  }, []);

  const handleSelectCharger = useCallback((charger) => {
    setSelectedCharger(charger);
    setSelectedStation(null);
    const lat = charger.AddressInfo?.Latitude;
    const lng = charger.AddressInfo?.Longitude;
    if (lat && lng) {
      setDestination({ lat, lng, name: charger.AddressInfo?.Title || 'Ladesäule' });
      setActiveTab('route');
      setMobilePanelOpen(true);
    }
  }, []);

  function handleMobileTabClick(tabId) {
    if (tabId === activeTab && mobilePanelOpen) {
      setMobilePanelOpen(false);
    } else {
      setActiveTab(tabId);
      setMobilePanelOpen(true);
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Skip to main content */}
      <a href="#main-map" className="skip-link">
        Zur Karte springen
      </a>

      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md z-10 flex flex-col sm:flex-row sm:items-center px-3 py-2 gap-1.5 sm:gap-3 sm:px-4 shrink-0">
        {/* Row 1: Logo + GPS button (mobile), Logo (desktop) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 sm:flex-none shrink-0">
            <span className="text-xl sm:text-2xl" aria-hidden="true">⛽</span>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-none">SpritPriceChecker</h1>
              <p className="text-blue-200 text-xs hidden sm:block">Spritpreise &amp; E-Ladesäulen</p>
            </div>
          </div>
          {/* GPS button – shown inline on mobile (top-right of first row) */}
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            aria-label={geoLoading ? 'Standort wird ermittelt…' : 'GPS-Standort verwenden'}
            className="sm:hidden flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors ml-auto"
          >
            {geoLoading
              ? <span aria-hidden="true" className="animate-spin text-xs">⟳</span>
              : <span aria-hidden="true">📍</span>
            }
          </button>
        </div>

        {/* Row 2 on mobile: full-width search; inline on desktop */}
        <LocationSearch onLocationSelect={handleLocationSelect} />

        {/* GPS button – desktop only */}
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          aria-label={geoLoading ? 'Standort wird ermittelt…' : 'GPS-Standort verwenden'}
          className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors shrink-0"
        >
          {geoLoading
            ? <span aria-hidden="true" className="animate-spin text-xs">⟳</span>
            : <span aria-hidden="true">📍</span>
          }
          <span className="text-xs">GPS</span>
        </button>
      </header>

      {geoError && !manualPosition && (
        <div role="alert" className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2 shrink-0">
          {geoError}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* ── Sidebar (desktop) / Bottom sheet (mobile) ── */}
        <aside
          aria-label="Navigation und Inhalt"
          style={{ bottom: 'var(--tab-bar-total)' }}
          className={[
            // Mobile: fixed bottom sheet positioned above the tab bar (+ iOS safe area)
            'fixed left-0 right-0 z-20 bg-white flex flex-col rounded-t-2xl shadow-2xl',
            'max-h-[70vh] transition-transform duration-300 ease-out',
            mobilePanelOpen ? 'translate-y-0' : 'translate-y-full',
            // Desktop: regular inline sidebar — bottom style has no effect once position:relative
            'md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto',
            'md:w-80 md:max-h-none md:rounded-none md:shadow-sm',
            'md:border-r md:border-gray-200 md:translate-y-0 md:transition-none',
          ].join(' ')}
        >
          {/* Drag handle + close button (mobile only) */}
          <div className="md:hidden flex items-center px-4 pt-2 pb-0 shrink-0">
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
            </div>
            <button
              onClick={() => setMobilePanelOpen(false)}
              aria-label="Panel schließen"
              className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
            >
              <span aria-hidden="true" className="text-lg leading-none">✕</span>
            </button>
          </div>

          {/* Desktop tab navigation */}
          <nav
            role="tablist"
            aria-label="Inhaltsnavigation"
            className="hidden md:flex border-b border-gray-200 overflow-x-auto shrink-0"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-xs py-2.5 px-1 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                {' '}{tab.ariaLabel}
              </button>
            ))}
          </nav>

          {/* Tab content area */}
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {activeTab === 'settings' ? (
              <Settings onClose={handleSettingsClose} />
            ) : !position ? (
              /* No-location empty state */
              <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3">
                <span className="text-4xl" aria-hidden="true">📍</span>
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
            ) : (
              <>
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
              </>
            )}
          </div>
        </aside>

        {/* Map */}
        <main
          id="main-map"
          aria-label="Interaktive Karte"
          className="flex-1 relative pb-14 md:pb-0"
        >
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

      {/* Mobile bottom tab bar */}
      <nav
        role="tablist"
        aria-label="Inhaltsnavigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex h-14 shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id && mobilePanelOpen;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel}
              onClick={() => handleMobileTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-blue-700' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{tab.emoji}</span>
              <span className="text-[10px] font-medium">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
