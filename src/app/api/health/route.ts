import { NextResponse } from "next/server";
import { getKeepaliveStatus, startKeepalive } from "@/lib/keepalive";

// Auto-activate keepalive engine on initial health probe if not already running
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  startKeepalive();
}

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-CyberShield-Service": "Keepalive-Monitor",
};

export async function GET() {
  const mem = process.memoryUsage();
  const keepalive = getKeepaliveStatus();

  const payload = {
    status: "healthy",
    service: "CyberShield",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime() * 10) / 10,
    environment: process.env.NODE_ENV || "development",
    memory: {
      heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    },
    keepalive: {
      enabled: true,
      intervalMs: keepalive.intervalMs,
      isRunning: keepalive.isRunning,
      pingCount: keepalive.pingCount,
      lastPingAt: keepalive.lastPingAt,
      lastSuccess: keepalive.lastSuccess,
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: noCacheHeaders,
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: noCacheHeaders,
  });
}
