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

function commandFrom(text: string | undefined): string | null {
  if (!text) return null;
  const head = text.trim().split(/\s/)[0];
  if (!head?.startsWith("/")) return null;
  return head.split("@")[0].toLowerCase();
}

/** Telegram Bot API webhook — responds to /start and /name. */
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

  const text = update.message?.text;
  const chatId = update.message?.chat.id;
  const command = commandFrom(text);

  if (!chatId || !command) {
    return new Response("OK", { status: 200 });
  }

  let reply: string | null = null;
  if (command === "/start") {
    reply = `Hi! I'm the ${getAppName()} bot.\n\nTry /name to see the app name.`;
  } else if (command === "/name") {
    reply = getAppName();
  }

  if (reply) {
    try {
      await sendTelegramMessage(token, chatId, reply);
    } catch (err) {
      console.error("[telegram/webhook] sendMessage failed:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
