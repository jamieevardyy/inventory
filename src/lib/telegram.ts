const TELEGRAM_API = "https://api.telegram.org";

export function getTelegramBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

export function getAppName(): string {
  return process.env.APP_NAME?.trim() || "StockAI";
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
