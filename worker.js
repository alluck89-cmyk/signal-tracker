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

    await Promise.all(symbols.map(async sym => {
      try {
        // Use /quote which returns previous_close when market is closed
        const resp = await fetch(
          `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`
        );
        const data = await resp.json();

        // Use close price, fall back to previous_close when market closed
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
          results[sym] = { error: 'No price data', raw: data };
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

  return new Response('Signal Tracker API Proxy v3', {
    status: 200,
    headers: {...corsHeaders, 'Content-Type': 'text/plain'}
  });
}
