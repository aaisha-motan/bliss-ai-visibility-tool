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

/**
 * Discover keywords where client is already ranking
 * NEW: Added February 17, 2026 - Rich's request: "How do we find keywords that we're ranking well for?"
 */
export async function discoverKeywords(clientId, options) {
  const response = await api.post(`/clients/${clientId}/discover-keywords`, options);
  return response.data;
}


/**
 * Bulk upload prompts from CSV
 * NEW: Added February 17, 2026 - Rich request: "Upload 100 prompts"
 */
export async function bulkUploadPrompts(clientId, csvContent, skipDuplicates = true) {
  const response = await api.post(`/clients/${clientId}/prompts/bulk`, { csvContent, skipDuplicates });
  return response.data;
}

/**
 * Validate CSV content before uploading
 */
export async function validateBulkCSV(clientId, csvContent) {
  const response = await api.post(`/clients/${clientId}/prompts/validate`, { csvContent });
  return response.data;
}

/**
 * Download CSV template
 */
export function getCSVTemplateUrl() {
  return `${api.defaults.baseURL}/clients/templates/csv`;
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
  discoverKeywords,
  bulkUploadPrompts,
  validateBulkCSV,
  getCSVTemplateUrl,
};
