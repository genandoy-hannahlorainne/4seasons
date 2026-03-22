# Email Setup Guide

This project uses Laravel's mail system. Three environments are supported:
- **MailHog** — local Docker development (no real emails sent)
- **Mailtrap** — testing/staging (catches emails in a sandbox inbox)
- **Resend** — production (sends real emails to users)

---

## 1. MailHog (Local Docker — default)

Already configured out of the box. No setup needed.

View caught emails at: `http://localhost:8025`

```env
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@medicalrecord.system"
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 2. Mailtrap (Testing/Staging)

Mailtrap catches all outgoing emails in a sandbox inbox — no real emails are delivered.

### Setup

1. Go to [mailtrap.io](https://mailtrap.io) and sign up (free)
2. Dashboard → **Email Testing** → **Inboxes** → your inbox
3. Click **SMTP Settings** → select **Laravel** from the dropdown
4. Copy the credentials shown

### .env configuration

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@medicalrecord.system"
MAIL_FROM_NAME="${APP_NAME}"
```

Replace `your_mailtrap_username` and `your_mailtrap_password` with the values from your Mailtrap inbox SMTP settings.

### Apply changes

```bash
docker compose exec backend php artisan config:clear
```

---

## 3. Resend (Production)

Resend delivers real emails to actual users (Gmail, Yahoo, etc.).
Free tier: **3,000 emails/month**.

### Setup

1. Go to [resend.com](https://resend.com) and sign up
2. Dashboard → **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)
4. Add it to `.env`: `RESEND_KEY=re_xxxxxxxxx`

### .env configuration

```env
MAIL_MAILER=resend
MAIL_FROM_ADDRESS="noreply@yourschool.edu.ph"
MAIL_FROM_NAME="PDMHS Medical System"
RESEND_KEY=re_xxxxxxxxx
```

### Apply changes

```bash
docker compose exec backend php artisan config:clear
```

### Domain verification (recommended for production)

To send from your own domain (e.g. `noreply@yourschool.edu.ph`):

1. Resend Dashboard → **Domains** → **Add Domain**
2. Enter your domain (e.g. `yourschool.edu.ph`)
3. Add the DNS records shown (TXT, MX, DKIM) to your domain registrar
4. Click **Verify** — takes a few minutes

> If you don't have a domain yet, you can temporarily send from `onboarding@resend.dev` for testing purposes only.

---

## Switching Between Environments

| Environment | MAIL_MAILER | Where emails go |
|-------------|-------------|-----------------|
| Local Docker | `smtp` (mailhog) | `http://localhost:8025` |
| Testing | `smtp` (mailtrap) | Mailtrap inbox |
| Production | `resend` | Real user inboxes |

After changing any mail setting in `.env`, always run:

```bash
docker compose exec backend php artisan config:clear
```

---

## Installed Packages

- `resend/resend-laravel` v1.3.1 — already installed in `composer.json`

No additional installation needed when switching to Resend in production.
