import { useState } from 'react';
import { loadSettings, saveSettings } from '../utils/settings';

export default function Settings({ onClose }) {
  const [form, setForm] = useState(() => loadSettings());

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveSettings(form);
    if (onClose) onClose();
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800">Einstellungen</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <fieldset className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
          <legend className="text-sm font-semibold text-gray-600 px-1">API-Schlüssel</legend>

          <div className="flex flex-col gap-1">
            <label htmlFor="tankerkoenigKey" className="text-xs font-medium text-gray-500">
              Tankerkönig API-Key{' '}
              <a
                href="https://creativecommons.tankerkoenig.de/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                (API beantragen)
              </a>
            </label>
            <input
              id="tankerkoenigKey"
              type="text"
              name="tankerkoenigKey"
              value={form.tankerkoenigKey}
              onChange={handleChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="openChargeMapKey" className="text-xs font-medium text-gray-500">
              Open Charge Map API-Key{' '}
              <a
                href="https://openchargemap.org/site/develop/api"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                (API beantragen)
              </a>
            </label>
            <input
              id="openChargeMapKey"
              type="text"
              name="openChargeMapKey"
              value={form.openChargeMapKey}
              onChange={handleChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
              className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="orsKey" className="text-xs font-medium text-gray-500">
              OpenRouteService API-Key{' '}
              <a
                href="https://openrouteservice.org/dev/#/signup"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                (API beantragen)
              </a>
            </label>
            <input
              id="orsKey"
              type="text"
              name="orsKey"
              value={form.orsKey}
              onChange={handleChange}
              placeholder="5b3ce3597851110001cf62..."
              autoComplete="off"
              className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
          <legend className="text-sm font-semibold text-gray-600 px-1">Suche</legend>

          <div className="flex flex-col gap-1">
            <label htmlFor="radius" className="text-xs font-medium text-gray-500">
              Suchradius: <strong>{form.radius} km</strong>
            </label>
            <input
              id="radius"
              type="range"
              name="radius"
              min={1}
              max={25}
              value={form.radius}
              onChange={handleChange}
              aria-valuemin={1}
              aria-valuemax={25}
              aria-valuenow={form.radius}
              aria-valuetext={`${form.radius} Kilometer`}
              className="accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="fuelType" className="text-xs font-medium text-gray-500">
              Kraftstofftyp
            </label>
            <select
              id="fuelType"
              name="fuelType"
              value={form.fuelType}
              onChange={handleChange}
              className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="e5">Super E5</option>
              <option value="e10">Super E10</option>
              <option value="diesel">Diesel</option>
              <option value="all">Alle</option>
            </select>
          </div>
        </fieldset>

        <p
          role="note"
          className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2"
        >
          <span aria-hidden="true">⚠️</span>
          {' '}API-Schlüssel werden ausschließlich lokal in deinem Browser gespeichert (LocalStorage)
          und nicht an Dritte übertragen. Da es sich um eine öffentliche Web-App handelt, verwende
          bitte API-Keys mit entsprechenden Nutzungslimits und Einschränkungen (z.&nbsp;B. Rate-Limits).
          Teile deine API-Keys nicht mit anderen Personen.
        </p>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Speichern
        </button>
      </form>
    </div>
  );
}
