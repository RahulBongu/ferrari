/**
 * Utility to resolve static asset paths against Vite's base URL.
 * Ensures seamless asset loading on both local development (localhost:5173/)
 * and production deployment paths like GitHub Pages (/ferrari/).
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';

  // Return direct paths for external URLs or inline data URIs
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Retrieve base URL injected by Vite (e.g., '/' locally or '/ferrari/' on GitHub Pages)
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBase}${cleanPath}`;
}
