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

    // Fetch all symbols in parallel using /price endpoint
    // /price costs 1 credit per symbol but is fast and reliable
    await Promise.all(symbols.map(async sym => {
      try {
        const resp = await fetch(
          `https://api.twelvedata.com/price?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`
        );
        const data = await resp.json();
        
        if (data.price && parseFloat(data.price) > 0) {
          results[sym] = { price: data.price };
        } else {
          // Try previous close via eod endpoint as fallback
          const eodResp = await fetch(
            `https://api.twelvedata.com/eod?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`
          );
          const eodData = await eodResp.json();
          if (eodData.close) {
            results[sym] = { price: eodData.close, stale: true };
          } else {
            results[sym] = { error: 'No price data' };
          }
        }
      } catch(e) {
        results[sym] = { error: e.message };
      }
    }));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response('Signal Tracker API Proxy v5', {
    status: 200,
    headers: {...corsHeaders, 'Content-Type': 'text/plain'}
  });
}
