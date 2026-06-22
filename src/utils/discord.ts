export const sendDiscordAlert = async (
  action: "Created" | "Burned",
  id: string,
) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK;
  if (!webhookUrl) return;

  const color = action === "Created" ? 5814783 : 16711680;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `Secret ${action}`,
            description: `Vault ID **${id}** was just ${action.toLowerCase()}`,
            color: color,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Failed to send Discord alert:", error);
  }
};
