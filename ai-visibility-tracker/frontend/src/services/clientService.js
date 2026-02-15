import api from './api';

export async function getClients() {
  const response = await api.get('/clients');
  return response.data.clients;
}

export async function getClient(id) {
  const response = await api.get(`/clients/${id}`);
  return response.data.client;
}

export async function createClient(data) {
  const response = await api.post('/clients', data);
  return response.data.client;
}

export async function updateClient(id, data) {
  const response = await api.put(`/clients/${id}`, data);
  return response.data.client;
}

export async function deleteClient(id) {
  await api.delete(`/clients/${id}`);
}

export async function addPrompts(clientId, prompts) {
  const response = await api.post(`/clients/${clientId}/prompts`, { prompts });
  return response.data.client;
}

export async function removePrompt(clientId, index) {
  const response = await api.delete(`/clients/${clientId}/prompts/${index}`);
  return response.data.client;
}

export async function addCompetitors(clientId, competitors) {
  const response = await api.post(`/clients/${clientId}/competitors`, { competitors });
  return response.data.client;
}

export async function removeCompetitor(clientId, index) {
  const response = await api.delete(`/clients/${clientId}/competitors/${index}`);
  return response.data.client;
}

/**
 * Generate prompts from keywords using AI or templates
 * NEW: Added February 12, 2026 - Rich's request for auto-generating prompts
 */
export async function generatePrompts(clientId, options) {
  const response = await api.post(`/clients/${clientId}/generate-prompts`, options);
  return response.data;
}

export default {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  addPrompts,
  removePrompt,
  addCompetitors,
  removeCompetitor,
  generatePrompts,
};
