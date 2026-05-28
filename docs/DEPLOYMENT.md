# Deployment & Hardening Guide

This document describes the recommended deployment and hardening steps for the 4seasons application. It includes nginx changes, environment variables, CI jobs, and smoke tests to validate cookie-based Sanctum authentication.

## Summary

Key actions to perform in production:

- Use `APP_ENV=production` and `APP_DEBUG=false`.
- Use secure session cookies: `SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN=studentcare.site`, `SESSION_SAME_SITE=None` (if cross-site).
- Configure nginx to enforce HTTPS and HSTS, forward cookies, and use an explicit CORS allowlist (do not use `*` when `supports_credentials` is true).
- Redeploy the frontend bundle that removes localStorage bearer tokens.
- Revoke old personal access tokens and optionally force a global logout.
- Ensure secrets are managed by your orchestrator/secret manager (do not commit to repo).

## Files changed in this PR

- `nginx/api.studentcare.site.conf` — HSTS, security headers, CORS allowlist, cookie forwarding
- `nginx/studentcare.site.conf` — HSTS and security headers for the frontend
- `.env.prod.example` — recommended production env variables
- `docker-compose.prod.yml` — now reads `.env.prod` (create `.env.prod` from the example)

## Creating production `.env`

On your server, create `/srv/4seasons/.env.prod` from `.env.prod.example` then fill secrets.

Example (on server):

```bash
cp .env.prod.example .env.prod
# edit .env.prod and set APP_KEY, DB credentials, mail, etc.
```

## Nginx notes

- Ensure TLS certificates are present and valid at the paths referenced in `nginx/*.conf`.
- After updating nginx configs reload: `nginx -t && nginx -s reload`.
- Verify `Set-Cookie` headers are forwarded and `Access-Control-Allow-Credentials: true` is returned.

## CI: Backend tests

A GitHub Actions workflow `ci-backend-tests.yml` has been added. It runs Laravel tests against a MySQL service. The workflow runs on PRs and pushes.

## CI: Staging deploy + smoke tests

A `staging-deploy-and-smoke.yml` workflow is provided as a manual (`workflow_dispatch`) job to deploy to a staging host via SSH and execute smoke tests.

**Secrets required for staging deploy** (set these in the repository or org secrets):
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY` (private key)
- `SMOKE_USER` and `SMOKE_PASS` (a test account to run smoke login)

## Smoke tests (manual)

Run these after staging/prod deployment to verify session cookie + CSRF:

```bash
# 1) get CSRF cookie
curl -c cookies.txt -i https://api.staging.studentcare.site/sanctum/csrf-cookie

# 2) login
curl -b cookies.txt -c cookies.txt -X POST https://api.staging.studentcare.site/api/login \
  -d "username=STAGE_USER&password=STAGE_PASS" -H "Content-Type: application/x-www-form-urlencoded" -i

# 3) verify session
curl -b cookies.txt -X GET https://api.staging.studentcare.site/api/me -i

# 4) logout
curl -b cookies.txt -X POST https://api.staging.studentcare.site/api/logout -i
```

## Post-deploy verification checklist

- Browser: `laravel_session` cookie present and flagged `HttpOnly` and `Secure`.
- LocalStorage: no `token` key present in client storage after redeploy.
- Audit logs: login/logout events recorded, throttles enforced.
- Monitoring: alert on suspicious spikes in 401/429s.

If you want, I can also add a step-by-step `ansible` or `ssh` script to automate staging deployments.
