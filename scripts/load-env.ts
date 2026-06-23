/** Load .env.local for standalone tsx scripts (Node >= 20.12). */
const proc = process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

try {
  proc.loadEnvFile?.(".env.local");
} catch {
  try {
    proc.loadEnvFile?.(".env");
  } catch {
    console.warn("No .env.local / .env file found — relying on process env.");
  }
}
