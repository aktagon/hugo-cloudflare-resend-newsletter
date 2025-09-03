# Newsletter

This is a simple newsletter system: Resend delivers the emails, while
Cloudflare Pages hosts the signup form on a Hugo site. Cloudflare Functions
handle the subscribe and unsubscribe API endpoints, and a Cloudflare Worker
sends out the newsletter. Subscriber data is stored in a Cloudflare D1 database
table.

## Architecture

- Resend: sends emails
- Cloudflare Pages: hosts your sign up form as part of a Hugo site
- Cloudflare Functions: hosts the unsubscribe & subscribe API endpoints
- Cloudflare Worker: sends the newsletter
- Cloudflare D1: stores the subscribers data in a database table

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/aktagon/hugo-cloudflare-resend-newsletter.git newsletter
cd newsletter
npm install
```

After installation, your Hugo directory structure should look like:

```
newsletter/
├── functions/
│   └── api/
│       ├── subscribe.js      # Cloudflare Pages Function for handling newsletter subscriptions
│       └── unsubscribe.js    # Cloudflare Pages Function for handling unsubscribe requests
├── layouts/
│   └── partials/
│       └── newsletter-signup.html  # Hugo partial template for the signup form
├── workers/
│   ├── package.json         # Node.js dependencies and scripts
│   ├── templates/           # Email templates and static assets
│   ├── wrangler.toml        # Cloudflare Worker configuration with cron triggers
│   └── index.js             # Main Cloudflare Worker script with cron job and email sending
├── hugo.toml                # Hugo site configuration file
├── package.json             # Node.js dependencies and scripts for Cloudflare Functions
├── newsletter-schema.sql     # Database schema for D1 subscribers table
├── wrangler.toml            # Cloudflare Pages configuration and environment variables
└── README.md                # This documentation file
```

Newsletter system using Cloudflare Workers, D1, and Resend for aktagon.com. Automatically sends weekly newsletters every Monday at 9 AM via cron job.

## Installing into Existing Hugo Site

To add this newsletter system to your existing Hugo site:

```bash
git clone https://github.com/aktagon/newsletter.git
cd newsletter
./scripts/install.sh /path/to/your/hugo/site
```

The install script will:

- Copy the Hugo partial template to `layouts/partials/`
- Copy Cloudflare functions to `functions/api/`
- Copy worker files (index.js, schema.sql, wrangler.toml, package.json)
- Provide step-by-step instructions for configuration and deployment

## Resend Account

Sign up at [resend.com](https://resend.com) and get your API key from the dashboard.

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

## Cloudflare Deployment

This system uses a hybrid architecture: Cloudflare Pages for the Hugo site and API endpoints, plus a separate Cloudflare Worker for the cron-triggered newsletter.

### 1. Create D1 database

```bash
wrangler d1 create newsletter_subscribers
```

Update `database_id` in **both** `wrangler.toml` files with the returned ID:
- Root `wrangler.toml` (for Pages Functions)  
- `workers/wrangler.toml` (for cron Worker)

### 2. Initialize database

```bash
wrangler d1 execute newsletter_subscribers --file=newsletter-schema.sql --remote
```

### 3. Configure environment variables

Update **both** wrangler.toml files with your values:

**Root wrangler.toml:**
```toml
[env.production.vars]
NEWSLETTER_SITE_URL = "https://yourdomain.com"
NEWSLETTER_FROM_EMAIL = "newsletter@yourdomain.com"
```

**workers/wrangler.toml:**
```toml
[env.production.vars]
NEWSLETTER_SITE_URL = "https://yourdomain.com"
NEWSLETTER_FROM_EMAIL = "newsletter@yourdomain.com"

[triggers]
crons = ["0 9 * * MON"]  # Monday at 9 AM UTC
```

### 4. Set secrets

Set secrets for both deployments:

```bash
# For Pages Functions (subscribe/unsubscribe)
wrangler secret put RESEND_API_KEY

# For cron Worker (newsletter sending)  
cd workers
wrangler secret put RESEND_API_KEY
wrangler secret put NEWSLETTER_WEEKLY_COMMENTARY
cd ..
```

### 5. Deploy both components

**Deploy Pages Functions** (subscribe/unsubscribe):
```bash
wrangler pages deploy
```

**Deploy cron Worker** (newsletter sending):
```bash
cd workers
wrangler deploy
cd ..
```

## Features

- **Signup form**: Hugo partial with customizable text
- **Auto-newsletter**: Sends every Monday at 9 AM UTC via scheduled worker
- **RSS parsing**: Finds new posts from last 7 days
- **Subscriber management**: D1 database storage
- **Unsubscribe**: One-click unsubscribe links in all emails

## Troubleshooting

**Test newsletter manually**

```bash
wrangler dev --local
curl -X POST http://localhost:8787/__scheduled
```

**Recreate database**

```bash
# Backup subscribers
wrangler d1 execute newsletter --command="CREATE TABLE subscribers_backup AS SELECT * FROM subscribers;" --remote
# Drop subscribers
wrangler d1 execute newsletter --command="DROP TABLE subscribers;" --remote
# recreate subscribers (see newsletter-schema.sql for exact schema)
wrangler d1 execute newsletter --command="CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  unsubscribe_token TEXT UNIQUE
);" --remote
# Restore subscribers
wrangler d1 execute newsletter --command="INSERT INTO subscribers (email, subscribed_at, active) SELECT email, subscribed_at, active FROM subscribers_backup;" --remote
# Drop backup
wrangler d1 execute newsletter --command="DROP TABLE subscribers_backup;" --remote
```
