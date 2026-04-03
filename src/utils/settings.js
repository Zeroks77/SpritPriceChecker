const STORAGE_KEY = 'spritpricechecker_settings';

export const defaultSettings = {
  tankerkoenigKey: '',
  openChargeMapKey: '',
  orsKey: '',
  radius: 5,
  fuelType: 'e5',
};

export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
