# Token Counter Streamlit Application

A simple Streamlit application that calculates the number of tokens in a given string using OpenAI's tiktoken library.

## Features

- 🔢 Calculate token count for any text input
- 🎯 Support for multiple encoding models (cl100k_base, p50k_base, r50k_base)
- 📊 Display character, word, and token statistics
- 🔍 View detailed token IDs and decoded tokens
- 📈 Calculate characters-per-token ratio

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install streamlit tiktoken
```

## Running the Application

From the `tests/python/tokenizer` directory, run:

```bash
streamlit run token_counter_app.py
```

The application will open in your default web browser at `http://localhost:8501`

## Usage

1. Select an encoding model from the dropdown (default: cl100k_base for GPT-4/GPT-3.5-turbo)
2. Enter or paste your text in the text area
3. Click "Calculate Tokens" to see the results
4. View detailed statistics including:
   - Total token count
   - Character count
   - Word count
   - Token IDs and decoded tokens

## Encoding Models

- **cl100k_base**: Used by GPT-4, GPT-3.5-turbo, and text-embedding-ada-002
- **p50k_base**: Used by Codex models and text-davinci-002/003
- **r50k_base**: Used by GPT-3 models (davinci, curie, babbage, ada)

## Why Token Count Matters

- API costs are calculated based on token usage
- Language models have maximum token limits for input and output
- Understanding tokenization helps optimize prompts and manage costs
