export function resolveImageUrl(url: string) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7079';
  return `${apiBase}${url}`; 
}