/** Keep the anonymous fallback available when account data or app caches are reset. */
export const offlineCacheName = 'sparky-public-v15-musify-offline';

export async function clearObsoleteAppCaches() {
  if (!('caches' in window)) return;
  await Promise.all((await caches.keys()).filter(key => key.startsWith('sparky-') && key !== offlineCacheName).map(key => caches.delete(key)));
}
