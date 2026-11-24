# Deployment Guide

## Overview
Verdant Nursery uses a dual-deployment model:
- **Backend**: Managed reactive Convex deployment.
- **Frontend**: Single-Page Application (SPA) deployed to Vercel.

## Primary Deployment Command
Deploy both backend schema/functions and frontend build in a single atomic pipeline:
```bash
npx convex deploy --cmd "npm run build"
```
This command:
1. Validates and pushes your Convex schema, indexes, and functions to your production Convex deployment.
2. Executes `npm run build` (`tsc -b && vite build`) to create the production frontend bundle in `dist/`.

## Vercel Production Environment Variables
Configure the following environment variables in the **Vercel Project Settings -> Environment Variables** (Production environment):

| Variable Name | Description | Example / Source |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | Secret deployment key generated in Convex Dashboard under Project Settings -> Deploy Keys | `prod:nursery-app|...` |
| `VITE_CONVEX_URL` | Public URL of your Convex production deployment | `https://xxxx.convex.cloud` |
| `SITE_URL` | Canonical frontend production URL for auth redirects | `https://nursery-app.vercel.app` |

## Pre-Deployment Verification Checklist
Before deploying to production, execute the following commands locally:
1. `npx tsc --noEmit` — Typecheck must pass with 0 errors.
2. `npm run lint` — ESLint must pass with 0 warnings or errors.
3. `npm test` — Automated test suite verifying role guards and tenant isolation must pass.
4. `npm run build` — Production Vite build must succeed.
5. Verify `.env.local` is never staged or committed.
