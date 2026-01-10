# The Sauce

A Next.js web application with Supabase backend.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Deployment**: Vercel
- **Language**: TypeScript

## Prerequisites

- **Node.js**: v18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **1Password CLI**: Required for environment setup
  ```bash
  brew install 1password-cli
  op signin
  ```
- **Vercel CLI**: Required for deployments
  ```bash
  npm i -g vercel
  vercel login
  ```

## Getting Started

### 1. Clone and Install

```bash
git clone <YOUR_GIT_URL>
cd thesauce
npm install
```

### 2. Setup Environment Variables

The easiest way to setup your local environment is using the 1Password CLI:

```bash
npm run env:setup
```

This fetches secrets from the `Engineering-Staging/sauce-web` vault and creates `.env.local`.

**Manual Setup**: If you prefer not to use 1Password CLI, copy `.env.example` to `.env.local` and fill in the values from 1Password manually.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | 1Password `project_url` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | 1Password `api_key` |
| `NEXT_PUBLIC_APP_URL` | App URL for auth redirects | Set per environment |
| `NEXT_PUBLIC_APP_ENV` | Environment identifier | `development`/`staging`/`production` |

### 1Password Vaults

| Environment | Vault | Item |
|-------------|-------|------|
| Local/Staging | `Engineering-Staging` | `sauce-web` |
| Production | `Engineering-Prod` | `sauce-web` |

## Deployment

### Deploy Environment Variables to Vercel

Before deploying, ensure environment variables are set in Vercel:

```bash
# Deploy staging env vars
npm run env:deploy:staging

# Deploy production env vars
npm run env:deploy:prod
```

### Deploy Application

```bash
# Preview/Staging deployment
vercel

# Production deployment
vercel --prod
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run env:setup` | Setup local env from 1Password |
| `npm run env:deploy:staging` | Deploy staging env vars to Vercel |
| `npm run env:deploy:prod` | Deploy production env vars to Vercel |

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── portal/            # User portal
│   └── page.tsx           # Landing page
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and Supabase clients
├── scripts/               # Environment setup scripts
├── supabase/              # Supabase config and migrations
└── types/                 # TypeScript type definitions
```
