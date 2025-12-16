# Token Counter - Next.js Application

A modern, interactive Next.js application that calculates and visualizes the number of tokens in text using OpenAI's tiktoken library.

![Token Counter](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🔢 **Real-time Token Counting** - Automatically calculates tokens as you type
- 🎨 **Visual Tokenization** - Color-coded token display with hover tooltips
- 📊 **Detailed Statistics** - Character count, word count, tokens, and chars-per-token ratio
- 🎯 **Multiple Encoding Models** - Support for cl100k_base, p50k_base, and r50k_base
- 🔍 **Token Breakdown** - View detailed token IDs and decoded values
- ✅ **Verification** - Ensures concatenated tokens match original input
- 🌓 **Dark Mode** - Automatic dark mode support
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd tokenizer-nextjs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Building for Production

```bash
npm run build
npm start
```

This will create an optimized production build and start the server.

## 🏗️ Project Structure

```
tokenizer-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tokenize/
│   │   │       └── route.ts          # API endpoint for tokenization
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main page component
│   ├── components/
│   │   ├── Sidebar.tsx               # Information sidebar
│   │   ├── StatsDisplay.tsx          # Statistics cards
│   │   ├── TokenDetails.tsx          # Expandable token details
│   │   └── TokenVisualizer.tsx       # Visual token display
│   └── lib/
│       └── types.ts                  # TypeScript type definitions
├── public/                           # Static assets
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Project dependencies
```

## 🎯 Usage

1. **Select an encoding model** from the dropdown (default: cl100k_base for GPT-4/GPT-3.5-turbo)
2. **Enter or paste your text** in the text area
3. **View results automatically** including:
   - Total token count
   - Character, word, and token statistics
   - Visual tokenization with color-coded tokens
   - Detailed token breakdown with IDs

## 🔧 Encoding Models

- **cl100k_base**: Used by GPT-4, GPT-3.5-turbo, and text-embedding-ada-002
- **p50k_base**: Used by Codex models and text-davinci-002/003
- **r50k_base**: Used by GPT-3 models (davinci, curie, babbage, ada)

## 💡 Why Token Count Matters

- **API Costs**: OpenAI and other LLM providers charge based on token usage
- **Token Limits**: Models have maximum token limits for input and output
- **Prompt Optimization**: Understanding tokenization helps create more efficient prompts
- **Cost Management**: Knowing token counts helps estimate and control API costs

## 🛠️ Technologies Used

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[tiktoken](https://github.com/openai/tiktoken)** - OpenAI's tokenization library
- **[React](https://react.dev/)** - UI library

## 📝 API Reference

### POST `/api/tokenize`

Tokenizes the provided text using the specified encoding.

**Request Body:**
```json
{
  "text": "Your text here",
  "encoding": "cl100k_base"
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "tokenCount": 10,
    "characterCount": 50,
    "wordCount": 8,
    "charsPerToken": 5.0
  },
  "tokens": [
    {
      "id": 9906,
      "position": 1,
      "text": "Your"
    }
  ],
  "tokenIds": [9906, 1495, 1618]
}
```

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Tokenization powered by [tiktoken](https://github.com/openai/tiktoken)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📧 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

**Migrated from Streamlit to Next.js** - Enjoy a faster, more interactive experience! 🚀
