# Cloudflare Worker Setup

This project includes a Cloudflare Worker to proxy price requests from Finnhub API, bypassing CORS issues on GitHub Pages.

## Files

- `src/worker.js` - Worker script that fetches stock prices from Finnhub
- `wrangler.toml` - Wrangler configuration

## Setup Instructions

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Deploy the Worker
```bash
wrangler deploy
```

This will deploy to: `https://signal-tracker.alluck89.workers.dev`

### 4. Verify Deployment

Test the worker endpoint:
```bash
curl "https://signal-tracker.alluck89.workers.dev/price?symbol=SPY,AAPL&apikey=17045e3606d545e0960bc743c5ad1aef"
```

Expected response:
```json
{
  "SPY": {
    "price": "754.32",
    "change": "2.15",
    "changePct": "0.29"
  },
  "AAPL": {
    "price": "225.50",
    "change": "-1.20",
    "changePct": "-0.53"
  }
}
```

## How It Works

1. **Frontend** (`index.html`) calls the worker with: `?symbol=SPY,AAPL&apikey=YOUR_KEY`
2. **Worker** splits symbols and fetches from Finnhub API
3. **Response** returns prices with change data
4. **Frontend** updates live prices every 15 seconds

## Alternative: Direct Finnhub (No Worker)

If you don't want to use Cloudflare Workers, update `index.html` line 349:

```javascript
var TD_BASE = 'https://finnhub.io/api/v1'; // Direct Finnhub instead of worker
```

Then update `fetchREST()` to call Finnhub directly (see comments in index.html).

## Troubleshooting

- **Worker not responding?** Check deployment: `wrangler deployments list`
- **404 errors?** Verify worker name matches `signal-tracker.alluck89.workers.dev`
- **Price data empty?** Check Finnhub API key is valid
- **CORS errors?** Ensure `Access-Control-Allow-Origin: *` header is set in worker
