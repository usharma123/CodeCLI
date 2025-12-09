# Next.js Chatbot with OpenRouter

A modern, responsive chatbot application built with Next.js 14, React, TypeScript, and OpenRouter AI.

## Features

- 💬 Real-time chat interface
- 🎨 Beautiful gradient UI with smooth animations
- 📱 Responsive design
- ⚡ Fast and efficient with Next.js
- 🤖 **OpenRouter Integration** - Access Claude, GPT-4, Llama, and 100+ AI models
- 🔄 Easy model switching with environment variables
- 💰 Pay-as-you-go pricing (no subscriptions)

## Quick Start

### 1. Install Dependencies

```bash
cd nextjs-chatbot
bun install
```

### 2. Get OpenRouter API Key

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)
3. Add credits at [openrouter.ai/credits](https://openrouter.ai/credits)

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 4. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

📖 **Detailed setup guide**: See [SETUP.md](SETUP.md)

### Build for Production

```bash
# Build the application
bun run build
# or
npm run build

# Start production server
bun start
# or
npm start
```

## Project Structure

```
nextjs-chatbot/
├── src/
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts      # Chat API endpoint
│       ├── layout.tsx             # Root layout
│       ├── page.tsx               # Main chat page
│       ├── page.module.css        # Chat styles
│       └── globals.css            # Global styles
├── package.json
├── next.config.js
└── tsconfig.json
```

## AI Integration with OpenRouter

This chatbot uses **OpenRouter** to access multiple AI models through a single API. OpenRouter provides access to:
- Anthropic Claude (3.5 Sonnet, Opus, Haiku)
- OpenAI GPT (GPT-4, GPT-3.5)
- Meta Llama models
- Google Gemini
- And many more!

### Setup Instructions

1. **Get an OpenRouter API Key:**
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Go to [Keys](https://openrouter.ai/keys) and create a new API key
   - Add credits to your account

2. **Configure your environment:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Add your API key to `.env.local`:**
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

4. **Optional: Choose a different model:**
   ```env
   OPENROUTER_MODEL=openai/gpt-4
   ```

5. **Start the development server:**
   ```bash
   bun dev
   ```

### Available Models

You can change the model by setting `OPENROUTER_MODEL` in `.env.local`:

- `anthropic/claude-3.5-sonnet` (default) - Best overall performance
- `openai/gpt-4` - OpenAI's most capable model
- `openai/gpt-3.5-turbo` - Fast and cost-effective
- `meta-llama/llama-3.1-70b-instruct` - Open source alternative
- `google/gemini-pro` - Google's AI model

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

### Pricing

OpenRouter charges based on the model you use. Check current pricing at [openrouter.ai/models](https://openrouter.ai/models).

## Customization

### Styling

- Edit `src/app/page.module.css` to customize the chat interface
- Edit `src/app/globals.css` for global styles
- The current theme uses a purple gradient, but you can easily change colors

### Chat Logic

- The chat API is in `src/app/api/chat/route.ts`
- Currently uses mock responses - replace with your preferred AI service
- Add conversation history, context, or system prompts as needed

## Technologies Used

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling
- **OpenRouter** - Multi-model AI API

## Documentation

- **[README.md](README.md)** - This file (overview and setup)
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 2 minutes
- **[OPENROUTER.md](OPENROUTER.md)** - Complete OpenRouter guide
- **[FEATURES.md](FEATURES.md)** - Architecture and features

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
