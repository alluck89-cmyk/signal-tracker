addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (url.pathname === '/price') {
    const symbolParam = url.searchParams.get('symbol');
    const apiKey = url.searchParams.get('apikey') || '17045e3606d545e0960bc743c5ad1aef';

    if (!symbolParam) {
      return new Response(JSON.stringify({error: 'Missing symbol'}), {
        status: 400,
        headers: {...corsHeaders, 'Content-Type': 'application/json'}
      });
    }

    const symbols = symbolParam.split(',').map(s => s.trim()).filter(Boolean);
    const results = {};

    await Promise.all(symbols.map(async sym => {
      try {
        const resp = await fetch(
          `https://api.twelvedata.com/price?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`,
          {headers: {'User-Agent': 'SignalTracker/1.0'}}
        );
        const data = await resp.json();
        results[sym] = data;
      } catch(e) {
        results[sym] = {error: e.message};
      }
    }));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  // Root — confirm proxy is live
  return new Response('Signal Tracker API Proxy v2', {
    status: 200,
    headers: {...corsHeaders, 'Content-Type': 'text/plain'}
  });
}
