import fs from 'fs';
import path from 'path';

export default {
  name: "fullpp",
  description: "Update your profile picture to full size without cropping",
  aliases: ["updatepp", "ppfull"],
  category: "Profile",
  async execute(msg, { sock }) {
    const from = msg.key.remoteJid;

    try {
      // Check if there's a quoted message with an image
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quotedMsg?.imageMessage) {
        return await sock.sendMessage(from, {
          text: '❌ Please reply to an image to set it as your profile picture.'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: "🔄 Processing image and updating profile picture..."
      }, { quoted: msg });

      // Create message object for download
      const imageMsg = {
        key: {
          remoteJid: from,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant || undefined
        },
        message: quotedMsg
      };

      // Download the image
      const buffer = await sock.downloadMediaMessage(imageMsg, 'buffer');

      if (!buffer) {
        return await sock.sendMessage(from, {
          text: "❌ Failed to download the image. Please try again."
        }, { quoted: msg });
      }

      // Update profile picture
      await sock.updateProfilePicture(sock.user.id, buffer);

      await sock.sendMessage(from, {
        text: "✅ Profile picture updated successfully! The image has been set to full size without cropping."
      }, { quoted: msg });

    } catch (error) {
      console.error('FullPP error:', error);
      await sock.sendMessage(from, {
        text: "❌ Failed to update profile picture. Please try again or check if the image is valid."
      }, { quoted: msg });
    }
  }
};