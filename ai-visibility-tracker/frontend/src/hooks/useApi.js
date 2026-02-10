import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Custom hook for async operations with loading state
 * @returns {Object} - { loading, withLoading }
 */
export function useLoading() {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async (asyncFn) => {
    setLoading(true);
    try {
      return await asyncFn();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, withLoading };
}

export default useApi;
