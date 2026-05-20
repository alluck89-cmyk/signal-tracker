export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    // Proxy /price requests to Twelve Data
    if (url.pathname === '/price') {
      try {
        const tdUrl = 'https://api.twelvedata.com/price' + url.search;
        const resp = await fetch(tdUrl);
        const data = await resp.text();
        return new Response(data, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({error: e.message}), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  }
};
