import fs from "fs";
import config from "../config.js";
import { channelInfo } from "../lib/channelConfig.js";
import { mediaUrls } from "../lib/mediaUrls.js";

export default {
name: 'menu',
description: 'Display bot menu with all commands',
aliases: ['help', 'commands'],
async execute(msg, { sock, args, settings }) {
const from = msg.key.remoteJid;
const prefix = config.prefix;
const botName = config.botName;
const ownerName = config.ownerName;

// Get current time and date  
const now = new Date();  
const timeOptions = {  
  timeZone: 'Africa/Lagos',  
  hour12: true,  
  hour: 'numeric',  
  minute: '2-digit',  
  second: '2-digit'  
};  
const dateOptions = {  
  timeZone: 'Africa/Lagos',  
  day: 'numeric',  
  month: 'numeric',  
  year: 'numeric'  
};  

const currentTime = now.toLocaleTimeString('en-US', timeOptions);  
const currentDate = now.toLocaleDateString('en-US', dateOptions);  

// Bot uptime calculation  
const uptime = process.uptime();  
const hours = Math.floor(uptime / 3600);  
const minutes = Math.floor((uptime % 3600) / 60);  
const seconds = Math.floor(uptime % 60);  
const uptimeString = `${hours}h ${minutes}m ${seconds}s`;  

// Memory usage  
const memUsage = process.memoryUsage();  
const usedMemory = Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100;  
const totalMemory = Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100;  
const memoryPercent = Math.round((usedMemory / totalMemory) * 100);  

const menuText = `╔╭━━〔 *HORLA POOKIE BOT* 〕━━╮

│ ✦ Mᴏᴅᴇ : ${global.botMode || 'public'}
│ ✦ Pʀᴇғɪx : [ ${prefix} ]
│ ✦ Usᴇʀ : @${msg.key.remoteJid.split('@')[0]}
│ ✦ Pʟᴜɢɪɴs : 323
│ ✦ Vᴇʀsɪᴏɴ : 2.0
│ ✦ Uᴘᴛɪᴍᴇ : ${uptimeString}
│ ✦ Tɪᴍᴇ Nᴏᴡ : ${currentTime}
│ ✦ Dᴀᴛᴇ Tᴏᴅᴀʏ : ${currentDate}
│ ✦ Tɪᴍᴇ Zᴏɴᴇ : Africa/Lagos
│ ✦ Sᴇʀᴠᴇʀ Rᴀᴍ : ${memoryPercent}% Used
╰─────────────────╯

╭━━━✦❮ 🛠️ BASIC TOOLS ❯✦━⊷
┃✪  ${prefix}echo - echo command
┃✪  ${prefix}log - log command
┃✪  ${prefix}ping - ping command
┃✪  ${prefix}profile - profile command
┃✪  ${prefix}setusername - setusername command
┃✪  ${prefix}time - time command
┃✪  ${prefix}uptime - uptime command
┃✪  ${prefix}userinfo - userinfo command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 👥 GROUP MANAGEMENT ❯✦━⊷
┃✪  ${prefix}announce - announce command
┃✪  ${prefix}info - info command
┃✪  ${prefix}broadcast - broadcast command
┃✪  ${prefix}chatbot - chatbot command
┃✪  ${prefix}delete - delete command
┃✪  ${prefix}demote - demote command
┃✪  ${prefix}gdesc - gdesc command
┃✪  ${prefix}gname - gname command
┃✪  ${prefix}gpt4 - gpt4 command
┃✪  ${prefix}groupinfo - groupinfo command
┃✪  ${prefix}kick - kick command
┃✪  ${prefix}lock - lock command
┃✪  ${prefix}promote - promote command
┃✪  ${prefix}remove - remove command
┃✪  ${prefix}tagall - tagall command
┃✪  ${prefix}unlock - unlock command
┃✪  ${prefix}open - open command
┃✪  ${prefix}warn - warn command
┃✪  ${prefix}welcome - welcome/goodbye configuration
┃✪  ${prefix}antilink - antilink protection
┃✪  ${prefix}groupmanage - groupmanage command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ FOREX TOOLS ❯✦━⊷
┃✪  ${prefix}currencylist - currencylist command
┃✪  ${prefix}forex - forex command
┃✪  ${prefix}fxexchange - fxexchange command
┃✪  ${prefix}fxpairs - fxpairs command
┃✪  ${prefix}fxstatus - fxstatus command
┃✪  ${prefix}stocktickers - stocktickers command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🤖 AI COMMANDS ❯✦━⊷
┃✪  ${prefix}gpt-3 - gpt-3 command
┃✪  ${prefix}copilot - copilot command
┃✪  ${prefix}gpt4 - gpt4 command
┃✪  ${prefix}ai2 - ai2 command
┃✪  ${prefix}translate - translate command
┃✪  ${prefix}google - google command
┃✪  ${prefix}gta - gta command
┃✪  ${prefix}gpt2 - gpt2 command
┃✪  ${prefix}bing - bing command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎨 AI IMAGE GENERATOR ❯✦━⊷
┃✪  ${prefix}bing (self) - bing (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎙️ VOICE & AUDIO ❯✦━⊷
┃✪  ${prefix}stt - stt command
┃✪  ${prefix}tts - tts command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎮 GAMES & FUN ❯✦━⊷
┃✪  ${prefix}answer - answer command
┃✪  ${prefix}character - character command
┃✪  ${prefix}hangman - hangman command
┃✪  ${prefix}joke - joke command
┃✪  ${prefix}myscore - myscore command
┃✪  ${prefix}riddle - riddle command
┃✪  ${prefix}ship - ship command
┃✪  ${prefix}roll - roll command
┃✪  ${prefix}trivia - trivia command
┃✪  ${prefix}hack (self) - hack (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎨 CREATIVITY & ART ❯✦━⊷
┃✪  ${prefix}quote - quote command
┃✪  ${prefix}wallpaper - wallpaper command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 👤 PERSONAL STUFF ❯✦━⊷
┃✪  ${prefix}getpp - getpp command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ ✨ IMAGE EFFECTS ❯✦━⊷
┃✪  ${prefix}resize - resize command
┃✪  ${prefix}rotate - rotate command
┃✪  ${prefix}brightness - brightness command
┃✪  ${prefix}contrast - contrast command
┃✪  ${prefix}flip - flip command
┃✪  ${prefix}greyscale - greyscale command
┃✪  ${prefix}bw - bw command
┃✪  ${prefix}invert - invert command
┃✪  ${prefix}negative - negative command
┃✪  ${prefix}sepia - sepia command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🏷️ STICKER CREATOR ❯✦━⊷
┃✪  ${prefix}attp - attp command
┃✪  ${prefix}emojimix - emojimix command
┃✪  ${prefix}photo2 - photo2 command
┃✪  ${prefix}scrop2 - scrop2 command
┃✪  ${prefix}gif - gif command
┃✪  ${prefix}simage - simage command
┃✪  ${prefix}sticker - sticker command
┃✪  ${prefix}sticker2 - sticker2 command
┃✪  ${prefix}take2 - take2 command
┃✪  ${prefix}url2 - url2 command
┃✪  ${prefix}write2 - write2 command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎵 MUSIC & MEDIA ❯✦━⊷
┃✪  ${prefix}lyric - lyric command
┃✪  ${prefix}play - play command
┃✪  ${prefix}music - music command
┃✪  ${prefix}song - song command
┃✪  ${prefix}tiktok - tiktok command
┃✪  ${prefix}video - video command
┃✪  ${prefix}ytv - yt video command
┃✪  ${prefix}yt - yt audio  command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 📥 DOWNLOADERS ❯✦━⊷
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔞 NSFW ❯✦━⊷
┃✪  ${prefix}blowjob - blowjob command
┃✪  ${prefix}hentai - hentai command
┃✪  ${prefix}hentaivid - hentaivid command
┃✪  ${prefix}hneko - hneko command
┃✪  ${prefix}hwaifu - hwaifu command
┃✪  ${prefix}trap - trap command
┃✪  ${prefix}xvideo - xvideo command
┃✪  ${prefix}xx1 - xx1 command
┃✪  ${prefix}xx2 - xx2 command
┃✪  ${prefix}xxv1 - xxv1 command
┃✪  ${prefix}xxv2 - xxv2 command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ BUG COMMANDS ❯✦━⊷
┃✪  ${prefix}crash (self) - crash (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔐 ENCRYPTION & SECURITY ❯✦━⊷
┃✪  ${prefix}base64 - base64 command
┃✪  ${prefix}decrypt - decrypt command
┃✪  ${prefix}hash - hash command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🐙 GITHUB TOOLS ❯✦━⊷
┃✪  ${prefix}gitcommits - gitcommits command
┃✪  ${prefix}gitforks - gitforks command
┃✪  ${prefix}github - github command
┃✪  ${prefix}gitissues - gitissues command
┃✪  ${prefix}gitpulls - gitpulls command
┃✪  ${prefix}gitreleases - gitreleases command
┃✪  ${prefix}gitrepo - gitrepo command
┃✪  ${prefix}repo - repo command
┃✪  ${prefix}gitsearch - gitsearch command
┃✪  ${prefix}gitstats - gitstats command
┃✪  ${prefix}gittrending - gittrending command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🎨 LOGO CREATORS ❯✦━⊷
┃✪  ${prefix}fire - fire command
┃✪  ${prefix}neon - neon command
┃✪  ${prefix}hacker - hacker command
┃✪  ${prefix}dragonball - dragonball command
┃✪  ${prefix}naruto - naruto command
┃✪  ${prefix}didong - didong command
┃✪  ${prefix}wall - wall command
┃✪  ${prefix}summer - summer command
┃✪  ${prefix}neonlight - neonlight command
┃✪  ${prefix}greenneon - greenneon command
┃✪  ${prefix}glitch - glitch command
┃✪  ${prefix}devil - devil command
┃✪  ${prefix}boom - boom command
┃✪  ${prefix}water - water command
┃✪  ${prefix}snow - snow command
┃✪  ${prefix}transformer - transformer command
┃✪  ${prefix}thunder - thunder command
┃✪  ${prefix}harrypotter - harrypotter command
┃✪  ${prefix}foggyglass - foggyglass command
┃✪  ${prefix}whitegold - whitegold command
┃✪  ${prefix}lightglow - lightglow command
┃✪  ${prefix}thor - thor command
┃✪  ${prefix}purple - purple command
┃✪  ${prefix}gold - gold command
┃✪  ${prefix}arena - arena command
┃✪  ${prefix}incandescent - incandescent command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔍 SEARCH & INFO ❯✦━⊷
┃✪  ${prefix}dictionary - dictionary command
┃✪  ${prefix}dict - dict command
┃✪  ${prefix}define - define command
┃✪  ${prefix}meaning - meaning command
┃✪  ${prefix}images - images command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 💡 UTILITY TOOLS ❯✦━⊷
┃✪  ${prefix}blacklist - blacklist command
┃✪  ${prefix}menu - menu command
┃✪  ${prefix}save - save command
┃✪  ${prefix}vv - vv command
┃✪  ${prefix}owner - get owner contact
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔗 URL TOOLS ❯✦━⊷
┃✪  ${prefix}expand - expand command
┃✪  ${prefix}qrcode - qrcode command
┃✪  ${prefix}shorten - shorten command
┃✪  ${prefix}urlcheck - urlcheck command
┃✪  ${prefix}urlpreview - urlpreview command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🙏 RELIGIOUS & SPIRITUAL ❯✦━⊷
┃✪  ${prefix}quran - quran command
┃✪  ${prefix}bible - bible command
┃✪  ${prefix}holybook - holybook command
┃✪  ${prefix}biblelist - biblelist command
┃✪  ${prefix}holybooks - holybooks command
┃✪  ${prefix}surah - surah command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔄 BOT MODES ❯✦━⊷
┃✪  ${prefix}mode - mode command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ ℹ️ BOT INFO ❯✦━⊷
┃✪  ${prefix}xmd - xmd command
┃✪  ${prefix}alive - alive command
┃✪  ${prefix}online - online command
┃✪  ${prefix}status - status command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔧 OTHER COMMANDS ❯✦━⊷
┃✪  ${prefix}keepon - keepon command
┃✪  ${prefix}keepoff - keepoff command
┃✪  ${prefix}qr - qr command
┃✪  ${prefix}reboot - reboot command
┃✪  ${prefix}trt2 - trt2 command
┃✪  ${prefix}update - update command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🔄 AUTOMATION COMMANDS ❯✦━⊷
┃✪  ${prefix}autoreact (self) - autoreact (self) command
┃✪  ${prefix}autorecording (self) - autorecording (self) command
┃✪  ${prefix}autotyping (self) - autotyping (self) command
┃✪  ${prefix}autoviewstatus (self) - autoviewstatus (self) command
┃✪  ${prefix}antidelete (self) - antidelete tracker
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🛡️ ANTI-COMMANDS ❯✦━⊷
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 📁 FILE MANAGEMENT ❯✦━⊷
┃✪  ${prefix}datafile (self) - datafile (self) command
┃✪  ${prefix}files (self) - files (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ ⚙️ SELF SETTINGS ❯✦━⊷
┃✪  ${prefix}settings (self) - settings (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🤖 SELF MODE COMMANDS ❯✦━⊷
┃✪  ${prefix}block (self) - block (self) command
┃✪  ${prefix}fullpp (self) - fullpp (self) command
┃✪  ${prefix}unblock (self) - unblock (self) command
┃✪  ${prefix}vv2 (self) - vv2 (self) command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 📸 SCREENSHOTS ❯✦━⊷
┃✪  ${prefix}jpg - jpg command
┃✪  ${prefix}png - png command
┃✪  ${prefix}screenscrop - screenscrop command
┃✪  ${prefix}screenshot - screenshot command
┃✪  ${prefix}screenswidth - screenswidth command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 🖼️ IMAGE SEARCH & GENERATION ❯✦━⊷
┃✪  ${prefix}imgs - imgs command
┃✪  ${prefix}image - image command
┃✪  ${prefix}messi - messi command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ ⚽ FOOTBALL LIVE ❯✦━⊷
┃✪  ${prefix}cl_matchday - cl_matchday command
┃✪  ${prefix}cl_news - cl_news command
┃✪  ${prefix}cl_table - cl_table command
┃✪  ${prefix}cl_top_scorer - cl_top_scorer command
┃✪  ${prefix}liga_portugal_highlights - liga_portugal_highlights command
┃✪  ${prefix}liga_portugal_matchday - liga_portugal_matchday command
┃✪  ${prefix}liga_portugal_news - liga_portugal_news command
┃✪  ${prefix}liga_portugal_table - liga_portugal_table command
┃✪  ${prefix}liga_portugal_top_assist - liga_portugal_top_assist command
┃✪  ${prefix}liga_portugal_top_scorer - liga_portugal_top_scorer command
┃✪  ${prefix}wc_matchday - wc_matchday command
┃✪  ${prefix}wc_news - wc_news command
┃✪  ${prefix}wc_table - wc_table command
┃✪  ${prefix}wc_top_scorer - wc_top_scorer command
╰━━━━━━━━━━━━━━━━━⊷

╭━━━✦❮ 💻 CODE RUNNER & TOOLS ❯✦━⊷
┃✪  ${prefix}carbon - carbon command
┃✪  ${prefix}C - C command
┃✪  ${prefix}run-carbon - run-carbon command
┃✪  ${prefix}debinary - debinary command
┃✪  ${prefix}decode - decode command
┃✪  ${prefix}decodebinary - decodebinary command
┃✪  ${prefix}ebinary - ebinary command
┃✪  ${prefix}encode - encode command
┃✪  ${prefix}encodebinary - encodebinary command
┃✪  ${prefix}obfuscate - obfuscate command
┃✪  ${prefix}obfu - obfu command
┃✪  ${prefix}run-c - run-c command
┃✪  ${prefix}runcc - runcc command
┃✪  ${prefix}runc - runc command
┃✪  ${prefix}run-c++ - run-c++ command
┃✪  ${prefix}c++ - c++ command
┃✪  ${prefix}runc++ - runc++ command
┃✪  ${prefix}run-java - run-java command
┃✪  ${prefix}java - java command
┃✪  ${prefix}runjava - runjava command
┃✪  ${prefix}run-js - run-js command
┃✪  ${prefix}node - node command
┃✪  ${prefix}javascript - javascript command
┃✪  ${prefix}run-py - run-py command
┃✪  ${prefix}python - python command
┃✪  ${prefix}runpy - runpy command
┃✪  ${prefix}scrap - scrap command
┃✪  ${prefix}get - get command
┃✪  ${prefix}find - find command
┃✪  ${prefix}web - web command
┃✪  ${prefix}inspectweb - inspectweb command
┃✪  ${prefix}webinspect - webinspect command
┃✪  ${prefix}webscrap - webscrap command
╰━━━━━━━━━━━━━━━━━⊷

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜᴏʀʟᴀ-ᴘᴏᴏᴋɪᴇ-ʙᴏᴛ©`;



try {  
  // Send menu with image and proper channel info  
  await sock.sendMessage(from, {  
    image: { url: mediaUrls.menuImage },  
    caption: menuText,  
    ...channelInfo  
  }, { quoted: msg });  

} catch (error) {  
  console.log('[ERROR] Failed to send menu image, sending text only:', error.message);  

  // Fallback to text only  
  await sock.sendMessage(from, {  
    text: menuText,  
    ...channelInfo  
  }, { quoted: msg });  
}

}
};