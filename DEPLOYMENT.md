# Deploying CvMaker

Target: a single VM running Docker Compose, with Caddy terminating TLS for a subdomain.

**Cost: $0** on Oracle Cloud Always Free. Postgres runs in a container on a Docker volume,
so no managed-database tier is needed. Verified August 2026 — Railway and Fly.io no longer
offer free tiers, and Render's free services spin down after 15 minutes idle with a ~1
minute cold start, which is why neither is used here.

---

## 1. Provision the VM

Oracle Cloud → Compute → Instances → Create.

- Shape: **VM.Standard.A1.Flex** (Ampere ARM), 2 OCPU / 12 GB. This is the Always Free
  allocation as of 2026 — it was quietly cut from 4 OCPU / 24 GB, which is ample here.
- Image: Ubuntu 22.04 or 24.04.
- Boot volume: 50 GB (Always Free covers up to 200 GB total).

All three images (`aspnet:8.0`, `node:20-alpine`, `postgres:16-alpine`) publish arm64, so
ARM needs no changes.

> **If provisioning fails with "Out of Capacity"** — common for ARM in busy regions — either
> retry over a few days, pick a different availability domain, or switch to a Hetzner CX22
> at ~€4/mo. Every file in this repo works unchanged; only the host differs.

### The trap that costs people an afternoon

Oracle's Ubuntu images ship with restrictive **local** iptables rules on top of the cloud
firewall. Open the ports in *both* places, or the site is unreachable with no useful error:

```bash
# 1. Cloud side: VCN -> Security List -> add ingress 0.0.0.0/0 for TCP 80 and 443
# 2. On the VM:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Do **not** open 5133 or 5433. The production override deliberately stops publishing them —
the API and database are reachable only from inside the compose network.

## 2. DNS

Add an `A` record for your subdomain pointing at the VM's public IP:

```
cv.yourdomain.com.   A   <vm-public-ip>
```

Wait for it to resolve (`dig +short cv.yourdomain.com`) **before** starting Caddy. Caddy
requests a certificate on boot; if DNS isn't live the challenge fails, and repeated
failures count against Let's Encrypt's rate limit of 5 certificates per domain per week.

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker
```

## 4. Email (Brevo)

The API **refuses to start** in Production without SMTP — a silently dropped reset email
locks a user out permanently, which is worse than failing to boot.

1. Sign up at brevo.com — free tier is 300 emails/day, permanent.
2. **Senders, Domains & Dedicated IPs → Domains** → add and verify `yourdomain.com` (DKIM
   and DMARC records). Skipping this means resets land in spam.
3. **SMTP & API → SMTP** → copy the login and master password into `.env` below.

## 5. Configure

```bash
git clone https://github.com/Tylerking406/cvmaker.git /opt/cvmaker
cd /opt/cvmaker
cp .env.example .env

# Generate the two secrets
echo "SUPABASE_JWT_SECRET=$(openssl rand -base64 48)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
```

Fill in `.env`: `DOMAIN`, `ACME_EMAIL`, both generated secrets, and the five `SMTP_*`
values. Every one is declared required — compose will refuse to start if any is missing,
rather than falling back to a development default.

## 6. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

First build takes several minutes on 2 OCPU. The schema is created automatically by EF
migrations on the API's first start — there is nothing to apply by hand.

Watch for `Now listening on:` from the API and a certificate line from Caddy. If the API
exits immediately, read the message: the startup guards name exactly what is wrong.

## 7. Smoke test

Run in this order — each catches a different failure.

```bash
curl -sI https://cv.yourdomain.com | head -1                                            # 200, valid cert
curl -s -o /dev/null -w '%{http_code}\n' https://cv.yourdomain.com/api/cvs              # 401, not 502
curl -s -o /dev/null -w '%{http_code}\n' https://cv.yourdomain.com/swagger/index.html   # 404 -> Production is live
```

Then in a browser:

1. Sign in as `arinao.dev@gmail.com` / `Test1234` → **must fail.** Proves the dev fixture
   account was not created.
2. Register a real account, then **hard-refresh.** Still signed in?
   *If not, this is the classic failure:* Production flips the auth cookie to `Secure`, so
   without genuine TLS the browser silently discards it. Login returns 200 and the session
   never persists — it reads as "auth is broken" when it is really "TLS is misconfigured".
3. Forgot-password → email arrives, link points at your domain, and works exactly once.
4. ~12 rapid failed logins → **429**. Then try from your phone on mobile data → **not**
   limited. If the phone is also blocked, Caddy isn't passing real client IPs and the
   limiter is one shared bucket for every user.
5. From another machine: `nc -zv cv.yourdomain.com 5133` and `5433` must both be refused.

## 8. Backups

There is no managed database here, so this is the only thing standing between a bad
migration and permanent data loss — and migrations apply automatically on every API start.

```bash
chmod +x /opt/cvmaker/scripts/backup-db.sh
crontab -e
# 15 3 * * *  /opt/cvmaker/scripts/backup-db.sh >> /var/log/cvmaker-backup.log 2>&1
```

Restore instructions are in the script's footer. **Test a restore once before you have real
users** — an untested backup is a guess.

## 9. Updating

```bash
cd /opt/cvmaker && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Migrations apply on startup. Take a backup first if the release touches the schema.

---

## Known limits at this scale

- **Single instance.** Migrations run on startup, which is safe for one replica; concurrent
  replicas can deadlock on the migrations history table. Move to
  `dotnet ef migrations bundle` as a deploy step before scaling out.
- **Rate limiting is in-memory**, so it resets on restart and would not be shared across
  replicas.
- **No token revocation.** A password reset cannot invalidate sessions that are already
  issued; they expire within the hour (`Supabase__ExpiryMinutes`).
