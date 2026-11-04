# Mini Task Tracker

A small full-stack task tracker built with **React + TypeScript** on the frontend and **Node.js + Express + MongoDB (Mongoose)** on the backend. Users can create tasks, list them, filter by status, change a task's status, and delete a task after confirmation.

The original assignment brief is kept unchanged in [ORIGINAL_ASSIGNMENT.md](ORIGINAL_ASSIGNMENT.md).

---

## Features

- Create a task with a required title (max 100 characters), optional description, status and priority. A creation timestamp is stored automatically.
- Statuses **To Do / In Progress / Done** and priorities **Low / Medium / High**.
- Task list sorted newest first, showing title, description, status, priority and creation date.
- Change a task's status inline from the list.
- Delete a task through a confirmation dialog (cancelling leaves the task untouched).
- Filter by status (All Tasks / To Do / In Progress / Done) — filtering is done by the API.
- Server-side validation with field-level error messages shown next to the form inputs.
- Loading, empty, empty-filter, network-error (with Retry), validation-error and server-error states.
- Responsive layout (single column on mobile, form + list side by side on large screens) with labelled, keyboard-accessible controls.

## Technology stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Fetch API |
| Backend | Node.js, Express 5, TypeScript, Mongoose, Zod |
| Database | MongoDB |
| Testing | Vitest, Supertest, mongodb-memory-server |
| Tooling | npm, ESLint, typescript-eslint |

## Folder structure

```
.
├── client/                    React + Vite frontend
│   ├── src/
│   │   ├── components/        TaskForm, TaskFilters, TaskList, TaskCard, DeleteConfirmation
│   │   ├── services/taskApi.ts  Fetch wrapper + typed API functions + ApiError
│   │   ├── types/task.ts      Task types, enum values and display labels
│   │   ├── App.tsx            Page layout and task state
│   │   └── main.tsx
│   └── .env.example
├── server/                    Express API
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── models/Task.ts     Mongoose schema + shared enum values
│   │   ├── validators/taskValidator.ts  Zod schemas for body, query and params
│   │   ├── controllers/taskController.ts
│   │   ├── routes/taskRoutes.ts
│   │   ├── middleware/errorHandler.ts   Central error → JSON mapping
│   │   ├── app.ts             Express app factory (used by tests)
│   │   └── server.ts          DB connection + HTTP listener
│   ├── tests/task.test.ts
│   └── .env.example
├── ORIGINAL_ASSIGNMENT.md     Assignment brief (unchanged)
├── package.json               Convenience scripts for both packages
└── README.md
```

## Prerequisites

- **Node.js 22.9 or newer** (the scripts use Node's built-in `--env-file-if-exists` flag) and npm.
- **MongoDB 6+** running locally, or a MongoDB Atlas connection string.
- Internet access on the first test run: `mongodb-memory-server` downloads a MongoDB binary (~several hundred MB) into `server/node_modules/.cache`.

## Installation

```bash
npm run install:all
```

(Equivalent to running `npm install` inside `server/` and `client/`.)

## Environment setup

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mini_task_tracker` | MongoDB connection string (required) |
| `NODE_ENV` | `development` | Runtime mode |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin allowed by CORS |

**client/.env**

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000` | Base URL of the API |

No credentials are committed; `.env` files are git-ignored.

## MongoDB configuration

- **Local:** install MongoDB Community Server and start it (default `mongodb://127.0.0.1:27017`). The `mini_task_tracker` database and `tasks` collection are created automatically on the first insert.
- **Docker (optional):** `docker run -d -p 27017:27017 --name mongo mongo:7`
- **Atlas:** set `MONGODB_URI` to your `mongodb+srv://…` connection string in `server/.env`.

## Running the app

Start the backend (terminal 1):

```bash
npm run dev:server        # http://localhost:5000
```

Start the frontend (terminal 2):

```bash
npm run dev:client        # http://localhost:5173
```

Production builds:

```bash
npm run build
npm start --prefix server             # serves the API from server/dist
npm run preview --prefix client       # serves client/dist
```

## Tests and checks

```bash
npm test           # backend API tests (Vitest + Supertest + in-memory MongoDB)
npm run lint       # ESLint for server and client
npm run typecheck  # TypeScript checks for server and client
npm run build      # compile server and build client
```

Tests never touch the database configured in `.env`; each run starts a throw-away in-memory MongoDB and clears it between tests.

| Test | What it checks |
| --- | --- |
| **Invalid task creation** (required) | Empty/whitespace title → 400 with a `title` field error; 101-character title and invalid status/priority → 400 with errors for each field; no document is stored. |
| **Successful status update** (required) | Creates a task, PATCHes its status to `done`, checks the response, then re-reads the document from MongoDB to confirm the change persisted. |
| PATCH error cases | Invalid ObjectId → 400, invalid status → 400, extra fields → 400, unknown id → 404, stored task unchanged. |
| GET filtering | Newest-first ordering, status filter, empty result, invalid filter → 400. |
| DELETE | 204 on success, 404 when deleting again. |

## API

Base URL: `http://localhost:5000`. All bodies are JSON.

### `POST /tasks` — create a task

```json
{ "title": "Write report", "description": "Q3 summary", "status": "todo", "priority": "high" }
```

- `title` — required, trimmed, 1–100 characters
- `description` — optional, up to 1000 characters
- `status` — optional, `todo` | `in_progress` | `done` (default `todo`)
- `priority` — optional, `low` | `medium` | `high` (default `medium`)

`201 Created`

```json
{
  "id": "6650c0…",
  "title": "Write report",
  "description": "Q3 summary",
  "status": "todo",
  "priority": "high",
  "createdAt": "2026-11-04T08:32:55.962Z",
  "updatedAt": "2026-11-04T08:32:55.962Z"
}
```

### `GET /tasks` — list tasks

Optional query `?status=todo|in_progress|done`. Returns `200` with an array sorted newest first (empty array when nothing matches).

### `PATCH /tasks/:id` — update status

Body must contain only `status`:

```json
{ "status": "in_progress" }
```

Returns `200` with the updated task.

### `DELETE /tasks/:id` — delete a task

Returns `204 No Content`.

### Errors

Every error uses the same shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [{ "field": "title", "message": "Title is required" }]
  }
}
```

| Status | When |
| --- | --- |
| 400 | Invalid body, query or id; malformed JSON; unknown fields on PATCH |
| 404 | Task id is valid but does not exist; unknown route |
| 503 | Database unavailable |
| 500 | Unexpected error (generic message; details are logged on the server only) |

## Assumptions and clarifications

- **Database:** the brief says "Build a task tracker using Postgres SQL, React.rs/React.ts and Node.js" but also "Persist data in MongoDB", and the role is described as MERN. MongoDB with Mongoose was chosen because the required-functionality list explicitly asks for MongoDB persistence and every other part of the brief is MERN. The brief itself is left unchanged in `ORIGINAL_ASSIGNMENT.md`.
- **"React.rs/React.ts"** is read as React with TypeScript.
- **Status values:** the UI labels "To Do / In Progress / Done" are stored as `todo / in_progress / done` so API values are stable and URL-safe.
- **PATCH scope:** the brief describes `PATCH /tasks/:id` as "Update task status", so the endpoint accepts only `status` and rejects other fields.
- **Description limit:** not specified in the brief; capped at 1000 characters to prevent unbounded input.
- **Validation location:** validation is enforced on the server (Zod, with Mongoose schema constraints as a second layer). The form deliberately relies on the server's field-level errors rather than duplicating the rules, so there is a single source of truth; it does show a live character counter for the title.
- **UI updates** happen after the server confirms a change (no optimistic updates), so a failed request never leaves the list showing data that was not saved.
- **Authentication** and **cloud deployment** are out of scope, as stated in the brief.

## Limitations

- No authentication or per-user data — all tasks are shared (see below for the production approach).
- No pagination; the list loads every matching task.
- Only status can be edited after creation (as specified); title, description and priority cannot.
- No automated frontend tests; tests cover the API.
- No real-time sync between browser tabs; refresh or change the filter to reload.
- The first test run needs internet access to download the in-memory MongoDB binary.

## Technical decisions

- **Express 5** forwards rejected promises from async route handlers to the error middleware, so controllers stay free of try/catch boilerplate.
- **Zod** validates body, query and route params in one place (`validators/taskValidator.ts`). The enum arrays live in the Mongoose model and are reused by Zod so both layers agree.
- **Central error handler** maps Zod errors, Mongoose validation errors, malformed JSON, 404s and database outages to consistent JSON without leaking stack traces.
- **`createApp()` factory** keeps the Express app independent of the database connection, so tests can connect to an in-memory MongoDB and drive it with Supertest.
- **Server-side filtering** (`GET /tasks?status=…`) follows the brief's API description; `status` is indexed and results are sorted by `createdAt` descending.
- **Frontend state** lives in `App.tsx` with `useState`/`useEffect`; for an app of this size a state library would add more code than it removes. All HTTP calls go through `services/taskApi.ts`, which converts failures into a typed `ApiError` (including "server unreachable").
- **Stale responses** are ignored when the filter changes quickly, and per-task pending state disables controls during requests to prevent duplicate submissions.
- **Native `<dialog>`** for delete confirmation provides focus trapping and Escape-to-close without an extra dependency.
- **Node's built-in `.env` loading** replaces the `dotenv` package.

## Future improvements

- Authentication and task ownership (described below).
- Edit title/description/priority (a separate `PUT`/`PATCH` endpoint with its own schema).
- Pagination or infinite scroll, sorting by priority, and text search.
- Frontend tests with React Testing Library; end-to-end tests with Playwright.
- Share the enum/type definitions between client and server via a small workspace package.
- Docker Compose for one-command local setup, CI pipeline running lint/tests/build, and structured logging/monitoring.
- Optimistic updates with rollback for snappier status changes.

## Authentication and access control for production

Not implemented — this describes how it would be added.

1. **User login:** either use a trusted identity provider (Auth0, Cognito, Azure AD, Google via OpenID Connect) or add a `users` collection with passwords hashed using **argon2id** or **bcrypt**.
2. **Sessions:** issue a short-lived access token (JWT) plus a refresh token, or a server-side session, delivered in an `HttpOnly`, `Secure`, `SameSite` cookie. Add CSRF protection when cookies are used.
3. **Authenticated routes:** an `requireAuth` Express middleware verifies the token/session on every `/tasks` route and attaches `req.user`; unauthenticated requests receive `401`.
4. **Task ownership:** add an indexed `ownerId` field to the Task schema. Every query filters by it (`Task.find({ ownerId: req.user.id, … })`, `findOneAndUpdate({ _id, ownerId })`), so users can never read or change another user's tasks — a mismatched id simply returns `404`.
5. **Role-based permissions (if needed):** store a role (e.g. `member`, `admin`) and use a `requireRole('admin')` middleware for administrative routes.
6. **Hardening:** HTTPS everywhere, `helmet` for security headers, `express-rate-limit` on login and write endpoints, a strict CORS allow-list, secrets in a secret manager rather than `.env`, and audit logging of authentication events.
7. **Frontend:** add login/logout views, a protected route wrapper, and handle `401` by redirecting to login.
