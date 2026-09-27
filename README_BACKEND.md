# UNINVITED secure companion backend

The GitHub Pages file is the frontend. Real authentication and GitHub persistence require a serverless backend.

## Deploy
Deploy this repository to Vercel. Add these environment variables:
- GITHUB_TOKEN: fine-grained GitHub token with Contents Read/Write for faizyaaabkhan-code/UNINVITED
- GITHUB_OWNER=faizyaaabkhan-code
- GITHUB_REPO=UNINVITED
- GITHUB_BRANCH=main
- AUTH_SECRET: long random secret
- ADMIN_SECRET: long random secret

The API endpoints are:
- POST /api/auth {action:"create",name,email,password,caseCode}
- POST /api/auth {action:"login",email,password,caseCode}
- GET/PUT /api/progress with Authorization: Bearer <token>
- POST /api/admin/create-code with x-admin-secret

Create a code first, then give that code to exactly one player. The player must use it when creating an account. Existing accounts must supply the same code to sign in.

Do not put GITHUB_TOKEN, AUTH_SECRET, or ADMIN_SECRET in frontend JavaScript.
