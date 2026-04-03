import axios from 'axios';

const TANKERKOENIG_BASE = 'https://creativecommons.tankerkoenig.de/json';
const OPENCHARGEMAP_BASE = 'https://api.openchargemap.io/v3';
const ORS_BASE = 'https://api.openrouteservice.org';

/**
 * Fetch nearby fuel stations from the Tankerkönig API.
 * @param {number} lat
 * @param {number} lng
 * @param {string} apiKey
 * @param {number} radius - radius in km (max 25)
 * @param {'e5'|'e10'|'diesel'|'all'} type
 */
export async function fetchFuelStations(lat, lng, apiKey, radius = 5, type = 'all') {
  const { data } = await axios.get(`${TANKERKOENIG_BASE}/list.php`, {
    params: { lat, lng, rad: radius, sort: 'dist', type, apikey: apiKey },
  });
  if (!data.ok) throw new Error(data.message || 'Tankerkönig API Fehler');
  return data.stations || [];
}

/**
 * Fetch nearby EV charging stations from Open Charge Map.
 * @param {number} lat
 * @param {number} lng
 * @param {string} apiKey
 * @param {number} radius - distance in km
 */
export async function fetchEVChargers(lat, lng, apiKey, radius = 5) {
  const { data } = await axios.get(`${OPENCHARGEMAP_BASE}/poi/`, {
    params: {
      output: 'json',
      latitude: lat,
      longitude: lng,
      distance: radius,
      distanceunit: 'km',
      maxresults: 50,
      compact: true,
      verbose: false,
      key: apiKey,
    },
  });
  return data || [];
}

/**
 * Fetch a route between two coordinates using OpenRouteService.
 * @param {[number,number]} from - [lng, lat]
 * @param {[number,number]} to - [lng, lat]
 * @param {string} apiKey
 * @param {'driving-car'|'cycling-regular'|'foot-walking'} profile
 */
export async function fetchRoute(from, to, apiKey, profile = 'driving-car') {
  const { data } = await axios.post(
    `${ORS_BASE}/v2/directions/${profile}/geojson`,
    { coordinates: [from, to] },
    { headers: { Authorization: apiKey, 'Content-Type': 'application/json' } }
  );
  return data;
}
