addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  if (url.pathname === '/price') {
    const symbolParam = url.searchParams.get('symbol');
    const apiKey = url.searchParams.get('apikey') || '17045e3606d545e0960bc743c5ad1aef';
    
    if (!symbolParam) {
      return new Response(JSON.stringify({error: 'Missing symbol'}), {
        status: 400,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }

    const symbols = symbolParam.split(',').map(s => s.trim());
    const results = {};

    await Promise.all(symbols.map(async sym => {
      try {
        const resp = await fetch(
          `https://api.twelvedata.com/price?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`
        );
        const data = await resp.json();
        results[sym] = data;
      } catch(e) {
        results[sym] = {error: e.message};
      }
    }));

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response('Signal Tracker API Proxy', {status: 200});
}
