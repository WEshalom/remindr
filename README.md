# RemindR

Reminder & notification app with a React (Vite) client and an Express/MongoDB backend.

## Database

The backend uses MongoDB via Mongoose (`server/models`). Start a local, persistent
MongoDB with Docker:

```bash
docker compose up -d
```

This runs MongoDB 7 in a container and stores its data in the `mongo_data` Docker
volume, so data survives container restarts. It listens on `mongodb://localhost:27017`,
matching the default `MONGODB_URI` in `server/.env.example`.

If no MongoDB is reachable at startup, the server automatically falls back to an
in-memory MongoDB instance for convenience (see `server/config/db.js`) — useful for
quick local testing, but data is lost every time the server restarts. For anything
you want to keep, run `docker compose up -d` first.

To stop and remove the database container (data is preserved in the volume):

```bash
docker compose down
```

To wipe the database entirely, also remove the volume:

```bash
docker compose down -v
```

## Backend setup

```bash
cd server
cp .env.example .env   # then edit JWT_SECRET, etc.
npm install
npm run dev             # starts the API on http://localhost:5000
```

Seed the database with a demo user, contacts, groups, and reminders (requires the
server to be running):

```bash
npm run seed
```

Login with `demo@remindr.app` / `demo123456` after seeding.

## Frontend setup

```bash
cd client
npm install
npm run dev
```

## Deploying to Render

The server serves the built client as static files in production (`server/index.js`),
so the whole app deploys as a single Render web service — one URL, and the client's
relative `/api` calls just work.

**Prerequisite:** a MongoDB database reachable from the internet, e.g. a free
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 cluster. Allow network access
from anywhere (`0.0.0.0/0`), since Render doesn't provide a fixed outbound IP on the
free tier.

**Option A — Blueprint (`render.yaml`):**

1. In the Render dashboard: New → Blueprint → select this repo/branch.
2. Render reads `render.yaml` and creates the `remindr` web service.
3. Fill in the two secret env vars it prompts for: `MONGODB_URI` (your Atlas connection
   string) and `JWT_SECRET` (any random string).
4. Deploy. Render builds both `client` and `server`, then starts the API, which also
   serves the built frontend.

**Option B — Manual web service:**

1. New → Web Service → connect this repo/branch.
2. Build command: `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
3. Start command: `npm start --prefix server`
4. Env vars: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`.
5. Deploy, then open the service URL in a browser.
