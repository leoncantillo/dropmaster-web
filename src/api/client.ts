import axios from 'axios';

/**
 * Base URL for the Dropmaster API, configured via VITE_API_URL.
 * The backend runs with permissive CORS, so no dev-server proxy is required.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Standard response envelope used by every dropmaster-api endpoint.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
