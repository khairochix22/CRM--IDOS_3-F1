# Quick Start

Get Mini CRM running locally in under 5 minutes.

## Prerequisites

- PHP 8.2 or 8.3
- Composer
- Node.js 20+
- MySQL 8 (or use SQLite for a quick local test)

## Steps

**1. Clone the repository**

```bash
git clone https://github.com/XgeniousLLC/geniousCRM.git
cd geniousCRM
```

**2. Install PHP dependencies**

```bash
composer install
```

**3. Install JavaScript dependencies**

```bash
npm install
```

**4. Configure your environment**

```bash
cp .env.example .env
php artisan key:generate
```

Open `.env` and set your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mini_crm
DB_USERNAME=root
DB_PASSWORD=your_password
```

**5. Run migrations and seed**

```bash
php artisan migrate --seed
```

This creates the default roles, permissions, and the admin account:

| Email | Password | Role |
|-------|----------|------|
| `admin@minicrm.test` | `password` | Admin |

**6. Start everything with one command**

```bash
npm run dev
```

This starts the Laravel server, the queue worker (notifications/emails) and the Vite dev server together. It also picks a PHP 8.4+ binary automatically and starts Laragon's MySQL if it isn't running. Press **Ctrl+C** to stop.

Open **http://127.0.0.1:8000** and log in with `admin@minicrm.test` / `password`.

For production, build the assets with `npm run build` and serve with your web server.

---

## Seed Demo Data (Optional)

To populate the CRM with realistic demo contacts, leads, deals, tasks, and companies:

```bash
php artisan db:seed --class=DemoSeeder
```

This adds 15 contacts, 12 leads, 10 deals, 15 tasks, 8 companies, and 4 users. See [Demo Reset](/guide/demo-reset) for more.

---

## What's Next?

- [First Login](/guide/first-login) — walk through the admin dashboard
- [Configuration](/guide/configuration) — mail, queue, timezone, storage
- [Docker Setup](/guide/docker) — containerised setup
