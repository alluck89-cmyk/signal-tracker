/**
 * Cloudflare Worker for Signal Tracker
 * Proxies price requests to Finnhub API
 * Bypasses CORS issues when called from GitHub Pages
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const symbol = url.searchParams.get('symbol');
      const apikey = url.searchParams.get('apikey');

      if (!symbol || !apikey) {
        return new Response(JSON.stringify({ error: 'Missing symbol or apikey' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const symbols = symbol.split(',').map(s => s.trim());
      const result = {};

      // Fetch prices for each symbol
      for (const sym of symbols) {
        try {
          const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apikey}`;
          const res = await fetch(finnhubUrl);
          const data = await res.json();

          // Finnhub returns: {c: current, pc: previous close, h: high, l: low, o: open, t: timestamp}
          if (data.c && data.c > 0) {
            result[sym] = {
              price: data.c.toString(),
              change: (data.c - data.pc).toFixed(2),
              changePct: ((data.c - data.pc) / data.pc * 100).toFixed(2),
              high: data.h,
              low: data.l,
              open: data.o,
              timestamp: data.t
            };
          } else {
            result[sym] = { price: null, error: 'Invalid data from Finnhub' };
          }
        } catch (err) {
          console.error(`Error fetching ${sym}:`, err);
          result[sym] = { price: null, error: err.message };
        }
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
