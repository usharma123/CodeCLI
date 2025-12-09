# OpenRouter Integration Guide

This chatbot uses OpenRouter to access multiple AI models through a single API.

## Why OpenRouter?

- **Multiple Models**: Access Claude, GPT-4, Llama, Gemini, and more with one API key
- **Pay-as-you-go**: Only pay for what you use
- **No Subscriptions**: No monthly fees
- **Transparent Pricing**: See exact costs per model
- **Easy Switching**: Change models with one environment variable

## Setup

### 1. Create an OpenRouter Account

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up with your email or GitHub
3. Verify your email

### 2. Get Your API Key

1. Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Click "Create Key"
3. Give it a name (e.g., "Next.js Chatbot")
4. Copy the key (starts with `sk-or-v1-`)

### 3. Add Credits

1. Go to [openrouter.ai/credits](https://openrouter.ai/credits)
2. Add credits (minimum $5 recommended)
3. Credits never expire!

### 4. Configure Your Chatbot

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### 5. Start Chatting!

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

## Choosing a Model

### Default Model
The chatbot uses `anthropic/claude-3.5-sonnet` by default - it's fast, smart, and cost-effective.

### Change the Model

Add this to your `.env.local`:

```env
OPENROUTER_MODEL=your-preferred-model
```

### Recommended Models

#### Best Overall Performance
```env
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
- Excellent reasoning and coding
- Fast responses
- ~$3 per million input tokens

#### Most Capable
```env
OPENROUTER_MODEL=anthropic/claude-3-opus
```
- Best for complex tasks
- Highest quality responses
- ~$15 per million input tokens

#### Most Cost-Effective
```env
OPENROUTER_MODEL=openai/gpt-3.5-turbo
```
- Fast and cheap
- Good for simple tasks
- ~$0.50 per million input tokens

#### Best for Coding
```env
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
or
```env
OPENROUTER_MODEL=openai/gpt-4
```

#### Free Options
```env
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```
- Completely free!
- Rate limited
- Good for testing

### All Available Models

See the full list at [openrouter.ai/models](https://openrouter.ai/models)

Popular options:
- `anthropic/claude-3.5-sonnet` - Best overall
- `anthropic/claude-3-opus` - Most capable
- `anthropic/claude-3-haiku` - Fastest
- `openai/gpt-4` - OpenAI's best
- `openai/gpt-4-turbo` - Faster GPT-4
- `openai/gpt-3.5-turbo` - Most economical
- `meta-llama/llama-3.1-70b-instruct` - Open source
- `google/gemini-pro` - Google's model
- `mistralai/mistral-large` - European alternative

## Pricing

OpenRouter charges based on:
- **Input tokens**: Text you send to the model
- **Output tokens**: Text the model generates

### Example Costs (approximate)

**Claude 3.5 Sonnet:**
- Input: $3 per million tokens (~750,000 words)
- Output: $15 per million tokens

**GPT-3.5 Turbo:**
- Input: $0.50 per million tokens
- Output: $1.50 per million tokens

**GPT-4:**
- Input: $30 per million tokens
- Output: $60 per million tokens

### Real-World Usage

A typical conversation:
- 10 messages back and forth
- ~500 words total
- Cost: $0.01 - $0.05 depending on model

$5 in credits = hundreds of conversations!

## Monitoring Usage

1. Go to [openrouter.ai/activity](https://openrouter.ai/activity)
2. See all your API calls
3. Track spending per model
4. View detailed analytics

## Advanced Configuration

### Custom System Prompt

Edit `src/app/api/chat/route.ts`:

```typescript
const systemMessage: Message = {
  role: 'system',
  content: 'You are a helpful coding assistant specializing in JavaScript and React.'
}
```

### Adjust Temperature

In `src/app/api/chat/route.ts`, change:

```typescript
temperature: 0.7,  // 0 = focused, 1 = creative
```

### Increase Max Tokens

```typescript
max_tokens: 2000,  // Longer responses
```

### Add Site URL (for analytics)

In `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

## Troubleshooting

### "API key not configured" error
- Make sure `.env.local` exists
- Check the key starts with `sk-or-v1-`
- Restart the dev server after adding the key

### "Insufficient credits" error
- Add credits at [openrouter.ai/credits](https://openrouter.ai/credits)

### Slow responses
- Try a faster model like `claude-3-haiku` or `gpt-3.5-turbo`
- Check your internet connection

### Rate limit errors
- Free models have rate limits
- Upgrade to paid models for higher limits

## Security Best Practices

✅ **DO:**
- Keep your API key in `.env.local`
- Add `.env.local` to `.gitignore`
- Use environment variables in production

❌ **DON'T:**
- Commit API keys to Git
- Share your API key publicly
- Use the same key for multiple projects

## Support

- **OpenRouter Docs**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Discord**: [discord.gg/openrouter](https://discord.gg/openrouter)
- **Email**: support@openrouter.ai

---

Happy chatting! 🚀
