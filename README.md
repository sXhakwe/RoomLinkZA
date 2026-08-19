# RoomLink ZA

RoomLink ZA is a JavaScript-only full-stack MVP for finding accommodation, compatible roommates, and a supportive local community. It uses React, Node.js, Express, and PostgreSQL. There is no TypeScript or TypeScript tooling in the project.

## MVP coverage

- Registration and login with bcrypt password hashing and JWT sessions
- Editable user profiles and roommate/lifestyle preferences
- Accommodation listing create, read, update, delete, details, ownership checks, images, amenities, and status
- Search by keyword, province, rent, availability, and furnished state
- Basic transparent matching based on location, budget, lifestyle, and shared interests
- Community feed with posts, comments, and reactions
- Private one-to-one conversations and read receipts
- Message reactions, connection requests, accepted matches, and connection removal
- Community events with upcoming/past views, RSVPs, attendance counts, and ratings
- Shared household chores with assignment, due dates, overdue state, and completion progress
- Shared bills with member splits and individual payment tracking
- Saved listings and in-app notifications
- User blocking and reports for users/content
- Admin-only statistics, report review, user role/status controls, listing approval/status controls, platform settings, and an audit log
- Responsive layouts for desktop, tablet, and mobile

## Project structure

```text
roomlink-za/
├── client/                 React + Vite frontend (JavaScript/JSX)
│   └── src/
│       ├── pages/          Feature screens
│       ├── api.js          API client and formatters
│       └── styles.css      Responsive visual system
├── server/                 Express REST API
│   ├── src/db/schema.sql   PostgreSQL migration
│   ├── src/db/seed.js      Demo data
│   ├── src/routes/         Feature routes
│   └── test/               Node test suite
├── .env.example
└── docs/                   Requirements traceability
```

## Quick start

Requirements: Node.js 20 or newer and PostgreSQL 15 or newer. This project does not use Docker.

1. Create a local PostgreSQL database using your installed PostgreSQL tools:

   ```bash
   createdb roomlink_za
   ```

2. Create the API environment file:

   ```bash
   cp .env.example server/.env
   ```

   On Windows PowerShell, use `Copy-Item .env.example server/.env`.

3. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

4. Create the tables and demo data:

   ```bash
   npm run migrate --prefix server
   npm run seed --prefix server
   ```

5. Run the web app and API together:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. The API health check is at `http://localhost:5000/api/health`.

## Demo accounts

All demo accounts use the password `Password123!`.

| Role | Email |
| --- | --- |
| Member | `ayanda@example.com` |
| Member | `thabo@example.com` |
| Administrator | `admin@roomlink.co.za` |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port; defaults to 5000 |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random signing key; use at least 32 characters |
| `CLIENT_URL` | Allowed browser origin for CORS |
| `NODE_ENV` | Set to `production` in production |
| `VITE_API_URL` | Optional frontend API base URL; defaults to `/api` |

## API overview

All routes except registration, login, and health require `Authorization: Bearer <token>`.

- `/api/auth` - register, log in, current user
- `/api/users` - profile, preferences, matches, blocks
- `/api/listings` - discovery, details, CRUD, saves
- `/api/social` - posts, comments, reactions
- `/api/messages` - conversations and messages
- `/api/connections` - requests and established matches
- `/api/events` - events, RSVPs and ratings
- `/api/living` - household members, chores, bills and payments
- `/api/notifications` - notification inbox and read state
- `/api/reports` - submit safety/moderation reports
- `/api/admin` - dashboard, reports, user and content moderation

## Security and production notes

The MVP validates inputs, hashes passwords with bcrypt, signs expiring JWTs, rate-limits authentication, applies secure HTTP headers, restricts CORS, parameterizes SQL, checks listing ownership, enforces account states and roles, and respects blocks in matching, feed, and messaging.

Before production, use an HTTPS reverse proxy, rotate secrets through a secrets manager, restrict image uploads to a validated storage service, add email verification/password recovery, use Redis-backed distributed rate limits, add antivirus scanning for uploads, and implement POPIA retention/export/deletion procedures.

The Administrator account has an additional **Admin** navigation item. Regular members cannot access the admin route or API. The admin control centre includes reports, user and role management, all-listing moderation, a platform audit log, and operational settings. Administrative updates are enforced server-side; hiding the navigation item is not the security boundary.

If this project was copied from another operating system, delete copied `node_modules` folders and run the install commands again. Vite and Rollup use platform-specific packages and copied dependencies can prevent the frontend build from starting.

## Useful commands

```bash
npm test              # backend unit tests
npm run build         # production frontend build
npm start             # start the API
```
