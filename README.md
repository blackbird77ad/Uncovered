# UNCOVERED Platform

MERN MVP for the UNCOVERED / Faceless Voices blueprint.

## Stack

- React + Vite client
- Node.js + Express API
- MongoDB + Mongoose models
- Resend email hooks
- Multer upload scaffolding for private evidence
- In-memory development fallback when `MONGODB_URI` is not set

## Quick Start

```bash
npm install
npm run dev
```

The client runs at `http://localhost:5175` and proxies API calls to `http://localhost:5050`.

## Environment

Copy `server/.env.example` to `server/.env` and fill in real values when ready.

```bash
PORT=5050
CLIENT_ORIGIN=http://localhost:5175
MONGODB_URI=mongodb://127.0.0.1:27017/uncovered
ADMIN_TOKEN=replace-with-random-admin-token
ADMIN_USERNAME=replace-with-private-admin-username
ADMIN_PASSWORD=replace-with-strong-private-admin-password
ADMIN_SESSION_SECRET=replace-with-long-random-admin-session-secret
USER_SESSION_SECRET=replace-with-long-random-user-session-secret
RESEND_API_KEY=re_...
RESEND_FROM=UNCOVERED <no-reply@example.com>
ADMIN_EMAIL=editorial@example.com
UPLOAD_DIR=uploads
```

If `MONGODB_URI` is omitted, the API boots with seeded in-memory stories so the webapp is still usable for design and workflow testing.

## Admin

Open `/admin` and sign in with the private `ADMIN_USERNAME` / `ADMIN_PASSWORD` values from your ignored `server/.env` or deployment secrets. The API does not ship with default admin credentials.
