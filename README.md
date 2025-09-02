# Newsletter Setup

Newsletter system using Cloudflare Workers, D1, and Resend for aktagon.com.

## Setup

1. **Create D1 database**

   ```bash
   wrangler d1 create newsletter_subscribers
   ```

   Update `database_id` in `wrangler.toml` under `env.production.d1_databases` with the returned ID.

2. **Initialize database**

   ```bash
   wrangler d1 execute newsletter_subscribers --file=schema.sql --remote
   ```

3. **Set secrets**

   ```bash
   wrangler secret put RESEND_API_KEY
   wrangler secret put META_COMMENTARY
   ```

4. **Deploy**
   ```bash
   wrangler deploy
   ```

## Hugo Integration

Add to any Hugo template:

```html
{{ partial "newsletter-signup.html" . }}
```

Configure in `config.yaml`:

```yaml
params:
  newsletter:
    title: "Weekly Newsletter"
    placeholder: "albert.zweistein@you.com"
    button: "Subscribe"
    success: "Subscribed!"
    error: "Try again"
```

## Features

- **Signup form**: Hugo partial with customizable text
- **Auto-newsletter**: Sends every Monday at 9 AM
- **RSS parsing**: Finds new posts from last 7 days
- **Subscriber management**: D1 database storage

## Manual newsletter

```bash
wrangler dev --local
curl -X POST http://localhost:8787/__scheduled
```
