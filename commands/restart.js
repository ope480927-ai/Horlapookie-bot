export default {
  name: 'restart',
  description: 'Restart the bot process',
  aliases: ['reboot', 'reload'],
  async execute(msg, { sock, args, isOwner, settings }) {
    const from = msg.key.remoteJid;

    // Only bot owner can restart
    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: '❌ Only the bot owner can restart the bot.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔄 *Restarting Bot...*\n\n⏳ The bot will restart completely.\n\n💫 Please wait 10-15 seconds for full restart...'
      }, { quoted: msg });

      // Give time for the message to send, then exit process completely
      setTimeout(() => {
        console.log('[RESTART] Bot restart initiated by owner - Full process restart');
        console.log('[RESTART] Exiting process for complete restart...');

        // Force exit the process - Replit will automatically restart it
        process.exit(0);
      }, 2000);

    } catch (error) {
      console.error('[RESTART] Restart failed:', error);
      await sock.sendMessage(from, {
        text: `❌ *Restart Failed*\n\n🚫 Error: ${error.message}\n\nPlease try again or restart manually.`
      }, { quoted: msg });
    }
  }
};