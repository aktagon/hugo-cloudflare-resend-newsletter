#!/bin/bash

set -e

# Newsletter installation script for existing Hugo sites
# Usage: ./scripts/install.sh /path/to/your/hugo/site

if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-hugo-site>"
    echo "Example: $0 /home/user/my-hugo-site"
    exit 1
fi

HUGO_SITE_PATH="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$HUGO_SITE_PATH" ]; then
    echo "Error: Hugo site directory '$HUGO_SITE_PATH' does not exist"
    exit 1
fi

echo "Installing newsletter system into Hugo site: $HUGO_SITE_PATH"

# Create directories if they don't exist
mkdir -p "$HUGO_SITE_PATH/layouts/partials"
mkdir -p "$HUGO_SITE_PATH/functions/api"

# Copy Hugo files
echo "Copying Hugo partial template..."
cp "$PROJECT_ROOT/layouts/partials/newsletter-signup.html" "$HUGO_SITE_PATH/layouts/partials/"

# Copy Cloudflare functions
echo "Copying Cloudflare functions..."
cp "$PROJECT_ROOT/functions/api/subscribe.js" "$HUGO_SITE_PATH/functions/api/"
cp "$PROJECT_ROOT/functions/api/unsubscribe.js" "$HUGO_SITE_PATH/functions/api/"

# Copy worker files
echo "Copying worker configuration..."
cp -r "$PROJECT_ROOT/workers" "$HUGO_SITE_PATH/"
cp "$PROJECT_ROOT/newsletter-schema.sql" "$HUGO_SITE_PATH/"
cp "$PROJECT_ROOT/wrangler.toml" "$HUGO_SITE_PATH/"

# Copy newsletter templates
echo "Copying newsletter templates..."
cp -r "$PROJECT_ROOT/newsletter" "$HUGO_SITE_PATH/"

# Handle package.json dependencies
if [ -f "$PROJECT_ROOT/package.json" ]; then
    if [ -f "$HUGO_SITE_PATH/package.json" ]; then
        echo "Note: package.json already exists in your Hugo site."
        echo "Please manually merge any dependencies from $PROJECT_ROOT/package.json"
        echo "into your existing package.json file."
    else
        echo "Copying package.json..."
        cp "$PROJECT_ROOT/package.json" "$HUGO_SITE_PATH/"
    fi
else
    echo "Note: No package.json in newsletter project - no npm dependencies to install."
fi

echo ""
echo "Files copied successfully!"
echo ""
echo "Next steps:"
echo ""
echo "1. Add newsletter configuration to your Hugo config:"
echo "   # In your hugo.toml or config.yaml"
echo "   [params.newsletter]"
echo "   title = \"Weekly Newsletter\""
echo "   placeholder = \"your@email.com\""
echo "   button = \"Subscribe\""
echo "   success = \"Subscribed!\""
echo "   error = \"Try again\""
echo ""
echo "2. Include the partial in your Hugo templates:"
echo "   {{ partial \"newsletter-signup.html\" . }}"
echo ""
echo "3. Install dependencies:"
echo "   cd $HUGO_SITE_PATH"
echo "   npm install"
echo ""
echo "4. Follow the Cloudflare Deployment steps in README.md:"
echo "   - Create D1 database"
echo "   - Set environment variables in wrangler.toml"
echo "   - Set secrets (RESEND_API_KEY, etc.)"
echo "   - Deploy with 'wrangler deploy'"
echo ""
echo "Installation complete!"
