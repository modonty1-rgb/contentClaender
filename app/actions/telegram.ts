"use server";

export async function sendTelegramNotification(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return { success: false, error: "Telegram not configured" };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });

  if (!res.ok) return { success: false, error: await res.text() };
  return { success: true };
}
