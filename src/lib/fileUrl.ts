/**
 * Resolves a file URL to an absolute URL.
 * Handles both legacy relative URLs (/uploads/...) and new R2 absolute URLs (https://...).
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return `${baseUrl}${url}`
}
