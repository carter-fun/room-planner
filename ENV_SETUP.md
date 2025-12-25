# Auth0 v4 SDK Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Your Auth0 domain (e.g., your-tenant.us.auth0.com or your-tenant.auth0.com)
AUTH0_DOMAIN='YOUR_DOMAIN.auth0.com'

# Your Auth0 application's Client ID
AUTH0_CLIENT_ID='YOUR_CLIENT_ID'

# Your Auth0 application's Client Secret
AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'

# Generate with: openssl rand -hex 32
# This is used to encrypt the session cookie
AUTH0_SECRET='your-secret-here-generate-with-openssl-rand-hex-32'

# Your application's base URL (optional but recommended)
APP_BASE_URL='http://localhost:3000'
```

## Setup Instructions

1. Go to [auth0.com](https://auth0.com) and create a free account
2. Create a new **"Regular Web Application"** (not SPA)
3. In your application's Settings, configure:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Copy your **Domain** (from the Basic Information section), **Client ID**, and **Client Secret**
5. Create `.env.local` file in the project root with the values above
6. Generate `AUTH0_SECRET` by running:
   ```bash
   openssl rand -hex 32
   ```
   Or on Windows PowerShell:
   ```powershell
   -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
   ```

## Quick Setup (Using Auth0 CLI)

If you have the Auth0 CLI installed, you can automatically create the app and generate the `.env.local` file:

**Mac/Linux:**
```bash
AUTH0_APP_NAME="Room Planner" && \
auth0 login --no-input && \
auth0 apps create -n "${AUTH0_APP_NAME}" -t regular \
  -c http://localhost:3000/auth/callback \
  -l http://localhost:3000 \
  -o http://localhost:3000 \
  --reveal-secrets --json \
  > auth0-app-details.json && \
CLIENT_ID=$(jq -r '.client_id' auth0-app-details.json) && \
CLIENT_SECRET=$(jq -r '.client_secret' auth0-app-details.json) && \
DOMAIN=$(auth0 tenants list --json | jq -r '.[] | select(.active == true) | .name') && \
SECRET=$(openssl rand -hex 32) && \
echo "AUTH0_DOMAIN=${DOMAIN}" > .env.local && \
echo "AUTH0_CLIENT_ID=${CLIENT_ID}" >> .env.local && \
echo "AUTH0_CLIENT_SECRET=${CLIENT_SECRET}" >> .env.local && \
echo "AUTH0_SECRET=${SECRET}" >> .env.local && \
echo "APP_BASE_URL=http://localhost:3000" >> .env.local && \
rm auth0-app-details.json && \
echo ".env.local file created!" && \
cat .env.local
```

## For Production

Update `APP_BASE_URL` to your production domain (e.g., `https://yourdomain.com`) and add that domain to the Auth0 allowed URLs in your application settings.

## Authentication Routes

The Auth0 v4 SDK automatically creates these routes via middleware:
- `/auth/login` - Login route
- `/auth/logout` - Logout route  
- `/auth/callback` - OAuth callback route
- `/auth/profile` - User profile route
- `/auth/access-token` - Access token route

