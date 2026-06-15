/**
 * API Configuration
 * Otomatis mendeteksi environment:
 * - Development (localhost): http://localhost:3001
 * - Production / Railway: sama dengan origin (monolith mode)
 */

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Di production (monolith/Railway), frontend & backend di-serve dari server yang sama
// Di development, backend jalan di port 3001
export const API_BASE = isDev ? 'http://localhost:3001' : '';

/**
 * Helper fetch wrapper dengan base URL otomatis
 * @param {string} path - API path (contoh: '/api/products')
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<Response>}
 */
export function apiFetch(path, options) {
  return fetch(`${API_BASE}${path}`, options);
}
