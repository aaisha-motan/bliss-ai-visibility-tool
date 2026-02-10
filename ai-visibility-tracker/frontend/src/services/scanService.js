import api from './api';

export async function startScan(clientId, prompts = null) {
  const response = await api.post('/scans', { clientId, prompts });
  return response.data;
}

export async function getScan(id) {
  const response = await api.get(`/scans/${id}`);
  return response.data.scan;
}

export async function getScanStatus(id) {
  const response = await api.get(`/scans/${id}/status`);
  return response.data;
}

// Poll for scan status until completion
export function pollScanStatus(scanId, onUpdate, interval = 2000) {
  let active = true;

  const poll = async () => {
    if (!active) return;

    try {
      const status = await getScanStatus(scanId);
      onUpdate(status);

      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return; // Stop polling
      }

      setTimeout(poll, interval);
    } catch (error) {
      onUpdate({ error: error.message });
    }
  };

  poll();

  // Return function to stop polling
  return () => {
    active = false;
  };
}

export default {
  startScan,
  getScan,
  getScanStatus,
  pollScanStatus,
};
