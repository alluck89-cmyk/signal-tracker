// Pure API proxy Worker — just handles /price requests
// The HTML app is served separately via GitHub Pages
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  // Proxy price requests to Twelve Data
  if (url.pathname === '/price') {
    const tdUrl = 'https://api.twelvedata.com/price' + url.search;
    const resp = await fetch(tdUrl);
    const text = await resp.text();
    return new Response(text, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response('Signal Tracker API Proxy', { status: 200 });
}
