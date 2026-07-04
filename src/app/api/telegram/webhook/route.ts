import {
  getAppName,
  getTelegramBotToken,
  sendTelegramMessage,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

/** Telegram Bot API webhook — responds to /name with the app name. */
export async function POST(req: Request) {
  const token = getTelegramBotToken();
  if (!token) {
    return new Response("Telegram bot not configured", { status: 503 });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (header !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat.id;

  if (chatId && text?.startsWith("/name")) {
    try {
      await sendTelegramMessage(token, chatId, getAppName());
    } catch (err) {
      console.error("[telegram/webhook] sendMessage failed:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
