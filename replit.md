# Overview

This is a WhatsApp bot built with Node.js using the Baileys library for WhatsApp Web integration. The bot is named "Horlapookie" and provides various automated features including message handling, AI chat capabilities, media processing, and group management functionalities. It supports multiple API integrations for enhanced features like OpenAI for AI responses, Giphy for GIF search, and various other services.

## Recent Changes (September 7, 2025)

### Replit Environment Setup Complete
- **Node.js Environment**: Successfully configured with Node.js 20
- **Dependencies**: All npm packages installed and working (324 public commands, 42 self commands loaded)
- **Workflow Configuration**: WhatsApp Bot workflow properly configured to run with `npm start`
- **Deployment**: Production deployment configured for VM target with proper runtime settings

### Image Processing Fixes
- **JIMP Library Updates**: Fixed all image processing commands to work with the newer JIMP API
- **Commands Fixed**: flip, rotate, brightness, contrast, resize, greyscale, sepia, invert, removeBackground
- **API Changes**: Updated from deprecated `.getBufferAsync()` to `.getBuffer()` method
- **Method Updates**: Fixed parameter formats for resize, flip, and other image operations

### YouTube Download Improvements
- **yt-dlp Integration**: Replaced ytdl-core with system yt-dlp for better reliability
- **Bot Detection Bypass**: yt-dlp handles "sign in to confirm you are not a bot" issues
- **Enhanced Error Handling**: Better error messages and fallback mechanisms for downloads

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Bot Framework
- **WhatsApp Integration**: Uses @whiskeysockets/baileys for WhatsApp Web API connectivity
- **Authentication**: File-based authentication system storing credentials and session data in auth_info directory
- **Configuration Management**: Centralized config system with environment variable support and persistent settings storage

## Message Processing Architecture
- **Command System**: Prefix-based command recognition with configurable prefix (default: '?')
- **Bot Modes**: Supports both 'public' and 'self' modes for different operational contexts
- **Message Types**: Handles text, media, stickers, and various WhatsApp message formats
- **Automation Features**: Auto-view messages/status, auto-react, auto-typing, and auto-recording capabilities

## Data Persistence
- **JSON File Storage**: Uses local JSON files for storing moderators, banned users, welcome configurations, and bot settings
- **Settings Management**: Persistent settings system with real-time updates and global accessibility
- **Session Management**: Maintains WhatsApp session state and authentication across restarts

## AI and External Services Integration
- **OpenAI Integration**: GPT-based conversational AI capabilities
- **Google Gemini**: Alternative AI service integration
- **Media Services**: Giphy for GIF search, Imgur for image hosting
- **Development Tools**: Copilot API integration for code-related features
- **Sports Data**: Football API for sports information

## Media Processing Pipeline
- **Image Processing**: Sharp and Jimp libraries for image manipulation and optimization
- **Video Processing**: FFmpeg integration for video/audio processing with fluent-ffmpeg wrapper
- **Audio Handling**: Support for various audio formats and voice message processing
- **Sticker Creation**: wa-sticker-formatter for creating WhatsApp stickers from images/videos

## Utility Services
- **Web Scraping**: Cheerio for HTML parsing and web data extraction
- **Code Execution**: compile-run for executing code snippets in various languages
- **Translation**: translatte library for multi-language support
- **Search**: google-it integration for web search capabilities
- **YouTube Integration**: yt-search and @distube/ytdl-core for YouTube content processing

## Security and Moderation
- **User Management**: Moderator and ban system with persistent storage
- **Rate Limiting**: BOOM_MESSAGE_LIMIT for spam prevention
- **Owner Controls**: Special privileges for bot owner with dedicated commands
- **Group Management**: Welcome messages, member management, and group-specific configurations

# External Dependencies

## Primary WhatsApp Integration
- **@whiskeysockets/baileys**: Core WhatsApp Web API library for bot connectivity
- **pino**: Logging framework for structured logging and debugging

## AI and Language Services
- **openai**: OpenAI GPT API integration for conversational AI
- **@google/generative-ai**: Google Gemini AI service integration
- **translatte**: Multi-language translation service

## Media Processing Stack
- **sharp**: High-performance image processing and optimization
- **jimp**: JavaScript image manipulation library
- **fluent-ffmpeg**: FFmpeg wrapper for video/audio processing
- **@ffmpeg-installer/ffmpeg**: FFmpeg binary installer
- **wa-sticker-formatter**: WhatsApp sticker creation utility

## Web and API Services
- **axios**: HTTP client for API requests and web scraping
- **cheerio**: Server-side jQuery implementation for HTML parsing
- **google-it**: Google search API wrapper
- **yt-search**: YouTube search functionality
- **@distube/ytdl-core**: YouTube video/audio downloading

## Database and Storage
- **mongoose**: MongoDB object modeling (available but may not be actively used)
- **connect-mongo**: MongoDB session store integration
- **fs-extra**: Enhanced file system operations

## Utility Libraries
- **moment-timezone**: Date/time manipulation with timezone support
- **uuid**: Unique identifier generation
- **compile-run**: Multi-language code execution environment
- **archiver**: File compression and archive creation
- **jsonwebtoken**: JWT token handling for authentication
- **nodemailer**: Email sending capabilities

## Development and Obfuscation
- **javascript-obfuscator**: Code obfuscation for security
- **mumaker**: Image generation and meme creation utilities

Note: The application includes MongoDB/Mongoose dependencies but may primarily rely on JSON file storage for simplicity and portability.