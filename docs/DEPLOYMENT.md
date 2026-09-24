# 360FOS Tactical Intelligence — Deployment

## Target architecture

- Web: Vercel -> Next.js (apps/web)
- API: Render -> NestJS (apps/api)
- Data/Auth: Supabase
- Source of truth: GitHub branch feature/mvp-foundation

## API — Render

Create a Render Web Service from this repository and use the repository root.
The repository includes render.yaml with the API build, start, and health-check configuration.

Required environment variables:
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- CORS_ORIGIN

CORS_ORIGIN should be the final Vercel origin, for example https://your-project.vercel.app.
The API health endpoint is /api/v1/health.

## Web — Vercel

Create a Vercel project from the same repository.
Recommended settings:
- Framework: Next.js
- Root Directory: apps/web
- Production Branch: feature/mvp-foundation during MVP acceptance
- Node.js: 20.x

Required environment variables:
- NEXT_PUBLIC_API_URL = deployed Render API base URL ending in /api/v1
- NEXT_PUBLIC_SUPABASE_URL = https://hhrxibzznflzmkltando.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = Supabase publishable key

Never expose a Supabase service-role/secret key to the web app.

## Supabase Auth

Add the final Vercel site URL to Supabase Auth URL configuration.
Configure the site URL and the /auth/callback redirect URL. Add the custom production domain and callback when available.

## Acceptance sequence

1. Deploy API.
2. Confirm GET /api/v1/health returns healthy.
3. Set NEXT_PUBLIC_API_URL in Vercel.
4. Deploy web.
5. Set CORS_ORIGIN in Render to the final Vercel origin.
6. Test Magic Link login.
7. Test organization onboarding.
8. Test Team, Opponent, Competition, and Match.
9. Test Evidence, Analysis, and Intelligence Matrix.
10. Test Tactical Gap, Training Priority, and Session Builder.
11. Test Coach Command Center.
12. Test Session Performance and Learning.
13. Only after acceptance, promote the production branch/domain.

## Database reproducibility note

Supabase currently contains the learning-engine tables, while the corresponding migration file is ahead of the recorded migration history. Reconcile migration history before treating the database as fully reproducible from a clean environment.