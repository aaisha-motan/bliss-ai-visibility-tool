import api from './api';

export async function getConnectionStatus() {
  const response = await api.get('/connect/status');
  return response.data;
}

export async function startLogin(platform) {
  const response = await api.post(`/connect/start/${platform}`);
  return response.data;
}

export async function checkLoginStatus(platform) {
  const response = await api.get(`/connect/status/${platform}`);
  return response.data;
}

export async function completeLogin(platform) {
  const response = await api.post(`/connect/complete/${platform}`);
  return response.data;
}

export async function cancelLogin(platform) {
  const response = await api.post(`/connect/cancel/${platform}`);
  return response.data;
}

export async function disconnect(platform) {
  const response = await api.post(`/connect/disconnect/${platform}`);
  return response.data;
}

export default {
  getConnectionStatus,
  startLogin,
  checkLoginStatus,
  completeLogin,
  cancelLogin,
  disconnect,
};
