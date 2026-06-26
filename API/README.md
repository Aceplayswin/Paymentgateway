# Payment Gateway System (Auth + Session Service)

This project is a Node.js + Express backend that currently implements user authentication and session management using MySQL (via Sequelize), JWT, HTTP-only cookies, and optional registration email notifications through SMTP.

Even though the repository is named "Payment Gateway System", the current codebase is focused on the **authentication module** (register + login + refresh-token session persistence).

---

## 1) Tech Stack Used

- **Runtime:** Node.js (CommonJS modules)
- **Framework:** Express
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JWT (`jsonwebtoken`)
- **Password Security:** `bcrypt`
- **Cookies:** `cookie-parser`
- **Email:** `nodemailer`
- **Environment Management:** `dotenv`
- **Dev Server:** `nodemon`

---

## 2) Root Folder Structure Explained

### `config/`
- Contains configuration files used by the app.
- `db.js` creates and exports a Sequelize instance connected to MySQL using environment variables.

### `controllers/`
- Contains request handlers (business logic for routes).
- `user.controller.js` handles:
  - user registration
  - user login
  - username generation
  - refresh-token session record creation

### `models/`
- Contains Sequelize model definitions.
- `user.model.js` defines the `users` table schema.
- `userSession.model.js` defines the `user_sessions` table schema and model associations with `users`.

### `routes/`
- Contains Express route definitions.
- `user.routes.js` maps API endpoints to controller methods.

### `utils/`
- Utility/helper modules.
- `mailer.js` builds SMTP transport and sends registration email if SMTP is configured.

### Root files
- `server.js` - application entry point (middleware, route mounting, DB sync, server startup).
- `.env` - runtime environment variables (port, DB, JWT, SMTP, sync flags).
- `package.json` - project metadata, scripts, and dependencies.
- `package-lock.json` - lock file for dependency versions.
- `README.md` - project documentation (this file).

---

## 3) Application Boot Flow (`server.js`)

When the app starts:

1. Imports `express` and creates `app`.
2. Imports `cookie-parser`.
3. Imports Sequelize connection from `config/db`.
4. Imports both models (`user.model`, `userSession.model`) so Sequelize knows all table definitions and associations before sync.
5. Loads environment variables via `dotenv`.
6. Applies middleware:
   - `express.json()` for JSON request bodies
   - `cookieParser()` for cookie parsing support
7. Mounts auth routes under:
   - `/api/auth`
8. Calls `sequelize.sync(...)` with flags from `.env`:
   - `DB_SYNC_ALTER === 'true'` -> schema alteration mode
   - `DB_SYNC_FORCE === 'true'` -> drop and recreate tables
9. Starts HTTP server on `PORT`.

---

## 4) Database Configuration (`config/db.js`)

`db.js` uses:

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST` (fallback `127.0.0.1`)
- `DB_PORT` (fallback `3306`)

And creates:

- `new Sequelize(..., { dialect: 'mysql' })`

This exported Sequelize instance is shared by all models.

---

## 5) Data Models in Detail

## 5.1 `User` Model (`models/user.model.js`)

Mapped table: `users`  
Timestamps: enabled (`createdAt`, `updatedAt`)

Columns:

- `id` - integer primary key, auto-increment
- `username` - string, required, unique
- `first_name` (`firstName`) - string, required
- `last_name` (`lastName`) - string, required
- `email` - string, required, unique
- `phone_number` (`phoneNumber`) - string, optional, unique
- `password` - string, required (stored hashed)
- `last_login` (`lastLogin`) - date, optional

Notes:
- Field mapping is done with Sequelize `field` for snake_case DB columns and camelCase JS property names.

## 5.2 `UserSession` Model (`models/userSession.model.js`)

Mapped table: `user_sessions`  
Timestamps: enabled (`createdAt`, `updatedAt`)

Columns:

- `id` - integer primary key, auto-increment
- `user_id` (`userId`) - integer, required, FK -> `users.id`
- `refresh_token` (`refreshToken`) - text, required, unique
- `expires_at` (`expiresAt`) - date, required
- `is_revoked` (`isRevoked`) - boolean, required, default `false`
- `ip_address` (`ipAddress`) - string, optional
- `user_agent` (`userAgent`) - string, optional
- `last_used_at` (`lastUsedAt`) - date, default now

Associations:

- `User.hasMany(UserSession, { as: 'sessions' })`
- `UserSession.belongsTo(User, { as: 'user' })`

This enables one user to have multiple login sessions.

---

## 6) Routes (`routes/user.routes.js`)

All routes are mounted under `/api/auth` from `server.js`.

Defined routes:

- `POST /api/auth/register` -> `userController.register`
- `POST /api/auth/login` -> `userController.login`

---

## 7) Controller Logic (`controllers/user.controller.js`)

This file contains helpers and two main handlers.

## 7.1 Helper: Username Generation

### `buildUsernameBase(firstName, lastName)`
- Takes first 2 chars of first name and first 2 chars of last name.
- Converts to lowercase.
- If name is too short, fills missing chars with `x`.
- Example:
  - `John Doe` -> `jodo`
  - `A B` -> `axbx`

### `generateUniqueUsername(firstName, lastName)`
- Builds base from helper above.
- Tries up to 10 times:
  - appends random 4-digit number
  - checks if username already exists
- If still colliding, uses `Date.now()` as fallback suffix.

Result: username uniqueness without asking user to choose one manually.

## 7.2 Helper: Session Creation

### `createUserSession(req, userId, refreshToken)`
- Decodes refresh token to read JWT `exp`.
- Converts expiry to JS `Date`.
- If decode/exp missing, fallback expiry = `Date.now() + REFRESH_TOKEN_MAX_AGE`.
- Stores session in `user_sessions` with:
  - `userId`
  - `refreshToken`
  - `expiresAt`
  - request `ipAddress` (`req.ip`)
  - request `userAgent` (`req.get('user-agent')`)

## 7.3 `register` Flow

1. Reads `firstName`, `lastName`, `email`, `phoneNumber`, `password` from request body.
2. Checks existing user by email.
3. If exists -> returns `400` with `"User already exists"`.
4. Hashes password with bcrypt salt rounds `10`.
5. Generates unique username.
6. Creates user record in DB.
7. Attempts to send registration email.
   - Email failures are logged but do not fail registration.
8. Returns `201` with user details (without password).

## 7.4 `login` Flow

1. Reads `email`, `password` from body.
2. Finds user by email.
3. If not found -> `404` `"User not found"`.
4. Compares password with bcrypt.
5. If mismatch -> `401` `"Invalid Credentials"`.
6. Generates:
   - `accessToken` (expiry from `EXPIRES_TOKEN`)
   - `refreshToken` (expiry from `REFRESH_TOKEN`)
7. Saves refresh token as a session row in `user_sessions`.
8. Sets cookie:
   - name: `refreshToken`
   - `httpOnly: true`
   - `sameSite: "strict"`
   - `secure: false` (currently non-HTTPS/dev-friendly)
   - `maxAge: REFRESH_TOKEN_MAX_AGE`
9. Updates `user.lastLogin`.
10. Returns `200` with user data + access token + refresh token.

---

## 8) Mail Utility (`utils/mailer.js`)

Main responsibilities:

1. Check whether SMTP configuration exists.
2. Lazily create and reuse a Nodemailer transporter.
3. Send a welcome email on registration.

Key behavior:

- If SMTP env variables are incomplete, registration email is skipped gracefully.
- App continues to work even without mail setup.
- Uses:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
  - `SMTP_USER`, `SMTP_PASS`
  - `SMTP_FROM`
  - `APP_NAME` for branding in subject/body

---

## 9) Environment Variables (`.env`) Explained

Current variables used by code:

- `PORT` - Express server port
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `JWT_SECRET` - signing key for JWT (access + refresh in current implementation)
- `EXPIRES_TOKEN` - access token duration (example: `15m`)
- `REFRESH_TOKEN` - refresh token duration (example: `7d`)
- `REFRESH_TOKEN_MAX_AGE` - cookie max age in milliseconds
- `DB_SYNC_ALTER` - if `true`, Sequelize alter sync
- `DB_SYNC_FORCE` - if `true`, Sequelize force sync (drops/recreates tables)
- `APP_NAME` - email/app display name
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - SMTP config

Security note:
- Never commit real secrets in `.env` (especially `JWT_SECRET` and SMTP credentials).
- Use different secrets for development and production.

---

## 10) API Contract (Current)

## 10.1 Register

Endpoint: `POST /api/auth/register`

Request body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "9876543210",
  "password": "StrongPassword123"
}
```

Success response: `201 Created`
- Returns `success`, `message`, and sanitized user object.

## 10.2 Login

Endpoint: `POST /api/auth/login`

Request body:

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

Success response: `200 OK`
- Returns user object, `accessToken`, and `refreshToken`
- Also sets `refreshToken` as HTTP-only cookie

---

## 11) How to Run Locally

1. Install dependencies:
   - `npm install`
2. Configure `.env` values for your MySQL and app settings.
3. Start development server:
   - `npm run dev`
4. Base URL:
   - `http://localhost:<PORT>`

---

## 12) Current Behavior Summary

- Auth routes are functional (`register`, `login`).
- Passwords are hashed before storage.
- JWT access and refresh tokens are generated.
- Refresh token sessions are persisted in DB with device/IP metadata.
- Last login time is updated on successful login.
- Registration email is optional and non-blocking.

---

## 13) Gaps / Next Improvements

Based on current code, likely next steps for a production-grade auth system:

1. Add input validation (required fields, formats, password policy).
2. Add refresh-token rotation + refresh endpoint.
3. Add logout endpoint to revoke sessions (`isRevoked = true`).
4. Add auth middleware to protect routes using access token.
5. Add rate limiting and brute-force protection for login.
6. Set `secure: true` cookies in HTTPS production.
7. Separate access/refresh JWT secrets.
8. Add tests (unit + integration for auth flows).

---

## 14) Scripts (`package.json`)

- `npm run dev` -> starts server with nodemon (`server.js`)
- `npm test` -> placeholder script currently returns error

---

## 15) Quick Module Dependency Map

- `server.js`
  - uses `config/db.js`
  - loads `models/user.model.js`
  - loads `models/userSession.model.js`
  - mounts `routes/user.routes.js`
- `routes/user.routes.js`
  - calls `controllers/user.controller.js`
- `controllers/user.controller.js`
  - uses `models/user.model.js`
  - uses `models/userSession.model.js`
  - uses `utils/mailer.js`
- `utils/mailer.js`
  - wraps `nodemailer`

This is the complete working flow of the current repository.
