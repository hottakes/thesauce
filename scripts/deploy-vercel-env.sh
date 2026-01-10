#!/bin/bash
# =============================================================================
# Deploy Environment Variables to Vercel
# =============================================================================
# Deploys env vars from 1Password to Vercel for staging or production.
# Usage: ./scripts/deploy-vercel-env.sh staging|production
# Requires: 1Password CLI (op), Vercel CLI (vercel)
# =============================================================================

set -e

ENV=$1
ITEM="sauce-web"

# Validate argument
if [ -z "$ENV" ]; then
    echo "Usage: $0 staging|production"
    exit 1
fi

# Set environment-specific values
case $ENV in
    staging)
        VAULT="Engineering-Staging"
        APP_URL="https://staging.thesauce.app"  # Update with actual staging URL
        VERCEL_ENV="preview"
        ;;
    production)
        VAULT="Engineering-Prod"
        APP_URL="https://thesauce.app"  # Update with actual production URL
        VERCEL_ENV="production"
        ;;
    *)
        echo "Error: Invalid environment '$ENV'"
        echo "Usage: $0 staging|production"
        exit 1
        ;;
esac

echo "Deploying environment variables to Vercel ($VERCEL_ENV)..."
echo "Vault: $VAULT"
echo "Item: $ITEM"
echo ""

# Check if op CLI is installed
if ! command -v op &> /dev/null; then
    echo "Error: 1Password CLI (op) is not installed."
    echo "Install it with: brew install 1password-cli"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed."
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Check if signed in to 1Password
if ! op account get &> /dev/null; then
    echo "Error: Not signed in to 1Password CLI."
    echo "Sign in with: op signin"
    exit 1
fi

echo "Fetching secrets from 1Password..."

SUPABASE_URL=$(op read "op://$VAULT/$ITEM/project_url")
SUPABASE_ANON_KEY=$(op read "op://$VAULT/$ITEM/api_key")

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: Failed to fetch secrets from 1Password."
    exit 1
fi

echo "Setting Vercel environment variables..."

# Remove existing env vars first (ignore errors if they don't exist)
vercel env rm NEXT_PUBLIC_SUPABASE_URL "$VERCEL_ENV" -y 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY "$VERCEL_ENV" -y 2>/dev/null || true
vercel env rm NEXT_PUBLIC_APP_URL "$VERCEL_ENV" -y 2>/dev/null || true
vercel env rm NEXT_PUBLIC_APP_ENV "$VERCEL_ENV" -y 2>/dev/null || true

# Add env vars
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL "$VERCEL_ENV"
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$VERCEL_ENV"
echo "$APP_URL" | vercel env add NEXT_PUBLIC_APP_URL "$VERCEL_ENV"
echo "$ENV" | vercel env add NEXT_PUBLIC_APP_ENV "$VERCEL_ENV"

echo ""
echo "Successfully deployed environment variables to Vercel ($VERCEL_ENV)!"
echo ""
echo "Note: You may need to redeploy your app for changes to take effect:"
echo "  vercel --prod    # for production"
echo "  vercel           # for preview/staging"
