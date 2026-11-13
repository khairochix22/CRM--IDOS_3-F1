/**
 * dev.mjs — one-command local development launcher
 *
 * `npm run dev` runs this script, which:
 *   1. Picks a PHP binary >= 8.4 (composer.lock requires it). Order:
 *        PHP_BINARY env var → newest Laragon PHP in C:\laragon\bin\php → `php` on PATH
 *   2. Makes sure MySQL (DB_HOST:DB_PORT from .env) is reachable. If it is
 *      down and Laragon is installed, starts Laragon's mysqld in the background.
 *   3. Starts, in one terminal with coloured prefixes:
 *        server → php artisan serve        (http://127.0.0.1:8000)
 *        queue  → php artisan queue:listen (notifications + emails)
 *        vite   → vite dev server          (React hot reload)
 *
 * Press Ctrl+C once to stop everything. (MySQL is left running, like Laragon does.)
 *
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LARAGON = process.env.LARAGON_ROOT || 'C:\\laragon';
const MIN_PHP = [8, 4];

const log = (msg) => console.log(`\x1b[36m[dev]\x1b[0m ${msg}`);
const fail = (msg) => { console.error(`\x1b[31m[dev] ${msg}\x1b[0m`); process.exit(1); };

/* ── .env ─────────────────────────────────────────────── */
function readEnv() {
    const file = path.join(ROOT, '.env');
    if (!existsSync(file)) fail('.env not found. Run: copy .env.example .env  then  php artisan key:generate');
    const env = {};
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
}

/* ── PHP ──────────────────────────────────────────────── */
function phpVersion(bin) {
    try {
        const out = execFileSync(bin, ['-r', 'echo PHP_VERSION;'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        return out.trim().split('.').map(Number);
    } catch { return null; }
}

const atLeast = (v, min) => v && (v[0] > min[0] || (v[0] === min[0] && v[1] >= min[1]));

function findPhp() {
    const candidates = [];
    if (process.env.PHP_BINARY) candidates.push(process.env.PHP_BINARY);

    const laragonPhp = path.join(LARAGON, 'bin', 'php');
    if (existsSync(laragonPhp)) {
        readdirSync(laragonPhp)
            .map((d) => path.join(laragonPhp, d, 'php.exe'))
            .filter(existsSync)
            .forEach((p) => candidates.push(p));
    }
    candidates.push('php');

    const ok = candidates
        .map((bin) => ({ bin, v: phpVersion(bin) }))
        .filter(({ v }) => atLeast(v, MIN_PHP))
        .sort((a, b) => b.v[0] - a.v[0] || b.v[1] - a.v[1] || b.v[2] - a.v[2]);

    if (!ok.length) fail(`PHP ${MIN_PHP.join('.')}+ not found. Install it or set PHP_BINARY to its path.`);
    return ok[0];
}

/* ── MySQL ────────────────────────────────────────────── */
function portOpen(host, port, timeout = 800) {
    return new Promise((resolve) => {
        const s = net.connect({ host, port, timeout });
        s.once('connect', () => { s.destroy(); resolve(true); });
        s.once('timeout', () => { s.destroy(); resolve(false); });
        s.once('error', () => resolve(false));
    });
}

async function ensureMysql(env) {
    if ((env.DB_CONNECTION || 'mysql') !== 'mysql') return;
    const host = env.DB_HOST || '127.0.0.1';
    const port = Number(env.DB_PORT || 3306);

    if (await portOpen(host, port)) return log(`MySQL is running on ${host}:${port}`);

    const mysqlDir = path.join(LARAGON, 'bin', 'mysql');
    if (!existsSync(mysqlDir)) {
        fail(`MySQL is not running on ${host}:${port}. Start your MySQL server and try again.`);
    }

    const version = readdirSync(mysqlDir).sort().reverse()[0];
    const mysqld = path.join(mysqlDir, version, 'bin', 'mysqld.exe');
    const major = (version.match(/mysql-(\d+\.\d+)/) || [])[1] || '8';
    const dataDir = path.join(LARAGON, 'data', `mysql-${major}`);
    mkdirSync(dataDir, { recursive: true });

    log(`MySQL is not running — starting Laragon MySQL (${version})…`);
    spawn(mysqld, [`--log-error=${path.join(dataDir, 'mysqld.log')}`], {
        cwd: path.dirname(mysqld), detached: true, stdio: 'ignore', windowsHide: true,
    }).unref();

    for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await portOpen(host, port)) return log(`MySQL started on ${host}:${port}`);
    }
    fail('MySQL did not start within 15s. Open Laragon and click "Start All".');
}

/* ── Run ──────────────────────────────────────────────── */
const env = readEnv();
const php = findPhp();
log(`Using PHP ${php.v.join('.')} → ${php.bin}`);
await ensureMysql(env);

const q = (s) => (s.includes(' ') ? `"${s}"` : s);
const concurrently = path.join(ROOT, 'node_modules', 'concurrently', 'dist', 'bin', 'concurrently.js');
if (!existsSync(concurrently)) fail('Dependencies missing. Run: npm install');

const commands = [
    `${q(php.bin)} artisan serve`,
    `${q(php.bin)} artisan queue:listen --tries=1 --timeout=0`,
    'npx vite',
];

log('Starting server, queue worker and Vite. App: http://127.0.0.1:8000  (Ctrl+C to stop)');

const child = spawn(process.execPath, [
    concurrently,
    '--kill-others-on-fail',
    '-n', 'server,queue,vite',
    '-c', '#93c5fd,#c4b5fd,#fdba74',
    ...commands,
], { cwd: ROOT, stdio: 'inherit' });

child.on('exit', (code) => process.exit(code ?? 0));
