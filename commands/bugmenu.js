
import fs from "fs";
import config from "../config.js";
import { channelInfo } from "../lib/channelConfig.js";
import { mediaUrls } from "../lib/mediaUrls.js";

// Define your bugs - now all Unicode commands are in self
export const bugsList = {
  "combo-crash": { description: "Invisible Unicode payload (self)", type: "DM & Group", weight: 1_000_000 },
  "singleline-crash": { description: "Single-line massive zero-width crash (self)", type: "DM", weight: 10_000_000 },
  "mentions-crash": { description: "Massive mentions JSON crash (self)", type: "Group only", weight: 200_000 },
  "ios-heavy": { description: "iOS heavy Unicode + emoji crash (self)", type: "DM & Group", weight: 20_000 },
  "emoji-bomb": { description: "Stacked ZWJ emoji spam (self)", type: "DM & Group", weight: 50_000 },
  "rtl-bomb": { description: "Right-to-left override Unicode crash (self)", type: "DM & Group", weight: 100_000 },
  "zero-width-wall": { description: "Walls of Zero-Width Spaces (self)", type: "DM & Group", weight: 100_000_000 },
  "zalgo-crash": { description: "Heavy zalgo Unicode crash (self)", type: "DM & Group", weight: "EXTREME" },
  "apocalypse-bug": { description: "⚠️ Ultra-heavy Unicode, emojis & mentions crash (self)", type: "DM & Group", weight: "EXTREME" },
  "crasher": { description: "Dangerous emoji spam payload (self)", type: "DM & Group", weight: "HIGH" },
  "freeze-test-unicode": { description: "Unicode freeze test payload (self)", type: "DM & Group", weight: "HIGH" },
  "horla-crash": { description: "Multiple crash files combined", type: "DM & Group", weight: "HIGH" },
  "uni-crash": { description: "Single-line invisible crash from file", type: "DM & Group", weight: "HIGH" },
  "group-crash": { description: "Recursive mention crash for groups", type: "Group only", weight: "HIGH" },
  "medinv-crash": { description: "Media invisible crash combo", type: "DM & Group", weight: "HIGH" }
};

export default {
  name: "bugmenu",
  description: "Show the list of all available bugs with interactive buttons",
  async execute(msg, { sock }) {
    let prefix = config.prefix || "?";
    let menuText = `╭━━━✦❮ *🐛 BUG COMMANDS* ❯✦━⊷ \n`;
    
    for (const [name, info] of Object.entries(bugsList)) {
      menuText += `┃✪  ${name} - ${info.description}\n`;
      menuText += `┃   Type: ${info.type} | Weight: ${info.weight}\n`;
    }
    
    menuText += `╰━━━━━━━━━━━━━━━━━⊷\n\n`;
    menuText += `Usage for Unicode crashes (self commands):\n${prefix}<command_name> <number/group>\nExample: ${prefix}combo-crash 2349123456789\n\n`;
    menuText += `Usage for file-based crashes:\n${prefix}bug <bug_name> <number/group>\nExample: ${prefix}bug horla-crash 2349123456789\n\n`;
    menuText += `⚠️ *WARNING: Unicode crashes are now self commands - use responsibly!*`;

    // Create interactive buttons
    const buttons = [
      {
        buttonId: `${prefix}bug combo-crash`,
        buttonText: { displayText: '🔥 Combo Crash' },
        type: 1
      },
      {
        buttonId: `${prefix}bug apocalypse-bug`,
        buttonText: { displayText: '💀 Apocalypse Bug' },
        type: 1
      },
      {
        buttonId: `${prefix}bug horla-crash`,
        buttonText: { displayText: '⚡ Horla Crash' },
        type: 1
      }
    ];

    const buttonMessage = {
      text: menuText,
      buttons: buttons,
      headerType: 1,
      ...channelInfo
    };

    try {
      // Send video from mediaUrls
      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: mediaUrls.bugMenuVideo },
        caption: menuText,
        buttons: buttons,
        ...channelInfo
      });
    } catch (error) {
      console.log('[ERROR] Failed to send video, sending text with buttons:', error.message);
      // Fallback to text with buttons
      await sock.sendMessage(msg.key.remoteJid, buttonMessage);
    }
  }
};
