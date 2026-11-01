# Render Keepalive & Health Monitoring System Implementation Plan

## Overview
Implement an automated health check endpoint (`/api/health`) and an in-process keepalive engine that runs every 1 minute (60,000 ms) to keep the CyberShield server alive on Render and prevent free-tier container sleep.

---

## User Constraints & Requirements
- **Frequency**: Must ping every 1 minute (60 seconds).
- **Environment**: Optimized for Render hosting (`RENDER_EXTERNAL_URL` detection) with fallbacks for local dev and custom domains.
- **Reliability**: Self-healing singleton timer, non-blocking asynchronous execution, cache-busting headers.

---

## Proposed Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │               Render Cloud                   │
                       │                                              │
  External Requests ──►│  [CyberShield Next.js Server]                │
                       │     ├── src/app/api/health/route.ts          │
                       │     │     (GET & HEAD -> 200 JSON status)    │
                       │     │                                        │
                       │     └── src/lib/keepalive.ts                 │
                       │           (1-Min Periodic Self-Pinger)       │
                       │             │                                │
                       │             └──► fetch(RENDER_URL/api/health)│
                       └──────────────────────────────────────────────┘
```

---

## Planned Files

1. **`src/lib/keepalive.ts`**
   - Singleton Keepalive manager.
   - Pings every 60,000 ms (1 minute, configurable via `KEEPALIVE_INTERVAL_MS`).
   - Automatically detects Render public URL (`process.env.RENDER_EXTERNAL_URL`), `NEXT_PUBLIC_APP_URL`, or `http://localhost:${PORT}`.
   - Maintains status (`pingCount`, `lastPingAt`, `lastSuccess`, `failures`).

2. **`src/app/api/health/route.ts`**
   - Implements `GET` and `HEAD` methods.
   - Returns JSON containing server status (`healthy`), process uptime, memory usage, timestamp, and keepalive metrics.
   - Sets strict `Cache-Control: no-store, no-cache, must-revalidate` headers.

3. **`src/instrumentation.ts`**
   - Next.js server startup hook: starts the keepalive background worker once on server boot.

4. **`.env.example`**
   - Documents `KEEPALIVE_ENABLED`, `KEEPALIVE_INTERVAL_MS`, and `RENDER_EXTERNAL_URL`.

5. **`src/tests/health-keepalive.test.ts`**
   - Vitest test suite testing health API contracts, keepalive pinger lifecycle, singleton behavior, and interval logic.

---

## Step-by-Step Tasks

### Task 1: Write TDD Tests for Health Endpoint and Keepalive Engine
- Create `src/tests/health-keepalive.test.ts`.
- Run `npm test src/tests/health-keepalive.test.ts` and confirm failure (Red).

### Task 2: Implement Keepalive Engine (`src/lib/keepalive.ts`)
- Implement singleton keeper with start/stop/status methods.
- Default interval: 60,000ms.
- Safe asynchronous pinging with error handling.

### Task 3: Implement Health Check Route (`src/app/api/health/route.ts`)
- Implement `GET` and `HEAD` returning 200 OK and health telemetry.
- Ensure keepalive starts automatically when health is queried or on boot.

### Task 4: Configure Next.js Server Instrumentation (`src/instrumentation.ts`)
- Register keepalive on server startup for production environments.

### Task 5: Run Full Test Suite & Live Verification
- Run `npm test` to verify all tests pass (Green).
- Verify live endpoint at `http://localhost:3000/api/health`.
- Test `HEAD` and `GET` responses.
