import api from './api';

export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function register(email, password, name) {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getSettings() {
  const response = await api.get('/settings');
  return response.data.settings;
}

export async function updateSettings(data) {
  const response = await api.put('/settings', data);
  return response.data.settings;
}

export default {
  login,
  register,
  getCurrentUser,
  logout,
  getSettings,
  updateSettings,
};
