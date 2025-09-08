
# Bug Payloads Directory

This directory contains crash payload files used by the bug commands.

## Required Files:
- `combo_invisible.txt` - Invisible Unicode crash payload
- `singleline_crash.txt` - Single-line massive crash
- `mentions.json` - JSON array of mention strings for group crashes

## File Generation:
Run the following scripts to generate the required files:
- `node junks/make_singleline_crash.js` - Creates singleline_crash.txt
- `node junks/make_mentions.js` - Creates mentions.json
- `node junks/make_media_bomb.js` - Creates media bomb payloads

## Usage:
These files are automatically loaded by bug commands like:
- horla-crash
- uni-crash  
- group-crash
- medinv-crash

⚠️ **WARNING: These are crash payloads designed to freeze/crash WhatsApp clients. Use responsibly!**
