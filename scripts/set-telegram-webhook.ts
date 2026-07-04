import "./load-env";
import { setTelegramWebhook } from "../src/lib/telegram";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

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

try {
  const result = await setTelegramWebhook(token, webhookUrl, secret);
  console.log("Webhook registered:", result);
  console.log("URL:", webhookUrl);
  if (secret) console.log("Secret token: configured");
  console.log("\nTest in Telegram: send /name to your bot");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
