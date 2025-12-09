# Complete Setup Guide

Follow these steps to get your Next.js chatbot running with OpenRouter AI.

## Prerequisites

- **Node.js 18+** or **Bun** installed
- A text editor (VS Code recommended)
- An OpenRouter account (free to create)

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd nextjs-chatbot
bun install
```

Or with npm:
```bash
npm install
```

### Step 2: Get Your OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai) and sign up
2. Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
3. Click "Create Key" and copy it
4. Add credits at [openrouter.ai/credits](https://openrouter.ai/credits) (minimum $5)

### Step 3: Configure Environment Variables

Create your environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### Step 4: Start the Development Server

```bash
bun dev
```

Or with npm:
```bash
npm run dev
```

### Step 5: Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

**That's it!** Start chatting with your AI assistant! 🎉

## Customization Options

### Change the AI Model

Edit `.env.local`:

```env
# Use GPT-4 instead
OPENROUTER_MODEL=openai/gpt-4

# Or use a free model for testing
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

See [OPENROUTER.md](OPENROUTER.md) for all available models.

### Customize the System Prompt

Edit `src/app/api/chat/route.ts`:

```typescript
const systemMessage: Message = {
  role: 'system',
  content: 'Your custom instructions here...'
}
```

### Change the UI Colors

Edit `src/app/page.module.css`:

```css
/* Change the gradient colors */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modify the Welcome Message

Edit `src/app/page.tsx`:

```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    role: 'assistant',
    content: 'Your custom welcome message here!'
  }
])
```

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` (optional)
5. Deploy!

### Deploy to Other Platforms

Build the production version:

```bash
bun run build
```

Start the production server:

```bash
bun start
```

## Testing Without API Key

If you want to test the UI without setting up OpenRouter:

```bash
cd src/app/api/chat
mv route.ts route.openrouter.ts
mv route.mock.example.ts route.ts
```

This will use mock responses instead of real AI.

## Troubleshooting

### Server won't start
- Make sure you ran `bun install` or `npm install`
- Check that you're in the `nextjs-chatbot` directory
- Try deleting `node_modules` and `.next` folders, then reinstall

### "API key not configured" error
- Make sure `.env.local` exists in the project root
- Check that your API key is correct
- Restart the dev server after adding the key

### Slow responses
- Try a faster model like `gpt-3.5-turbo` or `claude-3-haiku`
- Check your internet connection
- Verify you have credits in your OpenRouter account

### Build errors
- Make sure you're using Node.js 18 or higher
- Clear the `.next` folder: `rm -rf .next`
- Try `bun run build` again

## Project Structure

```
nextjs-chatbot/
├── src/app/
│   ├── api/chat/route.ts          # OpenRouter API integration
│   ├── page.tsx                   # Chat UI
│   ├── layout.tsx                 # App layout
│   ├── globals.css                # Global styles
│   └── page.module.css            # Chat-specific styles
├── public/                        # Static files
├── .env.local                     # Your API keys (create this)
├── .env.local.example             # Environment template
├── package.json                   # Dependencies
├── next.config.js                 # Next.js config
└── tsconfig.json                  # TypeScript config
```

## Next Steps

- ✅ Read [OPENROUTER.md](OPENROUTER.md) for model selection guide
- ✅ Check [FEATURES.md](FEATURES.md) for architecture details
- ✅ Customize the UI to match your brand
- ✅ Add features like message persistence, user auth, etc.

## Getting Help

- **OpenRouter Issues**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Next.js Issues**: [nextjs.org/docs](https://nextjs.org/docs)
- **General Questions**: Check the documentation files in this project

---

Enjoy your new AI chatbot! 🚀
