# Deploying Mini CRM to AWS (single EC2 server)

This guide deploys the full stack on **one Amazon EC2 instance** with Docker Compose:

| Container   | Purpose                                            |
|-------------|----------------------------------------------------|
| `caddy`     | Public entry point, HTTPS via Let's Encrypt        |
| `web`       | nginx, serves `public/` and forwards PHP           |
| `app`       | PHP 8.4-FPM, runs Laravel                          |
| `worker`    | `php artisan queue:work` (notifications, emails)   |
| `scheduler` | `php artisan schedule:run` every minute            |
| `mysql`     | MySQL 8.0 (data in a Docker volume)                |
| `redis`     | Redis 7 (cache/session helper)                     |

Only ports **80** and **443** are open to the internet. MySQL and Redis are not reachable from outside.

> For a larger team you can later move MySQL to **Amazon RDS** and point `DB_HOST` at the RDS endpoint. The rest of this guide stays the same.

---

## 0. What you need before starting

- An AWS account.
- A **domain name** you control (for example `crm.example.com`). HTTPS requires a domain.
- The project in a **git repository** you own (GitHub/GitLab/Bitbucket, private recommended).
- Optional: an email sender for production mail (Amazon SES, see step 9).

---

## 1. Put the code in your repository

On your computer, from the project folder:

```bash
git status                    # review what will be committed
git add -A
git commit -m "Production-ready Docker setup"
git remote -v                 # make sure this points to YOUR repository
git push origin main
```

Double-check that **no secrets are committed**: `.env` is in `.gitignore`. Never commit `.env` or passwords.

---

## 2. Create the EC2 server

In the AWS Console → **EC2 → Launch instance**:

1. **Name:** `mini-crm`
2. **AMI:** Ubuntu Server 24.04 LTS (64-bit x86)
3. **Instance type:** `t3.medium` (4 GB RAM) recommended. `t3.small` (2 GB) works if you add swap (step 3).
4. **Key pair:** create one and download the `.pem` file. Keep it safe.
5. **Network settings → Security group**, allow:
   | Type  | Port | Source                 |
   |-------|------|------------------------|
   | SSH   | 22   | **My IP** only         |
   | HTTP  | 80   | Anywhere (0.0.0.0/0)   |
   | HTTPS | 443  | Anywhere (0.0.0.0/0)   |
6. **Storage:** 20 GB gp3 (or more if you expect many uploads).
7. Click **Launch instance**.

Then give it a fixed address:

- **EC2 → Elastic IPs → Allocate** → **Associate** with your instance. Note the IP (for example `13.250.10.20`).

---

## 3. Connect and prepare the server

From your computer (Windows: use PowerShell or Git Bash):

```bash
ssh -i path/to/your-key.pem ubuntu@<ELASTIC_IP>
```

Install Docker and Git:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Add swap (needed for the image build on a 2 GB server; harmless on bigger ones):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Log out and back in (so the `docker` group applies), then check:

```bash
docker --version
docker compose version
```

---

## 4. Point your domain to the server

At your DNS provider (or **Route 53**), create an **A record**:

| Name  | Type | Value                |
|-------|------|----------------------|
| crm   | A    | `<ELASTIC_IP>`       |

Wait until it resolves (usually a few minutes):

```bash
nslookup crm.example.com
```

It must show your Elastic IP. Caddy can only get a certificate after this works.

---

## 5. Get the code onto the server

```bash
git clone https://github.com/<your-account>/<your-repo>.git ~/mini-crm
cd ~/mini-crm
```

(For a private repo, use a GitHub deploy key or a personal access token.)

---

## 6. Create the production `.env`

```bash
cp .env.production.example .env
nano .env
```

Replace every `CHANGE_ME` value and set your domain. Generate strong passwords with:

```bash
openssl rand -base64 24
```

Set at least these:

| Key | Example | Notes |
|-----|---------|-------|
| `APP_URL` | `https://crm.example.com` | Must be the https domain |
| `APP_DOMAIN` | `crm.example.com` | Caddy uses it for the certificate |
| `DB_PASSWORD` | strong password | App database user |
| `DB_ROOT_PASSWORD` | strong password | MySQL root |
| `MAIL_*` | SES values | See step 9 |

Leave `APP_KEY` empty for now. You generate it in step 7.

Restrict the file so only you can read it:

```bash
chmod 600 .env
```

---

## 7. Build and start the stack

```bash
cd ~/mini-crm
docker compose -f docker-compose.prod.yml up -d --build
```

The first build takes about **5–10 minutes** (it compiles PHP extensions and builds the React assets inside the image).

Generate the application key and paste it into `.env`:

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps app php artisan key:generate --show
nano .env          # set APP_KEY=base64:...  (the value printed above)
docker compose -f docker-compose.prod.yml up -d --force-recreate app worker scheduler
```

Check that everything is running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected: `app`, `web`, `caddy`, `worker`, `scheduler`, `mysql` and `redis` are all `Up`, and `mysql` shows `(healthy)`.

---

## 8. Create the database tables and default data

```bash
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan db:seed --force
```

`db:seed` creates the roles, permissions and a default admin: **`admin@minicrm.test` / `password`**.

> **Change this password immediately.** Open `https://crm.example.com`, log in, go to **Profile → Change password**, and set a strong one. Do not leave the default password on a public server.

> Do **not** run `DemoSeeder` in production. It fills the system with fake sample data.

Create the storage link if you ever see missing uploads (the image already contains it, so this is only a check):

```bash
docker compose -f docker-compose.prod.yml exec app ls -l public/storage
```

---

## 9. Open the site and set up email

Open **https://crm.example.com**. The first request can take a few seconds while Caddy requests the certificate. If the browser shows a certificate error, wait a minute and reload.

**Email (recommended: Amazon SES)**

1. AWS Console → **Amazon SES** → region `us-east-1` (or yours).
2. **Verified identities → Create identity** → verify your domain (add the DNS records it shows) or a single sender address.
3. **SMTP settings → Create SMTP credentials**. Save the username and password.
4. In `.env` set:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=email-smtp.<region>.amazonaws.com
   MAIL_PORT=587
   MAIL_USERNAME=<SES SMTP username>
   MAIL_PASSWORD=<SES SMTP password>
   MAIL_FROM_ADDRESS="noreply@yourdomain.com"
   ```
5. Apply: `docker compose -f docker-compose.prod.yml up -d --force-recreate app worker scheduler`

New SES accounts are in "sandbox" mode and can only send to verified addresses. Request production access in SES before going live.

---

## 10. Optimize for production (run after every deploy)

```bash
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
docker compose -f docker-compose.prod.yml exec app php artisan view:cache
docker compose -f docker-compose.prod.yml restart app worker scheduler
```

Restart is required so the new cached config is picked up.

---

## 11. Redeploy after code changes

On your computer: commit and push. Then on the server:

```bash
cd ~/mini-crm
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
docker compose -f docker-compose.prod.yml exec app php artisan view:cache
docker compose -f docker-compose.prod.yml restart app worker scheduler
```

Your data survives redeploys because it lives in Docker volumes (`mysql_data`, `storage_data`, `caddy_data`).

---

## 12. Backups (do this before you go live)

**Database dump** (run daily with cron on the server):

```bash
mkdir -p ~/backups
docker compose -f docker-compose.prod.yml exec -T mysql \
  sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction mini_crm' \
  | gzip > ~/backups/mini_crm_$(date +%F).sql.gz
```

Add it to cron with `crontab -e`:

```
0 2 * * * cd ~/mini-crm && docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction mini_crm' | gzip > ~/backups/mini_crm_$(date +\%F).sql.gz
```

**Server snapshot:** EC2 → **AWS Backup** (or **Snapshots** on the volume) daily. This also covers uploaded files and certificates.

Copy backups off the server (for example to an S3 bucket) so a server failure cannot take them with it.

---

## 13. Security checklist

- [ ] Default admin password changed.
- [ ] `.env` has `APP_DEBUG=false` and `chmod 600`.
- [ ] SSH (port 22) is limited to your IP in the security group.
- [ ] Only ports 80 and 443 are public.
- [ ] Backups tested: restore a dump once on a spare database.
- [ ] Regular updates: `sudo apt-get update && sudo apt-get upgrade` monthly.

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Browser: certificate error / site not loading | DNS not pointing to the Elastic IP, or ports 80/443 closed | Check `nslookup`, security group rules, then `docker compose ... logs caddy` |
| `502 Bad Gateway` | `app` container not running | `docker compose ... ps` and `docker compose ... logs app` |
| Login page loads but CSS/JS is missing | Old container or build issue | `up -d --build`, then check `public/build` exists in the image |
| `SQLSTATE[HY000] [2002] Connection refused` on first start | MySQL still initializing | Wait for `mysql (healthy)`, then `up -d --force-recreate app worker scheduler` |
| `No application encryption key has been specified` | `APP_KEY` empty | Step 7: generate and paste the key, then recreate containers |
| Uploads (logo/favicon) fail with permission errors | Storage not writable | `docker compose ... exec app chown -R www-data:www-data storage` |
| Emails not sent | SES sandbox or wrong credentials; worker not running | Check `docker compose ... logs worker` and SES sending status |
| Notifications not appearing | Queue worker not running | `docker compose ... ps worker` should be `Up` |
| Changes in `.env` not applied | Config cached or containers not recreated | `up -d --force-recreate app worker scheduler` and `config:cache` again |

Useful commands:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=100 app worker caddy
docker compose -f docker-compose.prod.yml exec app php artisan about
```
