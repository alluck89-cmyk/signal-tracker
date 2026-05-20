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
    const tdUrl = 'https://api.twelvedata.com/price' + url.search;
    try {
      const resp = await fetch(tdUrl);
      const text = await resp.text();
      return new Response(text, {
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
