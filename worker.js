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
    
    if (!symbolParam) {
      return new Response(JSON.stringify({error: 'Missing symbol parameter'}), {
        status: 400,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }

    const symbols = symbolParam.split(',').map(s => s.trim());
    const apiKey = url.searchParams.get('apikey') || '17045e3606d545e0960bc743c5ad1aef';

    try {
      // Batch fetch all symbols in parallel
      const promises = symbols.map(sym =>
        fetch(`https://api.twelvedata.com/price?symbol=${sym}&apikey=${apiKey}`)
          .then(r => r.json())
          .then(data => ({ symbol: sym, data }))
          .catch(err => ({ symbol: sym, error: err.message }))
      );

      const results = await Promise.all(promises);
      
      // Transform into batch response format
      const batchResponse = {};
      results.forEach(({ symbol, data, error }) => {
        if (error) {
          batchResponse[symbol] = { error };
        } else {
          batchResponse[symbol] = data;
        }
      });

      return new Response(JSON.stringify(batchResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), {
        status: 500,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }
  }

  return new Response('Signal Tracker API Proxy', { status: 200 });
}
