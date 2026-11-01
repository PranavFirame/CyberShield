/**
 * Next.js Server Instrumentation
 * Runs automatically on server initialization in Node.js runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startKeepalive } = await import("@/lib/keepalive");
    startKeepalive();
  }
}
