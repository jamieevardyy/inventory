const TELEGRAM_API = "https://api.telegram.org";

/** Strip whitespace and optional surrounding quotes (common Vercel copy-paste mistake). */
export function normalizeEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

export function getTelegramBotToken(): string | undefined {
  return normalizeEnv(process.env.TELEGRAM_BOT_TOKEN);
}

export function getWebhookSecret(): string | undefined {
  return normalizeEnv(process.env.TELEGRAM_WEBHOOK_SECRET);
}

export function getAppName(): string {
  return normalizeEnv(process.env.APP_NAME) || "StockAI";
}

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendMessage failed (${res.status}): ${body}`);
  }
}

export async function setTelegramWebhook(
  token: string,
  webhookUrl: string,
  secretToken?: string,
): Promise<{ ok: boolean; description?: string }> {
  const body: Record<string, string> = { url: webhookUrl };
  if (secretToken) body.secret_token = secretToken;

  const res = await fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.description || `setWebhook failed (${res.status})`);
  }
  return data;
}
