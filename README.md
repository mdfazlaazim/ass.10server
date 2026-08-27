# Digital Life Lessons — Server

Backend API for the Digital Life Lessons platform. Built with Express, MongoDB, Better Auth, and Stripe.

## Purpose

Provides REST API endpoints for authentication, lesson management, favorites, comments, reports, admin operations, and Stripe premium payments.

## Live URL

Deploy to Render/Railway/Vercel (server) — update after deployment.

## Key Features

- Better Auth (email/password + Google OAuth)
- MongoDB with Mongoose models
- Token verification on protected routes
- Stripe checkout & webhook for Premium upgrade (৳1500 lifetime)
- Admin dashboard API (users, lessons, reports)
- Search, filter, sort, pagination on public lessons
- Owner/admin authorization for edit/delete

## NPM Packages

- `express` — Web server
- `mongoose` — MongoDB ODM
- `better-auth` — Authentication
- `mongodb` — Better Auth adapter
- `cors` — Cross-origin requests
- `dotenv` — Environment variables
- `stripe` — Payment processing

## Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in MongoDB URI, Better Auth secret, Stripe keys, Google OAuth
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | Server URL |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `STRIPE_SECRET_KEY` | Stripe test secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Admin Setup

1. Register with email `admin@digitallife.com` (or set `ADMIN_EMAIL` in env)
2. Run `node src/seedAdmin.js` to promote user to admin role

## API Routes

- `GET/POST /api/auth/*` — Better Auth endpoints
- `GET /api/lessons/public` — Public lessons (search, filter, sort, pagination)
- `GET/POST/PUT/DELETE /api/lessons/*` — Lesson CRUD
- `GET/POST /api/favorites/*` — Favorites
- `GET/POST /api/comments/*` — Comments
- `POST /api/reports/*` — Report lessons
- `GET/PUT /api/users/*` — User profile
- `GET/PUT/DELETE /api/admin/*` — Admin operations
- `POST /api/stripe/create-checkout-session` — Stripe checkout
