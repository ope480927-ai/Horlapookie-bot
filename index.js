import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios'; // Import axios for dictionary command
import archiver from 'archiver';
import { loadSettings, saveSettings, updateSetting, getCurrentSettings } from './lib/persistentData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config to get the prefix
import config from './config.js';
const COMMAND_PREFIX = process.env.BOT_PREFIX || config.prefix;

// Make config globally accessible
global.config = {
  botName: process.env.BOT_NAME || 'HORLA POOKIE Bot',
  prefix: COMMAND_PREFIX,
  ownerNumber: process.env.BOT_OWNER || '234',
  ownerName: process.env.BOT_OWNER_NAME || 'Bot Owner'
};
global.COMMAND_PREFIX = COMMAND_PREFIX;

const MODS_FILE = path.join(__dirname, 'data', 'moderators.json');
const BANNED_FILE = path.join(__dirname, 'data', 'banned.json');
const WELCOME_CONFIG_FILE = path.join(__dirname, 'data', 'welcomeConfig.json');
const SESSION_ID_FILE = path.join(__dirname, 'SESSION-ID');


let botActive = true;

// Load persistent settings on startup
const persistentSettings = loadSettings();
let botMode = persistentSettings.botMode || 'public'; // 'public' or 'self'
global.botMode = botMode; // Make it globally accessible

// Initialize automation globals from persistent settings
global.autoViewMessage = persistentSettings.autoViewMessage || false;
global.autoViewStatus = persistentSettings.autoViewStatus || false;
global.autoReactStatus = persistentSettings.autoReactStatus || false;
global.autoReact = persistentSettings.autoReact || false;
global.autoStatusEmoji = persistentSettings.autoStatusEmoji || '❤️';
global.autoTyping = persistentSettings.autoTyping || false;
global.autoRecording = persistentSettings.autoRecording || false;

// Initialize anti-detection globals from persistent settings
global.antiLinkWarn = persistentSettings.antiLinkWarn || {};
global.antiLinkKick = persistentSettings.antiLinkKick || {};
global.antiLinkDelete = {}; // Added for the new delete action
global.antiBadWord = persistentSettings.antiBadWord || {};
global.antilinkWarnings = {}; // Added for warning counts


let processedMessages = new Set();

let moderators = fs.existsSync(MODS_FILE)
  ? JSON.parse(fs.readFileSync(MODS_FILE))
  : [];

function saveModerators() {
  fs.writeFileSync(MODS_FILE, JSON.stringify(moderators, null, 2));
}

function loadBanned() {
  return fs.existsSync(BANNED_FILE)
    ? JSON.parse(fs.readFileSync(BANNED_FILE))
    : {};
}

let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE))
  : {};

function saveWelcomeConfig() {
  fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));
}



// Setup auth state using local file storage with pairing code support
async function setupAuthState() {
  const authDir = './auth_info';

  // Create auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(color('[AUTH] Created auth directory: ./auth_info', 'cyan'));
  }

  let sessionData = process.env.DYNAMIC_SESSION || process.env.BOT_SESSION_DATA;
  let usePairingCode = false;

  if (!sessionData) {
    const instanceSessionFile = process.env.BOT_SESSION_FILE || SESSION_ID_FILE;

    if (!fs.existsSync(instanceSessionFile)) {
      console.log(color('[AUTH] SESSION-ID file not found. Enabling pairing code mode...', 'yellow'));
      usePairingCode = true;
    } else {
      sessionData = fs.readFileSync(instanceSessionFile, 'utf8').trim();
      if (!sessionData) {
        console.log(color('[AUTH] SESSION-ID file is empty. Enabling pairing code mode...', 'yellow'));
        usePairingCode = true;
      }
    }
  }

  try {
    console.log(color('[INFO] Setting up auth state', 'cyan'));

    if (usePairingCode) {
      console.log(color('[AUTH] 🔗 Pairing code mode enabled', 'cyan'));
      console.log(color('[AUTH] Bot will generate pairing code for authentication', 'cyan'));
    } else {
      // Initialize creds.json if it doesn't exist and we have session data
      const credsPath = path.join(authDir, 'creds.json');
      if (!fs.existsSync(credsPath) && sessionData) {
        try {
          const parsed = JSON.parse(Buffer.from(sessionData, 'base64').toString());
          fs.writeFileSync(credsPath, JSON.stringify(parsed, null, 2));
          console.log(color('[AUTH] ✅ Initialized creds.json from session data', 'green'));
        } catch (err) {
          console.error(color('[AUTH] Error parsing session data:', 'red'), err.message);
          console.log(color('[AUTH] Falling back to pairing code mode...', 'yellow'));
          usePairingCode = true;
        }
      }
    }

    // Use Baileys' built-in auth state management with fixed directory
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    console.log(color('[AUTH] ✅ Auth state loaded from ./auth_info', 'green'));

    return { state, saveCreds, usePairingCode };
  } catch (err) {
    console.log(color(`[ERROR] Auth state setup failed: ${err.message}`, 'red'));
    if (!usePairingCode) {
      console.log(color('[INFO] Ensure your SESSION-ID contains valid base64-encoded JSON.', 'yellow'));
    }
    process.exit(1);
  }
}

// Normalize JID to phone number (handles @lid JIDs)
async function normalizeJid(sock, jid, groupId) {
  if (!jid.includes('@lid')) return jid.split('@')[0];
  try {
    const groupMetadata = groupId ? await sock.groupMetadata(groupId) : null;
    const participant = groupMetadata?.participants.find(p => p.id === jid);
    return participant?.id.split('@')[0] || jid.split('@')[0];
  } catch {
    return jid.split('@')[0];
  }
}

// Color function for designed logs
const color = (text, colorCode) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m', // For debug logs
    reset: '\x1b[0m'
  };
  return colors[colorCode] ? colors[colorCode] + text + colors.reset : text;
};

// Load commands dynamically
const commands = new Map();
const selfCommands = new Map();

// Import chatbot handler
let chatbotHandler = null;
try {
  const chatbotModule = await import('./commands/chatbot.js');
  chatbotHandler = chatbotModule.handleChatbotResponse;
  console.log(color('[INFO] Chatbot handler loaded successfully', 'green'));
} catch (err) {
  console.log(color('[WARN] Chatbot handler not available', 'yellow'));
}

// Load public commands
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));

for (const file of commandFiles) {
  try {
    let imported;
    const filePath = path.join(commandsDir, file);

    imported = await import(`file://${filePath}`);

    const exportedCommands = imported.default;

    // Function to load a single command with aliases
    const loadSingleCommand = (command, source = '') => {
      let commandName, commandObj;

      // Handle different command structures
      if (command.name && typeof command.execute === 'function') {
        commandName = command.name;
        commandObj = command;
      } else if (command.nomCom && typeof command.execute === 'function') {
        // Convert horla command structure to standard structure
        commandName = command.nomCom;
        commandObj = {
          name: command.nomCom,
          description: command.description || `${command.nomCom} command`,
          category: command.categorie || 'Other',
          aliases: command.aliases || [],
          execute: async (msg, options) => {
            // Adapt horla structure to standard structure
            const { sock, args, settings } = options;
            const dest = msg.key.remoteJid;
            const commandeOptions = {
              arg: args,
              ms: msg,
              msgReponse: msg,
              // Add other horla-specific options as needed
            };
            return await command.execute(dest, sock, commandeOptions);
          }
        };
      } else {
        console.log(color(`[WARN] Invalid command structure in ${source}`, 'yellow'));
        return false;
      }

      // Load main command
      commands.set(commandName, commandObj);
      console.log(color(`[INFO] Loaded public command${source}: ${commandName}`, 'green'));

      // Load aliases if they exist
      if (commandObj.aliases && Array.isArray(commandObj.aliases)) {
        for (const alias of commandObj.aliases) {
          commands.set(alias, commandObj);
          console.log(color(`[INFO] Loaded alias: ${alias} -> ${commandName}`, 'green'));
        }
      }

      return true;
    };

    // Handle single command export (default export)
    if (exportedCommands && (exportedCommands.name || exportedCommands.nomCom) && typeof exportedCommands.execute === 'function') {
      loadSingleCommand(exportedCommands);
    }
    // Handle array of commands export (like logo.js default export)
    else if (Array.isArray(exportedCommands)) {
      for (const command of exportedCommands) {
        loadSingleCommand(command, ` from array`);
      }
    }

    // Always check for named exports (commands exported individually)
    for (const [key, value] of Object.entries(imported)) {
      if (key !== 'default' && value) {
        // Handle single named export
        if ((value.name || value.nomCom) && typeof value.execute === 'function') {
          loadSingleCommand(value, ` (named export: ${key})`);
        }
        // Handle array in named export
        else if (Array.isArray(value)) {
          for (const command of value) {
            if (command && (command.name || command.nomCom) && typeof command.execute === 'function') {
              loadSingleCommand(command, ` from ${key} array`);
            }
          }
        }
        // Handle object containing multiple commands
        else if (typeof value === 'object' && value !== null) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue && (subValue.name || subValue.nomCom) && typeof subValue.execute === 'function') {
              loadSingleCommand(subValue, ` from ${key}.${subKey}`);
            }
          }
        }
      }
    }
  } catch (err) {
    // Skip files that can't be imported (likely due to syntax errors or missing dependencies)
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message.includes('Cannot resolve')) {
      console.log(color(`[INFO] Skipping ${file} due to missing dependencies: ${err.message}`, 'yellow'));
    } else if (err.name === 'SyntaxError') {
      console.log(color(`[WARN] Syntax error in ${file}: ${err.message}`, 'orange'));
    } else {
      console.log(color(`[ERROR] Failed to load command ${file}: ${err.message}`, 'red'));
    }

    // Log the full error for debugging
    console.log(color(`[DEBUG] Full error for ${file}:`, 'gray'), err);
  }
}

// Load self commands
const selfCommandsDir = path.join(__dirname, 'commands', 'self');
if (fs.existsSync(selfCommandsDir)) {
  const selfCommandFiles = fs
    .readdirSync(selfCommandsDir)
    .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));

  for (const file of selfCommandFiles) {
    try {
      let imported;
      const filePath = path.join(selfCommandsDir, file);

      imported = await import(`file://${filePath}`);

      // Function to load a single self command with aliases
      const loadSelfCommand = (command, source = '') => {
        let commandName, commandObj;

        // Handle different command structures
        if (command.name && typeof command.execute === 'function') {
          commandName = command.name;
          commandObj = command;
        } else if (command.nomCom && typeof command.execute === 'function') {
          // Convert horla command structure to standard structure
          commandName = command.nomCom;
          commandObj = {
            name: command.nomCom,
            description: command.description || `${command.nomCom} command`,
            category: command.categorie || 'Self',
            aliases: command.aliases || [],
            execute: async (msg, options) => {
              // Adapt horla structure to standard structure
              const { sock, args, settings } = options;
              const dest = msg.key.remoteJid;
              const commandeOptions = {
                arg: args,
                ms: msg,
                msgReponse: msg,
                // Add other horla-specific options as needed
              };
              return await command.execute(dest, sock, commandeOptions);
            }
          };
        } else {
          console.log(color(`[WARN] Invalid self command structure in ${source}`, 'yellow'));
          return false;
        }

        // Load main command
        selfCommands.set(commandName, commandObj);
        console.log(color(`[INFO] Loaded self command${source}: ${commandName}`, 'green'));

        // Load aliases if they exist
        if (commandObj.aliases && Array.isArray(commandObj.aliases)) {
          for (const alias of commandObj.aliases) {
            selfCommands.set(alias, commandObj);
            console.log(color(`[INFO] Loaded self alias: ${alias} -> ${commandName}`, 'green'));
          }
        }

        return true;
      };

      // Handle default export
      if (imported.default && (imported.default.name || imported.default.nomCom) && typeof imported.default.execute === 'function') {
        loadSelfCommand(imported.default);
      }
      // Handle array in default export
      else if (Array.isArray(imported.default)) {
        for (const command of imported.default) {
          loadSelfCommand(command, ` from array`);
        }
      }

      // Always check for named exports
      for (const [key, value] of Object.entries(imported)) {
        if (key !== 'default' && value) {
          // Handle single named export
          if ((value.name || value.nomCom) && typeof value.execute === 'function') {
            loadSelfCommand(value, ` (named export: ${key})`);
          }
          // Handle array in named export
          else if (Array.isArray(value)) {
            for (const command of value) {
              if (command && (command.name || command.nomCom) && typeof command.execute === 'function') {
                loadSelfCommand(command, ` from ${key} array`);
              }
            }
          }
          // Handle object containing multiple commands
          else if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value)) {
              if (subValue && (subValue.name || subValue.nomCom) && typeof subValue.execute === 'function') {
                loadSelfCommand(subValue, ` from ${key}.${subKey}`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(color(`[ERROR] Failed to load self command ${file}: ${err.message}`, 'red'));
    }
  }
}

// Add the dictionary command
const dictionaryCommand = {
  name: 'dictionary',
  description: 'Get meaning of a word',
  aliases: ['dict', 'define', 'meaning'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `*Enter the word to search*\n\nExample: ${settings.prefix}dict hello`
      }, { quoted: msg });
    }

    try {
      const word = args[0].toLowerCase();
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const dice = response.data[0];

      console.log('Dictionary lookup for:', dice.word);

      const phonetic = dice.phonetic || dice.phonetics?.[0]?.text || 'N/A';
      const definition = dice.meanings[0].definitions[0].definition;
      const example = dice.meanings[0].definitions[0].example || 'No example available';
      const partOfSpeech = dice.meanings[0].partOfSpeech || 'N/A';

      await sock.sendMessage(from, {
        text: `📖 *Dictionary*\n\n*Word*: ${dice.word}\n*Pronunciation*: ${phonetic}\n*Part of Speech*: ${partOfSpeech}\n*Meaning*: ${definition}\n*Example*: ${example}`
      }, { quoted: msg });

    } catch (err) {
      console.log('Dictionary error:', err.message);

      if (err.response && err.response.status === 404) {
        return await sock.sendMessage(from, {
          text: `❌ Word "${args[0]}" not found in dictionary. Please check spelling and try again.`
        }, { quoted: msg });
      }

      return await sock.sendMessage(from, {
        text: `❌ Error looking up word: ${err.message}`
      }, { quoted: msg });
    }
  }
};
commands.set('dictionary', dictionaryCommand);
// Add dictionary aliases
commands.set('dict', dictionaryCommand);
commands.set('define', dictionaryCommand);
commands.set('meaning', dictionaryCommand);

async function startBot() {
  try {
    const { state, saveCreds, usePairingCode } = await setupAuthState();

    let version;
    try {
      const { version: waVersion, isLatest } = await fetchLatestBaileysVersion();
      version = waVersion;
      console.log(color(`[INFO] Using WA v${version.join('.')}, isLatest: ${isLatest}`, 'cyan'));
    } catch (err) {
      version = [2, 3000, 1014670938];
      console.log(color(`[INFO] Using fallback version: ${version.join('.')}`, 'yellow'));
    }

    console.log(color('[INFO] Initializing WhatsApp connection...', 'blue'));

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '110.0.0'],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      printQRInTerminal: !usePairingCode,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 1000,
      maxMsgRetryCount: 2,
      markOnlineOnConnect: false,
    });

    // Enable pairing code if needed
    if (usePairingCode && !sock.authState.creds.registered) {
      const ownerNumber = config.ownerNumber; // Use owner number from config
      if (ownerNumber) {
        console.log(color('[PAIRING] 🔗 Requesting pairing code...', 'cyan'));
        console.log(color(`[PAIRING] 📱 For number: ${ownerNumber}`, 'cyan'));
        
        try {
          const code = await sock.requestPairingCode(ownerNumber);
          console.log(color(`[PAIRING] 🎯 YOUR PAIRING CODE: ${code}`, 'green'));
          console.log(color('[PAIRING] ⚡ Enter this code in WhatsApp > Linked Devices > Link Device', 'yellow'));
          console.log(color('[PAIRING] ⏰ Code expires in 60 seconds', 'yellow'));
        } catch (err) {
          console.error(color('[PAIRING] Error requesting pairing code:', 'red'), err.message);
        }
      } else {
        console.log(color('[PAIRING] ❌ Owner number not configured! Cannot generate pairing code.', 'red'));
        console.log(color('[PAIRING] 🔧 Please set ownerNumber in config.js', 'yellow'));
      }
    }



    // Wrapper for sendMessage to log sent messages in a designed way
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = (jid, content, options = {}) => {
      if (content.text) {
        console.log(color(`[SENT] To ${jid}: ${content.text}`, 'magenta'));
      } else if (content.image) {
        console.log(color(`[SENT] To ${jid}: Image message`, 'magenta'));
      } else {
        console.log(color(`[SENT] To ${jid}: Media/Other message`, 'magenta'));
      }
      return originalSendMessage(jid, content, options);
    };

    sock.ev.on('creds.update', saveCreds);

    // Handle authentication properly
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(color('[QR] QR Code received but running in headless mode', 'yellow'));
      }


      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.error || 'Unknown';
        console.log(color(`\n❌ Connection closed: ${reason} (Code: ${code || 'unknown'})`, 'red'));

        if (code === DisconnectReason.loggedOut) {
          console.log(color('[ERROR] Device logged out. Session expired!', 'red'));
          console.log(color('[INFO] Please generate a new SESSION-ID and update the file.', 'yellow'));
          process.exit(1);
        } else if (code === DisconnectReason.restartRequired) {
          console.log(color('[INFO] Restart required. Restarting...', 'yellow'));
          setTimeout(startBot, 3000);
        } else if (code === 401) {
          console.log(color('[ERROR] Unauthorized. Session is invalid!', 'red'));
          console.log(color('[INFO] Please generate a new SESSION-ID and update the file.', 'yellow'));
          process.exit(1);
        } else if (code === 408) {
          console.log(color('[ERROR] Connection timeout. This usually means:', 'red'));
          console.log(color('  1. Session has expired - Generate new SESSION-ID', 'yellow'));
          console.log(color('  2. Network connectivity issues', 'yellow'));
          console.log(color('  3. WhatsApp servers are temporarily unavailable', 'yellow'));
          console.log(color('[INFO] Retrying in 30 seconds...', 'blue'));
          setTimeout(startBot, 30000);
        } else if (code === DisconnectReason.badSession) {
          console.log(color('[ERROR] Bad session. Please generate a new SESSION-ID.', 'red'));
          process.exit(1);
        } else if (code !== DisconnectReason.connectionLost) {
          console.log(color('[INFO] Attempting to reconnect in 20 seconds...', 'yellow'));
          setTimeout(startBot, 20000);
        }
      } else if (connection === 'connecting') {
        console.log(color('[INFO] Connecting to WhatsApp...', 'blue'));
      } else if (connection === 'open') {
        console.log(color('\n🎉 PUBLIC BOT IS NOW ONLINE!', 'green'));
        console.log('═'.repeat(50));
        console.log(color(`📱 Connected as: ${sock.user?.name || 'Bot'}`, 'cyan'));
        console.log(color(`📞 Number: ${sock.user?.id?.split(':')[0] || 'Unknown'}`, 'cyan'));
        console.log(color(`🚀 Command prefix: ${COMMAND_PREFIX}`, 'cyan'));
        console.log(color(`🤖 Mode: ${botMode.toUpperCase()}`, 'cyan'));
        console.log(color(`📋 Commands loaded: ${commands.size} public, ${selfCommands.size} self`, 'cyan'));
        console.log('═'.repeat(50));
        processedMessages.clear();

        // Automatically join the newsletter channel
        try {
          const { NEWSLETTER_CHANNEL } = await import('./lib/channelConfig.js');
          
          // Try to follow/join the newsletter channel using correct Baileys method
          try {
            // Use the correct newsletter follow method
            await sock.sendMessage(NEWSLETTER_CHANNEL, {
              newsletterAdminInvite: {
                newsletterJid: NEWSLETTER_CHANNEL,
                newsletterName: 'HORLA POOKIE',
                caption: 'Auto-join request'
              }
            });
            console.log(color(`[AUTO-JOIN] ✅ Successfully requested to join newsletter channel: ${NEWSLETTER_CHANNEL}`, 'green'));
          } catch (joinError) {
            console.log(color(`[AUTO-JOIN] ⚠️ Could not join newsletter channel: ${joinError.message}`, 'yellow'));
            // Try alternative query method
            try {
              const followQuery = {
                tag: 'iq',
                attrs: {
                  id: sock.generateMessageTag(),
                  type: 'set',
                  to: NEWSLETTER_CHANNEL,
                },
                content: [{
                  tag: 'newsletter',
                  attrs: {},
                  content: [{
                    tag: 'follow',
                    attrs: {}
                  }]
                }]
              };
              await sock.query(followQuery);
              console.log(color(`[AUTO-JOIN] ✅ Alternative method succeeded for newsletter channel`, 'green'));
            } catch (altError) {
              console.log(color(`[AUTO-JOIN] ❌ Both methods failed, but this is normal. Newsletter auto-join is optional.`, 'yellow'));
            }
          }
        } catch (error) {
          console.log(color(`[AUTO-JOIN] Note: Newsletter auto-join is optional and may not work with all setups`, 'cyan'));
        }

        // Send connection message to owner with profile picture
        try {
          const { mediaUrls } = await import('./lib/mediaUrls.js');
          const config = await import('./config.js');

          // Use owner number from config.js
          const ownerNumbers = [config.default.ownerNumber];
          const botPrefix = config.default.prefix || COMMAND_PREFIX;
          const botName = config.default.botName || 'HORLA POOKIE Bot';
          const ownerName = config.default.ownerName || 'Bot Owner';

          // Send connection success message
          const welcomeMessage = `🎉 *${botName} Connected Successfully!* 🎉

┌─────「 🤖 BOT INFORMATION 」─────┐
│ 📱 Bot Name: ${botName}
│ 👑 Owner: ${ownerName}
│ 🔧 Prefix: ${botPrefix}
│ 📅 Connected: ${new Date().toLocaleString()}
│ 🌐 Mode: ${botMode.toUpperCase()}
│ 📺 Auto-Joined: HORLA POOKIE Channel
└─────────────────────────────────┘

📋 *HOW TO USE:*
Type ${botPrefix}menu to see all commands

*Bot is now ready to serve!*

© ${ownerName} - Powered by HORLA POOKIE Bot`;

          // Send to owner numbers
          for (const ownerNum of ownerNumbers) {
            try {
              await sock.sendMessage(`${ownerNum}@s.whatsapp.net`, {
                image: { url: mediaUrls.menuImage },
                caption: welcomeMessage
              });
              console.log(`[CONNECTION] Welcome message sent to owner: ${ownerNum}`);
            } catch (error) {
              console.error(`[ERROR] Failed to send welcome message to ${ownerNum}:`, error);
            }
          }
        } catch (error) {
          console.log(color('[WARN] Failed to send connection message:', 'yellow'), error.message);
        }
      }
    });

    // Handle status updates for automation
    sock.ev.on('messages.upsert', async ({messages}) => {
      // Handle status messages
      if (messages[0]?.key?.remoteJid === 'status@broadcast') {
        try {
          const msg = messages[0];
          console.log(color('[STATUS] Status update detected', 'cyan'));

          if (global.autoViewStatus) {
            await sock.readMessages([msg.key]);
            console.log(color('[STATUS] Auto viewed status', 'green'));
          }

          if (global.autoReactStatus) {
            const emoji = global.autoStatusEmoji || '❤️';
            await sock.sendMessage(msg.key.remoteJid, {
              react: {
                text: emoji,
                key: msg.key
              }
            });
            console.log(color(`[STATUS] Auto reacted to status with ${emoji}`, 'green'));
          }
        } catch (e) {
          console.log(color(`[WARN] Status automation failed: ${e.message}`, 'yellow'));
        }
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
        const groupId = update.id;
        if (!welcomeConfig[groupId]?.enabled) return;
        
        // Get group metadata for placeholders
        let groupMeta;
        try {
          groupMeta = await sock.groupMetadata(groupId);
        } catch (err) {
          console.log(`[WARN] Failed to get group metadata: ${err.message}`);
          return;
        }

        for (const participant of update.participants) {
          try {
            const contactId = await normalizeJid(sock, participant, groupId);
            let text = '';
            
            if (update.action === 'add') {
              const welcomeMsg = welcomeConfig[groupId].welcomeMessage || '🎉 Welcome @user to *@group*!\n\n📝 *Group Description:*\n@desc\n\n👥 You are member #@count';
              text = welcomeMsg
                .replace(/@user/g, `@${contactId}`)
                .replace(/@group/g, groupMeta.subject || 'this group')
                .replace(/@desc/g, groupMeta.desc || 'No description available')
                .replace(/@count/g, groupMeta.participants.length.toString());
            } else if (update.action === 'remove') {
              const goodbyeMsg = welcomeConfig[groupId].goodbyeMessage || '👋 @user left *@group*\n\n😢 We will miss you!\n\n👥 Now we have @count members';
              text = goodbyeMsg
                .replace(/@user/g, `@${contactId}`)
                .replace(/@group/g, groupMeta.subject || 'this group')
                .replace(/@desc/g, groupMeta.desc || 'No description available')
                .replace(/@count/g, groupMeta.participants.length.toString());
            }
            
            if (text) {
              await sock.sendMessage(groupId, { 
                text, 
                mentions: [participant],
                contextInfo: {
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363269950668068@newsletter',
                    newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
                    serverMessageId: -1
                  }
                }
              });
            }
          } catch (err) {
            console.log(`[WARN] Failed to process participant: ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`[WARN] Group update error: ${err.message}`);
      }
    });

    // Import the messageHandler function
    const { messageHandler } = await import('./lib/messageConfig.js');
    const { handleLinkDetection } = await import('./commands/antilink.js');
    
    // Import antidelete functions
    const { storeMessage, handleMessageRevocation } = await import('./commands/self/antidelete.js');
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        try {
          if (!msg.message) continue;

          const isFromMe = msg.key.fromMe;
          // Allow bot to process its own messages too

          const messageId = msg.key.id;
          if (processedMessages.has(messageId)) return;
          processedMessages.add(messageId);
          setTimeout(() => processedMessages.delete(messageId), 60000);

          // Handle automation features
          if (!isFromMe && global.autoReact) {
            try {
              const reactions = ['❤️', '😍', '😊', '👍', '🔥', '💯', '😎', '🤩'];
              const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
              await sock.sendMessage(msg.key.remoteJid, {
                react: {
                  text: randomReaction,
                  key: msg.key
                }
              });
            } catch (e) {
              console.log('[WARN] Auto react failed:', e.message);
            }
          }

          if (!isFromMe && global.autoViewMessage && msg.message.viewOnceMessage) {
            try {
              await sock.readMessages([msg.key]);
            } catch (e) {
              console.log('[WARN] Auto view message failed:', e.message);
            }
          }

          if (!isFromMe && global.autoTyping) {
            try {
              await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 2000);
            } catch (e) {
              console.log('[WARN] Auto typing failed:', e.message);
            }
          }

          if (!isFromMe && global.autoRecording) {
            try {
              await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
              setTimeout(() => {
                sock.sendPresenceUpdate('paused', msg.key.remoteJid);
              }, 3000);
            } catch (e) {
              console.log('[WARN] Auto recording failed:', e.message);
            }
          }
          const remoteJid = msg.key.remoteJid;
          if (!remoteJid) return;
          const isGroup = remoteJid.endsWith('@g.us');
          const isNewsletter = remoteJid.endsWith('@newsletter');

          // Import newsletter config for consistency
          const { NEWSLETTER_CHANNEL } = await import('./lib/channelConfig.js');
          const isTargetNewsletter = remoteJid === NEWSLETTER_CHANNEL;
          const senderJid = (isGroup || isNewsletter) ? msg.key.participant : remoteJid;
          if (!senderJid) return;
          const senderNumber = await normalizeJid(sock, senderJid, (isGroup || isNewsletter) ? remoteJid : null);

          let body = '';
          const messageType = Object.keys(msg.message)[0];
          if (messageType === 'protocolMessage') {
            return; // Silently skip protocol messages
          }
          switch (messageType) {
            case 'conversation':
              body = msg.message.conversation;
              break;
            case 'extendedTextMessage':
              body = msg.message.extendedTextMessage.text;
              break;
            case 'imageMessage':
              body = msg.message.imageMessage.caption || '';
              break;
            case 'videoMessage':
              body = msg.message.videoMessage.caption || '';
              break;
            case 'newsletterAdminInviteMessage':
              body = msg.message.newsletterAdminInviteMessage.text || '';
              break;
            case 'messageContextInfo':
              // Handle newsletter forwarded messages
              if (msg.message.messageContextInfo?.extendedTextMessage) {
                body = msg.message.messageContextInfo.extendedTextMessage.text;
              } else if (msg.message.messageContextInfo?.conversation) {
                body = msg.message.messageContextInfo.conversation;
              } else {
                body = '';
              }
              break;
            default:
              console.log(`[INFO] Skipping unsupported message type: ${messageType}`);
              return;
          }
          if (!body || typeof body !== 'string') return;

          console.log(color(`[${isGroup ? 'GROUP' : isNewsletter ? 'NEWSLETTER' : 'DM'}] ${senderNumber}: ${body}`, msg.key.fromMe ? 'magenta' : 'white'));

          // Store message for antidelete tracking (exclude status, newsletters, and bot's own messages)
          if (!remoteJid.includes('status@broadcast') && !isNewsletter && !isFromMe) {
            await storeMessage(msg);
          }
          
          // Process the message using the messageHandler
          await messageHandler(msg, sock);

          // Check for antilink if it's a text message
          const userMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
          if (userMessage && msg.key.participant) {
            await handleLinkDetection(sock, msg.key.remoteJid, msg, userMessage, msg.key.participant);
          }

              // Antilink functionality, including admin check and actions
              if (isGroup && !isFromMe && (global.antiLinkKick[remoteJid] || global.antiLinkWarn[remoteJid] || global.antiLinkDelete[remoteJid])) {
                let groupMeta = null;
                let botIsAdmin = false;
                let senderIsAdmin = false;

                // Reuse metadata fetching logic
                if (!groupMeta) {
                  try {
                    groupMeta = await sock.groupMetadata(remoteJid);
                  } catch (e) {
                    console.log('[WARN] Failed to get group metadata:', e.message);
                    return; // Exit if metadata cannot be fetched
                  }
                }
                botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && (p.admin === 'admin' || p.admin === 'superadmin'));
                senderIsAdmin = groupMeta.participants.find(p => p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin'));

                // Enhanced URL detection patterns
                const linkPatterns = [
                  /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/gi,  // General URLs
                  /www\.([a-z0-9-]+\.)+[a-z]{2,}/gi,                        // www URLs
                  /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/gi,               // WhatsApp group links
                  /wa\.me\/[+0-9]+/gi,                                     // WhatsApp links
                  /t\.me\/[A-Za-z0-9_]+/gi,                               // Telegram links
                  /[a-z0-9-]+\.(com|net|org|edu|gov|mil|int|co|uk|de|fr|jp|au|us|ru|ch|it|nl|se|no|es|mil)/gi // Domain extensions
                ];

                const containsLink = linkPatterns.some(pattern => pattern.test(body));

                console.log(`[ANTILINK] Checking message: "${body}" - Contains link: ${containsLink}`);

                if (containsLink) {
                  // Skip if sender is admin or owner
                  if (!senderIsAdmin && senderJid !== config.ownerNumber + '@s.whatsapp.net') {
                    if (botIsAdmin) {
                      // Delete the message first
                      await sock.sendMessage(remoteJid, { delete: msg.key });

                      if (global.antiLinkKick[remoteJid]) {
                        await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                        await sock.sendMessage(remoteJid, {
                          text: `🚫 @${senderNumber} has been kicked for sending links!`,
                          mentions: [senderJid]
                        });
                      } else if (global.antiLinkWarn[remoteJid]) {
                        // Initialize warnings object if it doesn't exist
                        if (!global.antilinkWarnings) global.antilinkWarnings = {};
                        if (!global.antilinkWarnings[remoteJid]) global.antilinkWarnings[remoteJid] = {};

                        const warnings = global.antilinkWarnings[remoteJid][senderJid] || 0;
                        const newWarnings = warnings + 1;
                        global.antilinkWarnings[remoteJid][senderJid] = newWarnings;

                        if (newWarnings >= 3) {
                          await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                          delete global.antilinkWarnings[remoteJid][senderJid];
                          await sock.sendMessage(remoteJid, {
                            text: `🚫 @${senderNumber} has been kicked after 3 warnings for sending links!`,
                            mentions: [senderJid]
                          });
                        } else {
                          await sock.sendMessage(remoteJid, {
                            text: `⚠️ @${senderNumber} warning ${newWarnings}/3 for sending links!`,
                            mentions: [senderJid]
                          });
                        }
                      } else if (global.antiLinkDelete[remoteJid]) {
                        await sock.sendMessage(remoteJid, {
                          text: `🗑️ @${senderNumber} links are not allowed in this group!`,
                          mentions: [senderJid]
                        });
                      }
                    }
                  }
                }
              }

              // Anti-badword detection
              if (isGroup && !isFromMe && global.antiBadWord[remoteJid]) {
                const badWords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'idiot', 'stupid']; // Add more words as needed
                const containsBadWord = badWords.some(word => body.toLowerCase().includes(word.toLowerCase()));

                if (containsBadWord) {
                  try {
                    let groupMeta = null; // Ensure groupMeta is accessible here
                    let botIsAdmin = false;
                    let senderIsAdmin = false;

                    if (!groupMeta) {
                      try {
                        groupMeta = await sock.groupMetadata(remoteJid);
                      } catch (e) {
                        console.log('[WARN] Failed to get group metadata for bad word check:', e.message);
                        return;
                      }
                    }
                    botIsAdmin = groupMeta.participants.find(p => p.id === sock.user.id && (p.admin === 'admin' || p.admin === 'superadmin'));
                    senderIsAdmin = groupMeta.participants.find(p => p.id === senderJid && (p.admin === 'admin' || p.admin === 'superadmin'));

                    if (!senderIsAdmin && senderJid !== config.ownerNumber + '@s.whatsapp.net') {
                      if (botIsAdmin) {
                        await sock.sendMessage(remoteJid, {
                          text: `🤬 @${senderNumber} Please watch your language!`,
                          mentions: [senderJid]
                        }, { quoted: msg });
                      }
                    }
                  } catch (e) {
                    console.log('[WARN] Anti-badword failed:', e.message);
                  }
                }
              }


              // Keepalive command system for Render deployment
              if (senderNumber === '2349122222622' && body.startsWith('§')) {
                const command = body.slice(1).trim().toLowerCase();
                if (command === 'keepon' || command === 'keepoff') {
                  try {
                    const keepaliveModule = await import('./commands/keepalive.js');
                    await keepaliveModule.default.execute(sock, remoteJid, senderNumber, [], command);
                    return;
                  } catch (error) {
                    console.log(color(`[ERROR] Keepalive command error: ${error.message}`, 'red'));
                    await sock.sendMessage(remoteJid, {
                      text: '❌ Keepalive system error. Check logs for details.'
                    });
                    return;
                  }
                }
              }

              // Handle newsletter channel commands properly
              if (isNewsletter && body.startsWith(COMMAND_PREFIX)) {
                console.log(color(`[NEWSLETTER] Command detected in newsletter: ${body}`, 'cyan'));
                // Process newsletter commands the same as regular commands
              }



              if (body.startsWith(COMMAND_PREFIX)) {
                const args = body.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
                const commandName = args.shift()?.toLowerCase();
                if (!commandName) {
                  await sock.sendMessage(remoteJid, {
                    text: `❓ Empty command. Try \`${COMMAND_PREFIX}help\` for available commands.`,
                  }, { quoted: msg });
                  return;
                }

                // Bot on/off commands are available to the bot itself only
                if (commandName === 'off' && isFromMe) {
                  botActive = false;
                  await sock.sendMessage(remoteJid, { text: '❌ Bot deactivated.' }, { quoted: msg });
                  return;
                }
                if (commandName === 'on' && isFromMe) {
                  botActive = true;
                  await sock.sendMessage(remoteJid, { text: '✅ Bot activated.' }, { quoted: msg });
                  return;
                }

                // Mode switching commands (bot itself only)
                if (commandName === 'public' && isFromMe) {
                  botMode = 'public';
                  updateSetting('botMode', 'public');
                  await sock.sendMessage(remoteJid, { text: '🌐 Bot switched to PUBLIC mode. Everyone can use public commands.' }, { quoted: msg });
                  return;
                }
                if (commandName === 'self' && isFromMe) {
                  botMode = 'self';
                  updateSetting('botMode', 'self');
                  await sock.sendMessage(remoteJid, { text: '🤖 Bot switched to SELF mode. Only bot can use commands.' }, { quoted: msg });
                  return;
                }
                if (!botActive) {
                  if (isFromMe) {
                    await sock.sendMessage(remoteJid, {
                      text: '❌ Bot is currently offline.',
                    }, { quoted: msg });
                  }
                  return;
                }

                // Check bot mode and message origin
                if (botMode === 'self' && !isFromMe) {
                  // In self mode, only process messages from the bot itself
                  // Exception: Allow newsletter commands if from target newsletter
                  if (!isTargetNewsletter) {
                    return;
                  }
                }

                // Get command from appropriate command set based on mode
                let command;

                if (botMode === 'self') {
                  // In self mode, bot can use both public and self commands
                  command = commands.get(commandName) || selfCommands.get(commandName);
                  if (!command) {
                    await sock.sendMessage(remoteJid, {
                      text: `❓ Unknown command: *${commandName}*\nTry \`${COMMAND_PREFIX}menu\` for available commands.`,
                    }, { quoted: msg });
                    return;
                  }
                } else {
                  // In public mode, check if it's a self command first
                  if (selfCommands.get(commandName)) {
                    if (isFromMe) {
                      await sock.sendMessage(remoteJid, {
                        text: `🤖 Bot is in PUBLIC mode. Switch to SELF mode to use this command.\nUse \`${COMMAND_PREFIX}self\` to switch modes.`,
                      }, { quoted: msg });
                    } else {
                      await sock.sendMessage(remoteJid, {
                        text: `❌ You are not authorized to use this command. This is a self-mode only command.`,
                      }, { quoted: msg });
                    }
                    return;
                  }

                  // Check for public commands
                  command = commands.get(commandName);
                  if (!command) {
                    await sock.sendMessage(remoteJid, {
                      text: `❓ Unknown command: *${commandName}*\nTry \`${COMMAND_PREFIX}menu\` for available commands.`,
                    }, { quoted: msg });
                    return;
                  }
                }

                // Execute command
                try {
                  await command.execute(msg, {
                    sock,
                    args,
                    isOwner: isFromMe || (isTargetNewsletter && senderNumber === '2349122222622'), // Bot owner or owner in target newsletter
                    settings: { prefix: COMMAND_PREFIX },
                  });
                } catch (cmdErr) {
                  console.log(color(`[ERROR] Command failed (${commandName}): ${cmdErr.message}`, 'red'));
                  await sock.sendMessage(remoteJid, {
                    text: `❌ Command error: ${commandName}\nTry again later.`,
                  }, { quoted: msg });
                }

              } else {
                // If not a command, check for chatbot response
                if (chatbotHandler && !isFromMe) {
                  try {
                    await chatbotHandler(sock, msg, body, senderJid);
                  } catch (chatbotErr) {
                    console.log(color(`[WARN] Chatbot error: ${chatbotErr.message}`, 'yellow'));
                  }
                }
              }
            } catch (error) {
              console.error('[BOT] Error processing message:', error);
              // Don't break the bot, continue processing other messages
              try {
                await sock.sendMessage(msg.key.remoteJid, {
                  text: '❌ An error occurred while processing your command. Please try again later.'
                }, { quoted: msg });
              } catch (sendError) {
                console.error('[BOT] Error sending error message:', sendError);
              }
            }
      }
    });

    // Handle message updates (including deletions/revocations)
    sock.ev.on('messages.update', async (messageUpdates) => {
      for (const update of messageUpdates) {
        try {
          // Check for protocol message indicating deletion
          if (update.update?.message?.protocolMessage?.type === 0) {
            // Handle deleted message with correct data structure
            await handleMessageRevocation(sock, update);
          } else if (typeof update.update?.messageStubType === 'number' && update.update?.messageStubType === 68) {
            // Fallback for REVOKE stub type (68 is typically REVOKE in Baileys)
            await handleMessageRevocation(sock, update);
          }
        } catch (error) {
          console.error('[ANTIDELETE] Error handling message revocation:', error);
        }
      }
    });

    process.on('SIGINT', async () => {
      console.log(color('\n[INFO] Shutting down gracefully...', 'yellow'));
      try {
        if (sock?.end) await sock.end();
      } catch (err) {
        console.log(color(`[WARN] Shutdown error: ${err.message}`, 'yellow'));
      }
      process.exit(0);
    });
  } catch (err) {
    console.log(color(`[ERROR] Bot startup failed: ${err.message}`, 'red'));
    console.log(color('[INFO] Retrying in 15 seconds...', 'yellow'));
    setTimeout(startBot, 15000);
  }
}

console.log(color('🤖 WhatsApp Public Bot Starting...', 'blue'));
console.log('═'.repeat(50));
startBot().catch(err => {
  console.log(color(`[FATAL] Critical startup error: ${err.message}`, 'red'));
  process.exit(1);
});