import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, HEAD } from "@/app/api/health/route";
import { startKeepalive, stopKeepalive, getKeepaliveStatus, triggerPing } from "@/lib/keepalive";

describe("Render Health Check & Keepalive Engine", () => {
  beforeEach(() => {
    stopKeepalive();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    stopKeepalive();
  });

  describe("API Endpoint: /api/health", () => {
    it("GET /api/health returns 200 with server telemetry and no-cache headers", async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("CyberShield");
      expect(typeof data.uptimeSeconds).toBe("number");
      expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(typeof data.timestamp).toBe("string");
      expect(data.memory).toBeDefined();
      expect(typeof data.memory.heapUsedMB).toBe("number");
      expect(data.keepalive).toBeDefined();
      expect(data.keepalive.intervalMs).toBe(60000); // 1 minute interval

      // Cache prevention headers
      const cacheControl = response.headers.get("cache-control");
      expect(cacheControl).toContain("no-store");
    });

    it("HEAD /api/health returns 200 status with empty body", async () => {
      const response = await HEAD();
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe("");
    });
  });

  describe("Keepalive Engine: src/lib/keepalive", () => {
    it("defaults to 1-minute (60,000ms) interval", () => {
      const status = getKeepaliveStatus();
      expect(status.intervalMs).toBe(60000);
    });

    it("starts and stops keepalive lifecycle cleanly", () => {
      startKeepalive({ intervalMs: 60000, targetUrl: "http://localhost:3000" });
      let status = getKeepaliveStatus();
      expect(status.isRunning).toBe(true);
      expect(status.intervalMs).toBe(60000);

      stopKeepalive();
      status = getKeepaliveStatus();
      expect(status.isRunning).toBe(false);
    });

    it("prevents multiple concurrent timers (singleton pattern)", () => {
      startKeepalive({ intervalMs: 60000 });
      startKeepalive({ intervalMs: 60000 });
      const status = getKeepaliveStatus();
      expect(status.isRunning).toBe(true);
      stopKeepalive();
    });

    it("triggerPing increments pingCount and updates lastPingAt", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "OK",
      });

      const beforePings = getKeepaliveStatus().pingCount;
      const success = await triggerPing("http://localhost:3000/api/health");

      expect(success).toBe(true);
      const status = getKeepaliveStatus();
      expect(status.pingCount).toBe(beforePings + 1);
      expect(status.lastSuccess).toBe(true);
      expect(typeof status.lastPingAt).toBe("string");
    });

    it("handles ping failures gracefully without crashing", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const success = await triggerPing("http://invalid-url.local/api/health");
      expect(success).toBe(false);

      const status = getKeepaliveStatus();
      expect(status.lastSuccess).toBe(false);
      expect(status.failureCount).toBeGreaterThan(0);
    });
  });
});
