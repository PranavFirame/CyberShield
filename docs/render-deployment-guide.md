# Render 24/7 Uptime & Keepalive Deployment Guide

CyberShield includes an in-process Keepalive Engine and Health Monitor designed to keep your server alive and avoid Render's 15-minute idle spin-down.

---

## 1. How It Works

- **Self-Pinging Worker**: `src/lib/keepalive.ts` runs a lightweight timer that sends a `GET` probe every **1 minute (60,000ms)** to `/api/health`.
- **Render URL Auto-Detection**: When deployed on Render, `process.env.RENDER_EXTERNAL_URL` is automatically supplied by Render (e.g. `https://cybershield.onrender.com`).
- **Telemetry & Health Endpoint**: `GET /api/health` returns HTTP 200 with uptime, heap memory usage, timestamp, and keepalive stats.

---

## 2. Render Web Service Settings

When setting up your Web Service on Render:
1. **Build Command**: `npm run build`
2. **Start Command**: `npm run start`
3. **Health Check Path**:
   - In Render Dashboard under **Settings > Health Check Path**, enter:
     ```
     /api/health
     ```
   - Render will verify that this returns HTTP 200 during zero-downtime deploys.

---

## 3. Recommended External Fail-Safe (Free)

While the internal pinger keeps the active server alive every minute, if the container is ever forcefully suspended by Render maintenance, an external HTTP ping acts as the ultimate zero-cost wake-up guard:

1. Create a free account on **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)**.
2. Add a new monitor / cron job:
   - **URL**: `https://<your-render-app>.onrender.com/api/health`
   - **Method**: `HEAD` or `GET`
   - **Interval**: Every 1 to 5 minutes.
3. This guarantees continuous incoming web traffic, keeping your Render free instance permanently awake with zero cold starts!
