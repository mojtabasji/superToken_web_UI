SuperTokens Dashboard Server (Standalone)
========================================

A minimal Node.js/Express server that runs the official SuperTokens Dashboard against your self‑hosted SuperTokens Core.

What’s included
---------------
- SuperTokens Dashboard recipe, protected by an API key
- Session recipe (required by the Dashboard)
- UserRoles recipe (roles & permissions management in the Dashboard)
- Passwordless recipe configured for PHONE-only with USER_INPUT_CODE
- Custom SMS delivery via HTTP POST to your provider (configurable via env)
- Single, fixed port (no auto-retry) configured via env

Prerequisites
-------------
- Node.js 18+ (or newer)
- A reachable SuperTokens Core (self-hosted)

Setup
-----
1) Copy `.env.local.example` to `.env.local` and set values:

	 Required
	 - `CORE_URL`              # e.g. http://localhost:3567 or https://your-core
	 - `DASHBOARD_PORT`        # default 3434
	 - `DASHBOARD_API_KEY`     # strong secret to protect the dashboard

	 Optional
	 - `CORE_API_KEY`          # if your Core requires an API key
	 - `CORE_INSECURE_TLS`     # set `true` only in dev if using self-signed certs
	 - `SMS_API_URL`           # where to POST SMS messages
	 - `SMS_API_TOKEN`         # auth token for your SMS service (sent as Bearer)
	 - `SMS_SENDER`            # sender name/number (provider-dependent)

2) Install dependencies

3) Run the server

How to run
----------
- Start: `npm run dashboard`
- Open the Dashboard:
	- Actual path: `http://localhost:3434/auth/dashboard`
	- Convenience: `http://localhost:3434/dashboard` (redirects to the above)

Security notes
--------------
- Keep `DASHBOARD_API_KEY` secret and strong.
- Do not enable `CORE_INSECURE_TLS` in production.
- Restrict network access to this service (allow only admins / VPN).

Troubleshooting
---------------
- “TypeError: fetch failed … undici”
	- Check that `CORE_URL` is correct and Core is reachable (`/hello`).
	- If using self-signed HTTPS for Core, set `CORE_INSECURE_TLS=true` for local/dev.
- “Port … unavailable (EADDRINUSE)”
	- Another process is using the port. Change `DASHBOARD_PORT` in `.env.local` and restart.
- SMS not sending
	- Verify `SMS_API_URL` and token; inspect server logs for response status.
	- The server POSTs JSON: `{ phone, message, sender }` to `SMS_API_URL` with `Authorization: Bearer <SMS_API_TOKEN>` if provided.

License
-------
Apache-2.0 or MIT (choose and update accordingly).

