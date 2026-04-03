import { useState, useCallback, useRef } from 'react';
import './App.css';
import MapView from './components/MapView';
import FuelStations from './components/FuelStations';
import EVChargers from './components/EVChargers';
import RoutingControl from './components/RoutingControl';
import Settings from './components/Settings';
import LocationSearch from './components/LocationSearch';
import { useGeolocation } from './hooks/useGeolocation';
import { loadSettings } from './utils/settings';

// 3 tabs: combined stations, route, settings
const TABS = [
  { id: 'stations', emoji: '⛽', ariaLabel: 'Stationen',      shortLabel: 'Stationen'    },
  { id: 'route',    emoji: '🗺️', ariaLabel: 'Route',           shortLabel: 'Route'        },
  { id: 'settings', emoji: '⚙️', ariaLabel: 'Einstellungen',  shortLabel: 'Einstellungen'},
];

export default function App() {
  const [activeTab, setActiveTab] = useState('stations');
  const [stationType, setStationType] = useState('fuel'); // 'fuel' | 'ev'
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [fuelStations, setFuelStations] = useState([]);
  const [evChargers, setEvChargers] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [focusStation, setFocusStation] = useState(null);

  // Swipe-to-close state for mobile bottom sheet
  const SWIPE_DOWN_THRESHOLD = 60;
  const swipeRef = useRef({ startY: 0, currentY: 0, swiping: false });

  // Red badge on settings tab when any API key is missing
  const missingKeys = !settings.tankerkoenigKey || !settings.openChargeMapKey || !settings.orsKey;
  const [manualPosition, setManualPosition] = useState(null);

  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation();
  const position = manualPosition || geoPosition;

  const handleSettingsClose = useCallback(() => {
    setSettings(loadSettings());
    setActiveTab('stations');
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
    if (station) {
      setDestination({ lat: station.lat, lng: station.lng, name: station.brand || station.name });
      setRouteData(null);
      setSelectedRouteIndex(0);
      setActiveTab('stations');
      setMobilePanelOpen(true);
    }
  }, []);

  const handleSwitchToRouteTab = useCallback(() => {
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
      setRouteData(null);
      setSelectedRouteIndex(0);
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

  // Swipe-to-close handlers for mobile bottom sheet drag handle
  function handleSwipeStart(e) {
    const touch = e.touches[0];
    swipeRef.current = { startY: touch.clientY, currentY: touch.clientY, swiping: true };
  }
  function handleSwipeMove(e) {
    if (!swipeRef.current.swiping) return;
    swipeRef.current.currentY = e.touches[0].clientY;
  }
  function handleSwipeEnd() {
    if (!swipeRef.current.swiping) return;
    const delta = swipeRef.current.currentY - swipeRef.current.startY;
    if (delta > SWIPE_DOWN_THRESHOLD) {
      setMobilePanelOpen(false);
    }
    swipeRef.current.swiping = false;
  }

  const handleFocusStation = useCallback((station) => {
    setFocusStation({ lat: station.lat, lng: station.lng });
  }, []);

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
          {/* GPS button – inline on mobile (top-right of first row) */}
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

        {/* Row 2 on mobile: full-width search; inline flex-1 on desktop */}
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
          className={[
            // Mobile: fixed bottom sheet positioned above tab bar (incl. iOS safe area)
            'fixed left-0 right-0 z-20 bg-white flex flex-col rounded-t-2xl shadow-2xl',
            'bottom-[var(--tab-bar-total)] h-[70vh] transition-transform duration-300 ease-out',
            mobilePanelOpen ? 'translate-y-0' : 'translate-y-full',
            // Desktop: regular inline sidebar — override mobile-specific values
            'md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto',
            'md:w-96 md:h-auto md:max-h-none md:rounded-none md:shadow-sm',
            'md:border-r md:border-gray-200 md:translate-y-0 md:transition-none',
          ].join(' ')}
        >
          {/* Drag handle + close button (mobile only) */}
          <div
            className="md:hidden flex items-center px-4 pt-3 pb-1 shrink-0 cursor-grab"
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
          >
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
            </div>
            <button
              onClick={() => setMobilePanelOpen(false)}
              aria-label="Panel schließen"
              className="text-gray-400 hover:text-gray-600 p-2 -mr-2 touch-manipulation"
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
                <span className="relative inline-block" aria-hidden="true">
                  {tab.emoji}
                  {tab.id === 'settings' && missingKeys && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" aria-hidden="true" />
                  )}
                </span>
                {' '}{tab.ariaLabel}
              </button>
            ))}
          </nav>

          {/* Tab content area */}
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="flex-1 overflow-hidden flex flex-col min-h-0"
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
                {activeTab === 'stations' && (
                  <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                    {/* Fuel ↔ EV toggle switch */}
                    <div className="flex items-center justify-center px-4 py-2 border-b border-gray-100 shrink-0">
                      <div
                        role="group"
                        aria-label="Stationstyp wählen"
                        className="flex bg-gray-100 rounded-xl p-1 gap-1 w-full"
                      >
                        <button
                          onClick={() => setStationType('fuel')}
                          aria-pressed={stationType === 'fuel'}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            stationType === 'fuel'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <span aria-hidden="true">⛽</span> Tankstellen
                        </button>
                        <button
                          onClick={() => setStationType('ev')}
                          aria-pressed={stationType === 'ev'}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            stationType === 'ev'
                              ? 'bg-white text-green-700 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <span aria-hidden="true">⚡</span> Ladesäulen
                        </button>
                      </div>
                    </div>

                    {stationType === 'fuel' ? (
                      <FuelStations
                        position={position}
                        settings={settings}
                        fuelStations={fuelStations}
                        onStationsChange={setFuelStations}
                        onSelectStation={handleSelectStation}
                        onPlanRoute={handleSwitchToRouteTab}
                        onFocusStation={handleFocusStation}
                        selectedStation={selectedStation}
                      />
                    ) : (
                      <EVChargers
                        position={position}
                        settings={settings}
                        evChargers={evChargers}
                        onChargersChange={setEvChargers}
                        onSelectCharger={handleSelectCharger}
                        selectedCharger={selectedCharger}
                      />
                    )}
                  </div>
                )}
                {activeTab === 'route' && (
                  <RoutingControl
                    position={position}
                    destination={destination}
                    settings={settings}
                    routeData={routeData}
                    selectedRouteIndex={selectedRouteIndex}
                    onRouteReady={(data) => { setRouteData(data); setSelectedRouteIndex(0); }}
                    onSelectRoute={setSelectedRouteIndex}
                  />
                )}
              </>
            )}
          </div>
        </aside>

        {/* Map – bottom padding accounts for tab bar + iOS safe area on mobile */}
        <main
          id="main-map"
          aria-label="Interaktive Karte"
          className="flex-1 relative z-0 pb-[var(--tab-bar-total)] md:pb-0"
        >
          <MapView
            position={position}
            fuelStations={fuelStations}
            evChargers={evChargers}
            routeData={routeData}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={setSelectedRouteIndex}
            onSelectStation={handleSelectStation}
            onSelectCharger={handleSelectCharger}
            selectedStation={selectedStation}
            selectedCharger={selectedCharger}
            focusStation={focusStation}
          />

          {/* FAB: visible on mobile when panel is closed and a location is set */}
          {!mobilePanelOpen && position && (
            <button
              onClick={() => { setActiveTab('stations'); setMobilePanelOpen(true); }}
              aria-label="Stationsliste öffnen"
              className="md:hidden absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white text-gray-800 text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow touch-manipulation"
              style={{ bottom: 'calc(var(--tab-bar-total) + 0.75rem)' }}
            >
              <span aria-hidden="true">📋</span> Liste anzeigen
            </button>
          )}
        </main>
      </div>

      {/* Mobile bottom tab bar – height + iOS safe area via padding */}
      <nav
        role="tablist"
        aria-label="Inhaltsnavigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id && mobilePanelOpen;
          const showBadge = tab.id === 'settings' && missingKeys;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.ariaLabel + (showBadge ? ' – API-Keys fehlen' : '')}
              onClick={() => handleMobileTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-14 transition-colors touch-manipulation ${
                isActive ? 'text-blue-700' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <span className="relative text-xl leading-none" aria-hidden="true">
                {tab.emoji}
                {showBadge && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" aria-hidden="true" />
                )}
              </span>
              <span className="text-[11px] font-medium">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
