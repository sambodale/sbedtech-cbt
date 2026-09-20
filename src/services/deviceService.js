// src/services/deviceService.js
// Gives each browser a random ID that stays the same between visits.

const DEVICE_KEY = 'sbedtech_device_id';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (for example, some private modes)
    return null;
  }
}