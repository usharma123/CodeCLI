import { TokenData } from '@/lib/types';

interface TokenVisualizerProps {
  tokens: TokenData[];
  originalText: string;
}

const TOKEN_COLORS = [
  'bg-red-100 border-red-300',
  'bg-blue-100 border-blue-300',
  'bg-yellow-100 border-yellow-300',
  'bg-green-100 border-green-300',
  'bg-purple-100 border-purple-300',
  'bg-pink-100 border-pink-300',
];

export default function TokenVisualizer({ tokens, originalText }: TokenVisualizerProps) {
  // Verify reconstruction
  const reconstructed = tokens.map(t => String(t.text || '')).join('');
  const isValid = reconstructed === originalText;

  const formatText = (text: string) => {
    // Ensure text is a string
    const safeText = String(text || '');
    return safeText
      .replace(/\n/g, '↵\n')
      .replace(/\t/g, '→')
      .replace(/ /g, '\u00A0'); // Non-breaking space
  };

  return (
    <div className="my-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
        📝 Visual Tokenization
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Each token is highlighted with alternating colors. Notice how words can be split into multiple tokens.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-700 overflow-x-auto">
        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
          {tokens.map((token, index) => {
            const colorClass = TOKEN_COLORS[index % TOKEN_COLORS.length];
            const safeText = String(token.text || '');
            return (
              <span
                key={index}
                className={`${colorClass} border-r-2 px-0.5 inline-block relative group cursor-help`}
                title={`Token ${token.position}, ID: ${token.id}`}
              >
                {formatText(safeText)}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  Token {token.position} • ID: {token.id}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
        <strong>Legend:</strong> Spaces are preserved as-is, ↵ = newline, → = tab
        <br />
        Hover over each token to see its ID and position. Tokens are separated by vertical lines.
      </div>

      {isValid ? (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-400">
          ✅ Verification: Concatenated tokens exactly match the original input!
        </div>
      ) : (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
          ❌ Warning: Concatenated tokens do not match the original input!
          <br />
          Original length: {originalText.length}, Reconstructed length: {reconstructed.length}
        </div>
      )}
    </div>
  );
}
