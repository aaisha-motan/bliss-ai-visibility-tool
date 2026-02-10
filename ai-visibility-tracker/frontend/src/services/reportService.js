import api from './api';

export async function getReports(params = {}) {
  const response = await api.get('/reports', { params });
  return response.data;
}

export async function getReport(id) {
  const response = await api.get(`/reports/${id}`);
  return response.data.report;
}

export async function deleteReport(id) {
  await api.delete(`/reports/${id}`);
}

export async function getReportPdfData(id) {
  const response = await api.get(`/reports/${id}/pdf`);
  return response.data;
}

export default {
  getReports,
  getReport,
  deleteReport,
  getReportPdfData,
};
