/**
 * Resolves the base API URL for client-side API requests and Socket.IO connections.
 * 
 * Strategy:
 * 1. If VITE_API_URL is explicitly configured to a remote server, use it.
 * 2. When running in a browser on a remote host (e.g. EC2 instance, custom domain),
 *    automatically use window.location.origin so requests route through Nginx reverse proxy
 *    without needing hardcoded IPs or extra open ports.
 * 3. In local development (localhost / 127.0.0.1), fall back to http://localhost:5001.
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '';

    // If running in production on a remote host (e.g., EC2) and envUrl is either unset
    // or points to localhost, route to the current server origin
    if (!isLocalhost) {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return window.location.origin;
      }
    }
  }

  return envUrl || 'http://localhost:5001';
}
