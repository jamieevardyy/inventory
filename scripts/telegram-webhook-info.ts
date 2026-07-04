import "./load-env";

const TELEGRAM_API = "https://api.telegram.org";
const TIMEOUT_MS = 20_000;

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env.local or .env");
  process.exit(1);
}

async function telegramGet<T>(method: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      signal: controller.signal,
    });
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Timed out reaching ${TELEGRAM_API} after ${TIMEOUT_MS / 1000}s.\n` +
          "Your network may block Telegram. Try a VPN, mobile hotspot, or check firewall/proxy settings.",
      );
    }
    throw new Error(
      `Could not reach ${TELEGRAM_API}: ${err instanceof Error ? err.message : err}\n` +
        "This is a local network issue — the bot on Vercel can still work once env vars are set correctly.",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const me = await telegramGet<{ ok: boolean; result?: unknown }>("getMe");
  console.log("getMe:", JSON.stringify(me, null, 2));

  const info = await telegramGet<{ ok: boolean; result?: unknown }>(
    "getWebhookInfo",
  );
  console.log("getWebhookInfo:", JSON.stringify(info, null, 2));

  const result = info.result as
    | { last_error_message?: string; pending_update_count?: number }
    | undefined;
  if (result?.last_error_message) {
    console.error("\nWebhook error:", result.last_error_message);
    console.error(
      "Fix: set TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET on Vercel (must match .env.local), then redeploy.",
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
