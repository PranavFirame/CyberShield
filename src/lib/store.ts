import { ScanReport } from "@/types/security";

// In-memory persistent scan cache for local development & demonstration
export const scansStore = new Map<string, ScanReport>();
