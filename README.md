SuperTokens Admin Web UI (Open Source)
=====================================

Minimal admin UI to view and manage users and tenants from a self-hosted SuperTokens Core, with a simple env-based admin login.

What it does
------------
- Reads Core connection from environment: `CORE_URL`, `CORE_API_KEY` (optional), `CORE_CDI_VERSION` (optional)
- Simple admin auth using `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Lists users with pagination and allows deleting a user
- Lists tenants

Getting started
---------------
1. Copy `.env.local.example` to `.env.local` and set values
2. Install dependencies
3. Run the dev server

Required environment
--------------------
See `.env.local.example`:

```
CORE_URL=http://localhost:3567
CORE_API_KEY=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
```

Scripts
-------
- `pnpm dev` or `npm run dev` to start development server
- `pnpm build` / `pnpm start` or `npm run build` / `npm start` to build & run
- `npm run dashboard` to start the standalone SuperTokens Dashboard server (Express)

Security notes
--------------
- This UI uses a signed HTTP-only cookie to keep an admin session for 2 hours.
- For production, use HTTPS and a strong `ADMIN_PASSWORD`. Consider adding a dedicated secret.
- Ensure the app is not exposed to the public Internet without proper access control.

SuperTokens Dashboard (optional)
--------------------------------
This repo includes a small Express server that runs the official SuperTokens Dashboard recipe connected to your self-hosted Core.

- Configure in `.env.local`:
	- `CORE_URL` and optional `CORE_API_KEY`
	- `DASHBOARD_PORT` (default `3434`)
	- `DASHBOARD_API_KEY` (required; set a strong value)
- Start it with `npm run dashboard` and open:
	- `http://localhost:3434/auth/dashboard` (actual mounted path)
	- `http://localhost:3434/dashboard` also works (we redirect to the above)
	The dashboard is protected by the API key and will prompt for it in the UI.

License
-------
Apache-2.0 or MIT (choose and update accordingly).

Contributing
------------
We’d love your help making this Admin UI better for the community.

- Star the repo to show support and help others discover it.
- Open issues for bugs, feature requests, or documentation gaps.
- Submit pull requests for fixes, improvements, and new features.
- Share feedback on UX, APIs, and Core compatibility—especially across different CDI versions.

Development workflow
--------------------
- Fork and clone the repository
- Create a branch for your change (e.g. `feat/add-tenant-settings`)
- Ensure `npm run dev` works locally (see Required environment)
- Add tests or minimal verification steps where possible
- Open a PR; include a short description and screenshots when relevant

Good first issues (ideas)
-------------------------
- Add filters / search to the Users list
- Show user details (recipes, emails, sessions)
- Add session management (list/kill sessions)
- Tenant details page (recipes enabled, email settings)
- Improve Core health diagnostics (CDI/version reporting)

Community & support
-------------------
- Discussions: enable GitHub Discussions or use Issues for Q&A
- Security: please report vulnerabilities privately before opening an issue
- Contact: add your preferred contact method (Discord, email, etc.)

