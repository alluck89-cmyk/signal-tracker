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

    // Process in chunks of 8 to stay within rate limit
    // Wait 500ms between chunks
    const chunkSize = 8;
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async sym => {
        try {
          const resp = await fetch(
            `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`
          );
          const data = await resp.json();

          const price = (data.close && parseFloat(data.close) > 0)
            ? data.close
            : (data.previous_close && parseFloat(data.previous_close) > 0)
              ? data.previous_close
              : null;

          if (price) {
            results[sym] = {
              price: price,
              previous_close: data.previous_close,
              is_market_open: data.is_market_open,
              change: data.change,
              percent_change: data.percent_change
            };
          } else {
            results[sym] = { error: 'No price data' };
          }
        } catch(e) {
          results[sym] = { error: e.message };
        }
      }));

      // Wait 600ms between chunks to respect rate limit
      if (i + chunkSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response('Signal Tracker API Proxy v4', {
    status: 200,
    headers: {...corsHeaders, 'Content-Type': 'text/plain'}
  });
}
