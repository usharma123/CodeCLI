# Quick Start Guide

Get your Next.js chatbot up and running in minutes!

## 🚀 Quick Setup

1. **Install dependencies:**
   ```bash
   cd nextjs-chatbot
   bun install
   ```

2. **Run the development server:**
   ```bash
   bun dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! Your chatbot is now running with mock responses.

## 🤖 Setting Up OpenRouter AI

The chatbot is already configured to use OpenRouter! Just add your API key:

1. **Get an OpenRouter API key:**
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Go to [Keys](https://openrouter.ai/keys) and create a new API key
   - Add credits to your account

2. **Add your key:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and add:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

3. **Restart the server:**
   ```bash
   bun dev
   ```

That's it! Your chatbot now has access to Claude, GPT-4, and many other AI models!

## 📝 What You Get

- ✅ Beautiful chat interface
- ✅ Responsive design (mobile & desktop)
- ✅ Typing indicators
- ✅ Smooth animations
- ✅ Message history
- ✅ Ready for AI integration

## 🎨 Customization Tips

### Change Colors
Edit `src/app/page.module.css` and look for:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modify Chat Behavior
Edit `src/app/api/chat/route.ts` to change responses

### Add Features
- Message persistence (localStorage)
- User authentication
- Multiple chat sessions
- File uploads
- Voice input

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)

## 🆘 Troubleshooting

**Port already in use?**
```bash
bun dev -- -p 3001
```

**Dependencies not installing?**
```bash
rm -rf node_modules
bun install
```

**Build errors?**
Make sure you're using Node.js 18+ or Bun

---

Happy chatting! 🎉
