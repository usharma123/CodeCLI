'use client';

import { useState } from 'react';
import StatsDisplay from '@/components/StatsDisplay';
import TokenVisualizer from '@/components/TokenVisualizer';
import TokenDetails from '@/components/TokenDetails';
import Sidebar from '@/components/Sidebar';
import { EncodingType, TokenizeResponse } from '@/lib/types';

const EXAMPLE_TEXT = "Hello world! This is a demonstration of tokenization. Notice how 'tokenization' splits into 'token' and 'ization'.";

export default function Home() {
  const [text, setText] = useState('');
  const [encoding, setEncoding] = useState<EncodingType>('cl100k_base');
  const [result, setResult] = useState<TokenizeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenize = async (inputText: string) => {
    if (!inputText.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tokenize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          encoding,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to tokenize text');
      }

      // Validate and ensure data structure is correct
      if (data && data.tokens && Array.isArray(data.tokens) && Array.isArray(data.tokenIds)) {
        setResult(data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    handleTokenize(newText);
  };

  const loadExample = () => {
    setText(EXAMPLE_TEXT);
    handleTokenize(EXAMPLE_TEXT);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 text-gray-900 dark:text-white">
            🔢 Token Counter
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Enter text below to calculate the number of tokens using different encoding models.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="encoding" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select encoding model:
                  </label>
                  <select
                    id="encoding"
                    value={encoding}
                    onChange={(e) => {
                      setEncoding(e.target.value as EncodingType);
                      if (text) handleTokenize(text);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cl100k_base">cl100k_base (GPT-4, GPT-3.5-turbo)</option>
                    <option value="p50k_base">p50k_base (Codex)</option>
                    <option value="r50k_base">r50k_base (GPT-3)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    cl100k_base is used by GPT-4 and GPT-3.5-turbo
                  </p>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={loadExample}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Load Example
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your text:
                </label>
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Type or paste your text here..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-y"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Tokenizing...</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && result && (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-700 dark:text-green-400 text-lg font-semibold">
                    Token Count: {result.stats.tokenCount.toLocaleString()}
                  </p>
                </div>

                <StatsDisplay stats={result.stats} />
                <TokenVisualizer tokens={result.tokens} originalText={text} />
                <TokenDetails tokens={result.tokens} tokenIds={result.tokenIds} />
              </>
            )}

            {/* Empty State */}
            {!isLoading && !result && !error && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
                <p className="text-blue-700 dark:text-blue-400 text-lg">
                  👆 Enter some text above to see the tokenization
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>
    </main>
  );
}
