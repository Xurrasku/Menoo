# Menoo Monorepo

This is a monorepo containing the Menoo application with both frontend and backend.

## Structure

```
Menoo/
  apps/
    web/        # Next.js frontend application
    api/        # FastAPI backend application
  packages/     # Shared packages (future use)
```

## Prerequisites

- Node.js 20+ 
- pnpm 9.0.0+
- Python 3.11+ (for backend)

## Setup

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm@9.0.0
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local` and fill in your values
   - For the web app, copy `apps/web/.env.local.example` to `apps/web/.env.local`
   - See `apps/web/README.md` for full list of required environment variables

4. **Set up Python backend**:
   ```bash
   cd apps/api
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

## Development

Run both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Run individually

- **Frontend only**: `pnpm dev:web`
- **Backend only**: `pnpm dev:api`

## Scripts

- `pnpm dev` - Run both apps in parallel
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests for all apps

## Project-specific documentation

- **Frontend**: See `apps/web/README.md`
- **Backend**: See `apps/api/` for Python FastAPI documentation


