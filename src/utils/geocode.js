import axios from 'axios';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Geocode a free-text query (city name, postal code, address) using Nominatim.
 * Returns an array of results with { lat, lng, displayName }.
 * @param {string} query
 * @returns {Promise<Array<{lat: number, lng: number, displayName: string}>>}
 */
export async function geocode(query) {
  const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
    params: {
      q: query,
      format: 'json',
      limit: 5,
      countrycodes: 'de',
      addressdetails: 1,
    },
    headers: {
      'Accept-Language': 'de',
    },
  });

  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
  }));
}
