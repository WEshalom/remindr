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
