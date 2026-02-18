import api from './api';

/**
 * Settings Service
 * Handles settings and token validation API calls
 */

// Get user settings
export async function getSettings() {
  const response = await api.get('/settings');
  return response.data;
}

// Update user settings
export async function updateSettings(settings) {
  const response = await api.put('/settings', settings);
  return response.data;
}

// Get quick token status (no browser validation)
export async function getTokenStatus() {
  const response = await api.get('/settings/tokens/status');
  return response.data;
}

// Validate all tokens with browser (takes 30-60 seconds)
export async function validateTokens() {
  const response = await api.post('/settings/tokens/validate');
  return response.data;
}

export default {
  getSettings,
  updateSettings,
  getTokenStatus,
  validateTokens,
};
