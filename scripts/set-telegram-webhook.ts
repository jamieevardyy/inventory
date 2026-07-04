import "./load-env";
import { normalizeEnv, setTelegramWebhook } from "../src/lib/telegram";

async function main() {
  const token = normalizeEnv(process.env.TELEGRAM_BOT_TOKEN);
  const webhookUrl = normalizeEnv(process.env.TELEGRAM_WEBHOOK_URL);
  const secret = normalizeEnv(process.env.TELEGRAM_WEBHOOK_SECRET);

  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN in .env.local or .env");
    process.exit(1);
  }

  if (!webhookUrl) {
    console.error(
      "Missing TELEGRAM_WEBHOOK_URL — set it to your public HTTPS endpoint, e.g.\n" +
        "  https://your-domain.com/api/telegram/webhook\n" +
        "  https://abc123.ngrok-free.app/api/telegram/webhook  (local dev via ngrok)",
    );
    process.exit(1);
  }

  const result = await setTelegramWebhook(token, webhookUrl, secret);
  console.log("Webhook registered:", result);
  console.log("URL:", webhookUrl);
  if (secret) console.log("Secret token: configured");
  console.log(
    "\nImportant: add these to Vercel → Settings → Environment Variables, then redeploy:",
  );
  console.log("  TELEGRAM_BOT_TOKEN");
  console.log("  TELEGRAM_WEBHOOK_SECRET  (must match the value above exactly)");
  console.log("  APP_NAME");
  console.log("\nTest in Telegram: send /name to your bot");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
