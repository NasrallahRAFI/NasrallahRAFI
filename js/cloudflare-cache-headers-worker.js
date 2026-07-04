// Only needed if nasrallahrafi.me is served by GitHub Pages with
// Cloudflare as a DNS/CDN proxy in front of it (orange-clouded DNS).
// GitHub Pages does not read the repo's _headers file at all, so those
// Cache-Control rules are currently not applied anywhere. This Worker
// re-implements the same rules at the edge.
//
// Setup (Cloudflare dashboard):
//   1. Workers & Pages → Create Worker → paste this code → Deploy.
//   2. Workers & Pages → your worker → Settings → Triggers → Add Route:
//        nasrallahrafi.me/*   (zone: nasrallahrafi.me)
//   3. Confirm DNS record for nasrallahrafi.me is proxied (orange cloud),
//      not "DNS only" — Workers routes only intercept proxied traffic.
//
// If you'd rather not maintain a Worker, the no-code equivalent is
// Cloudflare dashboard → Caching → Cache Rules, with one rule per path
// pattern below setting "Edge Cache TTL" / Cache-Control accordingly.

export default {
  async fetch(request) {
    const response = await fetch(request);
    const url = new URL(request.url);
    const path = url.pathname;

    let cacheControl = null;
    if (path.startsWith('/assets/img/') || path.startsWith('/assets/pdf/')) {
      cacheControl = 'public, max-age=31536000, immutable';
    } else if (path.startsWith('/css/') || path.startsWith('/js/')) {
      cacheControl = 'public, max-age=86400';
    } else if (path === '/' || path.endsWith('.html')) {
      cacheControl = 'public, max-age=3600';
    }

    if (!cacheControl) {
      return response; // pass through untouched (e.g. server.log, robots.txt)
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', cacheControl);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
