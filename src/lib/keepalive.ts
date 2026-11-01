/**
 * Render & Cloud Keepalive Engine for CyberShield
 * Pings the application periodically (default: 1 minute / 60,000ms)
 * to keep the container awake and prevent idle spin-down.
 */

export interface KeepaliveStatus {
  isRunning: boolean;
  intervalMs: number;
  targetUrl: string;
  pingCount: number;
  failureCount: number;
  lastPingAt: string | null;
  lastSuccess: boolean | null;
}

const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute

function resolveTargetUrl(customUrl?: string): string {
  if (customUrl) return customUrl;
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    `http://localhost:${process.env.PORT || 3000}`;

  return baseUrl.endsWith("/api/health") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/api/health`;
}

// Global singleton state across hot-reloads / module evaluations
const globalForKeepalive = globalThis as unknown as {
  __cybershield_keepalive_timer?: NodeJS.Timeout | null;
  __cybershield_keepalive_status?: KeepaliveStatus;
};

const state: KeepaliveStatus = globalForKeepalive.__cybershield_keepalive_status || {
  isRunning: false,
  intervalMs: DEFAULT_INTERVAL_MS,
  targetUrl: resolveTargetUrl(),
  pingCount: 0,
  failureCount: 0,
  lastPingAt: null,
  lastSuccess: null,
};

globalForKeepalive.__cybershield_keepalive_status = state;

function validateKeepaliveUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid protocol for keepalive: only http/https allowed");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "169.254.169.254" ||
    host.startsWith("169.254.") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Target destination forbidden by SSRF defense policy");
  }
  if (!parsed.pathname.endsWith("/api/health")) {
    throw new Error("Keepalive target must end with /api/health");
  }
  return parsed;
}

export async function triggerPing(targetUrl?: string): Promise<boolean> {
  const url = targetUrl || state.targetUrl || resolveTargetUrl();
  state.lastPingAt = new Date().toISOString();

  try {
    const validatedUrl = validateKeepaliveUrl(url);
    const res = await fetch(validatedUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "CyberShield-Keepalive/1.0 (Render Keep-Alive Worker)",
        "Cache-Control": "no-cache",
      },
      // Short timeout to avoid hanging connections
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    });

    state.pingCount++;
    state.lastSuccess = res.ok;
    if (!res.ok) {
      state.failureCount++;
    }
    return res.ok;
  } catch {
    state.failureCount++;
    state.lastSuccess = false;
    return false;
  }
}

export function startKeepalive(options?: {
  intervalMs?: number;
  targetUrl?: string;
}): KeepaliveStatus {
  if (options?.intervalMs) {
    state.intervalMs = options.intervalMs;
  }
  if (options?.targetUrl) {
    state.targetUrl = resolveTargetUrl(options.targetUrl);
  } else {
    state.targetUrl = resolveTargetUrl();
  }

  // Prevent multiple timers
  if (state.isRunning && globalForKeepalive.__cybershield_keepalive_timer) {
    return getKeepaliveStatus();
  }

  state.isRunning = true;

  // Schedule periodic ping every 1 minute (or configured interval)
  globalForKeepalive.__cybershield_keepalive_timer = setInterval(() => {
    triggerPing(state.targetUrl).catch(() => {
      // safe catch, never crash
    });
  }, state.intervalMs);

  // Unref timer in Node.js environment so it does not block graceful shutdown
  if (globalForKeepalive.__cybershield_keepalive_timer?.unref) {
    globalForKeepalive.__cybershield_keepalive_timer.unref();
  }

  return getKeepaliveStatus();
}

export function stopKeepalive(): KeepaliveStatus {
  if (globalForKeepalive.__cybershield_keepalive_timer) {
    clearInterval(globalForKeepalive.__cybershield_keepalive_timer);
    globalForKeepalive.__cybershield_keepalive_timer = null;
  }
  state.isRunning = false;
  return getKeepaliveStatus();
}

export function getKeepaliveStatus(): KeepaliveStatus {
  return { ...state };
}
