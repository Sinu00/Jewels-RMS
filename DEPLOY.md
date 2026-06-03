# Deploy — single DigitalOcean droplet (Path A: PM2 + Caddy)

Production domain: **https://jewels.rivaazbridal.in**
Stack co-located on one droplet: Next.js (web :3000) + Express (api :3001) + PostgreSQL + Caddy (TLS/reverse proxy).

**Recommended droplet:** Basic, 2 GB RAM / 1 vCPU / 50 GB SSD, region `blr1` (Bangalore). Add a 2 GB swap file (builds can spike past 1 GB).

---

## 0. DNS (do this first so Caddy can issue a cert)
Point an **A record** for `jewels.rivaazbridal.in` → droplet public IP. Wait for it to resolve before step 7.

## 1. Provision & harden (as root)
```bash
adduser deploy && usermod -aG sudo deploy
# swap
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
# firewall — only SSH + web
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
```

## 2. Runtime (as root)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs postgresql caddy
npm i -g pnpm@10 pm2
```
> If `caddy` isn't found, add Caddy's apt repo (see https://caddyserver.com/docs/install).

## 3. Database (as root)
```bash
sudo -u postgres createuser rental --pwprompt        # remember this password
sudo -u postgres createdb rental_db -O rental
```

## 4. App (as deploy)
```bash
su - deploy
git clone <YOUR_REPO_URL> ~/app && cd ~/app
pnpm install --frozen-lockfile

cp apps/api/.env.production.example apps/api/.env      # then edit: DB password, JWT_SECRET, etc.
cp apps/web/.env.production.example apps/web/.env.local

# JWT secret:
openssl rand -hex 32        # paste into apps/api/.env -> JWT_SECRET

pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma generate
pnpm build
pnpm --filter api exec prisma db seed                  # FIRST TIME ONLY
```

## 5. Change the default passwords
The seed creates `admin@branch1.com / admin123` etc. Log in once and change every password (or edit `prisma/seed.ts` before seeding). Do not leave defaults live.

## 6. Start with PM2 (as deploy)
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # run the sudo command it prints, so apps restart on reboot
pm2 status
```

## 7. Caddy / HTTPS (as root)
```bash
cp /home/deploy/app/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```
Caddy auto-issues the Let's Encrypt cert. Visit https://jewels.rivaazbridal.in.

Sanity checks:
```bash
curl -s https://jewels.rivaazbridal.in/api/v1/health   # {"status":"ok",...}
```

---

## Redeploys
```bash
cd ~/app && ./deploy.sh        # pull, install, migrate, build, pm2 reload
```

## Backups (set up day one)
- **DB:** nightly `pg_dump` → off-box (DO Spaces). Example cron (as deploy):
  ```
  0 2 * * *  pg_dump -U rental rental_db | gzip > ~/backups/rental_$(date +\%F).sql.gz
  ```
- **Uploads:** `UPLOAD_DIR` (`~/app/uploads`) — rsync/snapshot regularly. Photos are NOT in git.
- Enable DO weekly droplet backups as a baseline.

## Logs & ops
```bash
pm2 logs rms-api          # API logs
pm2 logs rms-web          # web logs
pm2 monit                 # live CPU/mem
journalctl -u caddy -f    # proxy/TLS
```

## Notes
- `next start` runs from the full `.next` build (no `output: standalone` needed for PM2).
- Caddy routes `/api/*` and `/uploads/*` straight to the API; everything else to Next.
- `BASE_URL=https://jewels.rivaazbridal.in` is what makes item-photo URLs resolve — keep it correct.
