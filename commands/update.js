import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";

const execAsync = util.promisify(exec);

export default {
  name: 'update',
  description: 'Update bot from GitHub repository',
  aliases: ['upgrade', 'pull'],
  async execute(msg, { sock, args, isOwner, settings }) {
    const from = msg.key.remoteJid;

    // Only bot owner can update
    if (!isOwner) {
      return await sock.sendMessage(from, {
        text: '❌ Only the bot owner can update the bot.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔄 *Starting Bot Update Process...*\n\n⏳ Checking for updates from GitHub...'
      }, { quoted: msg });

      // Define files to preserve during update
      const preserveFiles = [
        'config.js',
        'auth_info/',
        '.env',
        'settings.json',
        'data/',
        'tmp/',
        'instances/'
      ];

      // Create backup directory
      const backupDir = path.join(process.cwd(), 'backup_temp');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      await sock.sendMessage(from, {
        text: '💾 *Backing up important files...*\n\n📁 Preserving:\n• Configuration files\n• Authentication data\n• User data\n• Settings'
      }, { quoted: msg });

      // Backup important files
      for (const file of preserveFiles) {
        const sourcePath = path.join(process.cwd(), file);
        const backupPath = path.join(backupDir, file);
        
        if (fs.existsSync(sourcePath)) {
          try {
            if (fs.statSync(sourcePath).isDirectory()) {
              await execAsync(`cp -r "${sourcePath}" "${backupPath}"`);
            } else {
              // Create directory if needed
              const backupFileDir = path.dirname(backupPath);
              if (!fs.existsSync(backupFileDir)) {
                fs.mkdirSync(backupFileDir, { recursive: true });
              }
              await execAsync(`cp "${sourcePath}" "${backupPath}"`);
            }
            console.log(`[UPDATE] Backed up: ${file}`);
          } catch (error) {
            console.log(`[UPDATE] Warning: Could not backup ${file}: ${error.message}`);
          }
        }
      }

      await sock.sendMessage(from, {
        text: '📥 *Pulling latest changes from GitHub...*\n\n🔗 Repository: GitHub.com/horlapookie/Horlapookie-bot\n⏳ This may take a moment...'
      }, { quoted: msg });

      // Pull latest changes from GitHub
      try {
        // Check if git is initialized
        await execAsync('git status');
        
        // Reset any local changes (except preserved files)
        await execAsync('git stash');
        
        // Pull latest changes
        const { stdout: gitOutput } = await execAsync('git pull origin main');
        console.log('[UPDATE] Git pull output:', gitOutput);
        
        if (gitOutput.includes('Already up to date')) {
          await sock.sendMessage(from, {
            text: '✅ *Bot is already up to date!*\n\n🎉 No new changes found on GitHub.\n📋 Current version is the latest.'
          }, { quoted: msg });
          
          // Clean up backup
          await execAsync(`rm -rf "${backupDir}"`);
          return;
        }
        
      } catch (gitError) {
        // If git fails, clone fresh repository
        console.log('[UPDATE] Git pull failed, attempting fresh clone...');
        
        await sock.sendMessage(from, {
          text: '🔄 *Performing fresh installation...*\n\n⚠️ Git history unavailable, downloading latest version...'
        }, { quoted: msg });
        
        // Remove current files except preserved ones
        const currentFiles = fs.readdirSync(process.cwd());
        for (const file of currentFiles) {
          if (!preserveFiles.includes(file) && file !== 'backup_temp' && !file.startsWith('.')) {
            try {
              const filePath = path.join(process.cwd(), file);
              if (fs.statSync(filePath).isDirectory()) {
                await execAsync(`rm -rf "${filePath}"`);
              } else {
                fs.unlinkSync(filePath);
              }
            } catch (e) {
              console.log(`[UPDATE] Could not remove ${file}:`, e.message);
            }
          }
        }
        
        // Clone fresh repository
        await execAsync('git clone https://github.com/horlapookie/Horlapookie-bot.git temp_repo');
        await execAsync('cp -r temp_repo/* .');
        await execAsync('rm -rf temp_repo');
        await execAsync('git init');
        await execAsync('git remote add origin https://github.com/horlapookie/Horlapookie-bot.git');
      }

      await sock.sendMessage(from, {
        text: '🔄 *Restoring preserved files...*\n\n📁 Restoring your configurations and data...'
      }, { quoted: msg });

      // Restore preserved files
      for (const file of preserveFiles) {
        const backupPath = path.join(backupDir, file);
        const restorePath = path.join(process.cwd(), file);
        
        if (fs.existsSync(backupPath)) {
          try {
            if (fs.statSync(backupPath).isDirectory()) {
              // Remove existing directory if it exists
              if (fs.existsSync(restorePath)) {
                await execAsync(`rm -rf "${restorePath}"`);
              }
              await execAsync(`cp -r "${backupPath}" "${restorePath}"`);
            } else {
              await execAsync(`cp "${backupPath}" "${restorePath}"`);
            }
            console.log(`[UPDATE] Restored: ${file}`);
          } catch (error) {
            console.log(`[UPDATE] Warning: Could not restore ${file}: ${error.message}`);
          }
        }
      }

      await sock.sendMessage(from, {
        text: '📦 *Installing dependencies...*\n\n⏳ Running npm install...'
      }, { quoted: msg });

      // Install/update dependencies
      try {
        const { stdout: npmOutput } = await execAsync('npm install', { timeout: 120000 });
        console.log('[UPDATE] NPM install output:', npmOutput);
      } catch (npmError) {
        console.log('[UPDATE] NPM install warning:', npmError.message);
        // Continue even if npm install has warnings
      }

      // Clean up backup
      await execAsync(`rm -rf "${backupDir}"`);

      await sock.sendMessage(from, {
        text: '✅ *Bot Update Completed Successfully!*\n\n🎉 Changes applied:\n• Latest code from GitHub\n• Dependencies updated\n• Configuration preserved\n• Authentication maintained\n\n🔄 Restart required for changes to take effect.\nUse `' + settings.prefix + 'restart` to restart the bot.'
      }, { quoted: msg });

    } catch (error) {
      console.error('[UPDATE] Update failed:', error);
      
      // Try to restore from backup if available
      const backupDir = path.join(process.cwd(), 'backup_temp');
      if (fs.existsSync(backupDir)) {
        try {
          await sock.sendMessage(from, {
            text: '⚠️ *Update failed, restoring backup...*\n\n🔄 Rolling back changes...'
          }, { quoted: msg });
          
          // Restore from backup
          await execAsync(`cp -r ${backupDir}/* .`);
          await execAsync(`rm -rf "${backupDir}"`);
        } catch (restoreError) {
          console.error('[UPDATE] Backup restore failed:', restoreError);
        }
      }
      
      await sock.sendMessage(from, {
        text: `❌ *Update Failed*\n\n🚫 Error: ${error.message}\n\n💡 Tips:\n• Check internet connection\n• Ensure GitHub repository is accessible\n• Try again in a few minutes\n\nBot is still running with previous version.`
      }, { quoted: msg });
    }
  }
};