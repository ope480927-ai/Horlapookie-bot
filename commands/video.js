import yts from "yt-search";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export default {
  name: 'video',
  description: 'Download video from YouTube',
  aliases: ['vid', 'ytv'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: `*🎬 Video Downloader*\n\nUsage: ${settings.prefix}video <video name or URL>\n\nExample: ${settings.prefix}video funny cats`
      }, { quoted: msg });
    }

    try {
      const query = args.join(' ');
      let videoUrl = "";
      
      await sock.sendMessage(from, {
        text: `🎬 *Searching for video...*\n\n🔍 Query: "${query}"\n⏳ Please wait...`
      }, { quoted: msg });

      let searchResult;
      // Check if it's already a YouTube URL (simple check)
      if (query.includes('youtube.com/watch') || query.includes('youtu.be/')) {
        videoUrl = query;
      } else {
        // Search for the video
        searchResult = await yts(query);
        if (!searchResult.videos.length) {
          return await sock.sendMessage(from, {
            text: "❌ No video results found for your search."
          }, { quoted: msg });
        }
        videoUrl = searchResult.videos[0].url;
        
        // Show search result info
        const video = searchResult.videos[0];
        const searchInfo = `🎬 *Found Video:*\n\n` +
          `📺 *Title:* ${video.title}\n` +
          `👤 *Channel:* ${video.author.name}\n` +
          `⏱️ *Duration:* ${video.timestamp}\n` +
          `👀 *Views:* ${video.views.toLocaleString()}\n` +
          `📅 *Uploaded:* ${video.ago}\n` +
          `🔗 *URL:* ${video.url}\n\n` +
          `⏬ Starting download...`;
        
        await sock.sendMessage(from, {
          image: { url: video.thumbnail },
          caption: searchInfo
        }, { quoted: msg });
      }

      // Get a basic safe title from search result or URL
      let titleRaw = "video";
      if (searchResult && searchResult.videos.length > 0) {
        titleRaw = searchResult.videos[0].title;
      }
      const safeTitle = titleRaw.replace(/[^a-z0-9]/gi, "_").substring(0, 60);
      const tmpDir = path.join(process.cwd(), "tmp");

      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `${safeTitle}.%(ext)s`);
      const outputTemplate = path.join(tmpDir, `${safeTitle}.mp4`);

      // Send initial progress message
      await sock.sendMessage(from, {
        text: `⏳ Downloading video: ${titleRaw}\n🔗 Using yt-dlp for reliable downloads...`
      }, { quoted: msg });

      try {
        // Use yt-dlp with better headers and proxy simulation to bypass bot detection
        const ytDlpCommand = `yt-dlp --format "best[height<=720]" --no-playlist --sleep-interval 2 --max-sleep-interval 5 --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --add-header "Accept-Language:en-US,en;q=0.9" --add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" --add-header "Sec-Fetch-Mode:navigate" --referer "https://www.youtube.com/" -o "${filePath}" "${videoUrl}"`;
        
        await execAsync(ytDlpCommand, { timeout: 600000 }); // 10 minutes timeout for videos
        
        // Find the actual output file (yt-dlp might change the filename)
        const files = fs.readdirSync(tmpDir).filter(file => 
          file.startsWith(safeTitle) && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
        );
        
        if (files.length === 0) {
          throw new Error("No video file found after download");
        }
        
        const actualFilePath = path.join(tmpDir, files[0]);
        
        // Check file size (limit to 100MB for WhatsApp)
        const stats = fs.statSync(actualFilePath);
        if (stats.size > 100 * 1024 * 1024) {
          await sock.sendMessage(from, {
            text: "❌ Video file too large (>100MB). Please try a shorter video."
          }, { quoted: msg });
          fs.unlinkSync(actualFilePath);
          return;
        }

        // Send the video file
        await sock.sendMessage(from, {
          video: { url: actualFilePath },
          caption: `🎬 *${titleRaw}*\n\n✅ Downloaded successfully!`,
          fileName: files[0]
        }, { quoted: msg });

        // Clean up
        fs.unlinkSync(actualFilePath);
        
      } catch (downloadError) {
        console.error("yt-dlp error:", downloadError);
        await sock.sendMessage(from, {
          text: `❌ Download failed: ${downloadError.message}\n\nNote: yt-dlp is more reliable than other downloaders for avoiding bot detection.`
        }, { quoted: msg });
      }

    } catch (error) {
      console.log('Video command error:', error.message);
      await sock.sendMessage(from, {
        text: `❌ Error downloading video: ${error.message}`
      }, { quoted: msg });
    }
  }
};