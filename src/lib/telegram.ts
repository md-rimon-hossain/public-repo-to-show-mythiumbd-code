export async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("Telegram notification skipped: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Telegram notification:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}
