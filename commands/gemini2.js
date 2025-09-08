import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAkxSdt7V5rEn6rQ_UyAVMANNgYvI75H2g');

export default {
  name: 'gemini2',
  aliases: ['gem2', 'g2'],
  description: 'Advanced Gemini AI chat with enhanced responses',
  category: 'AI Commands',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderName = msg.pushName || 'User';

    if (!args || args.length === 0) {
      return await sock.sendMessage(from, {
        text: `🤖 *Gemini 2 AI*\n\nUsage: ?gemini2 <your question>\n\nExample: ?gemini2 Explain quantum physics`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: "🧠 *Gemini 2 is thinking...*"
      }, { quoted: msg });

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = args.join(' ');

      const result = await model.generateContent(`You are Gemini 2, an advanced AI assistant created by Google. You have knowledge about the Horlapookie WhatsApp bot and its website. Be helpful, informative, and friendly. User's name is ${senderName}. Question: ${prompt}`);

      const response = result.response;
      const text = response.text();

      if (text.length > 4000) {
        // Split long responses
        const chunks = text.match(/.{1,4000}/g) || [text];
        for (let i = 0; i < chunks.length; i++) {
          await sock.sendMessage(from, {
            text: `🤖 *Gemini 2 Response ${i + 1}/${chunks.length}*\n\n${chunks[i]}`
          }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(from, {
          text: `🤖 *Gemini 2 Response*\n\n${text}`
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Gemini 2 error:', error);
      await sock.sendMessage(from, {
        text: "❌ Gemini 2 encountered an error. Please try again later."
      }, { quoted: msg });
    }
  }
};