// Centralized API base URL for frontend
// Use REACT_APP_API_BASE_URL in production; fallback to local dev
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export function buildUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}
