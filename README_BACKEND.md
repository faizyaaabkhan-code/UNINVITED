# UNINVITED companion backend

The companion site can be played immediately without an account. Guest progress is saved in the current browser. Creating an account later preserves the current guest investigation and syncs it to the server.

## Deploy

Deploy this repository to Vercel and configure:

- `GITHUB_TOKEN`: fine-grained GitHub token with Contents Read/Write for `faizyaaabkhan-code/UNINVITED`
- `GITHUB_OWNER=faizyaaabkhan-code`
- `GITHUB_REPO=UNINVITED`
- `GITHUB_BRANCH=main`
- `AUTH_SECRET`: long random secret
- `ADMIN_SECRET`: long random secret
- `FRONTEND_ORIGIN`: the exact companion-site origin, for example `https://your-custom-domain.com`. Multiple comma-separated origins are supported.

The API endpoints are:

- `POST /api/auth` with `create`, `login`, or `codeLogin`
- `GET/PUT /api/progress` with `Authorization: Bearer <token>`
- `POST /api/admin/create-code` with `x-admin-secret`

## Progress integrity

The server validates the saved case state and only permits valid monotonic transitions through the investigation:

`0 → 1 → 2 → 3 → Ella → 4 → Owen → 5 → 6 → 7 → Iris → interrogation → reconstruction → closed`

A deliberate START OVER reset is allowed. Arbitrary client-side jumps to a completed case are rejected.

The frontend remains the authoritative UX for puzzle-answer validation, while the server protects the persisted progression state from simple client tampering.

## Security

Do not put `GITHUB_TOKEN`, `AUTH_SECRET`, or `ADMIN_SECRET` in frontend JavaScript.
