import { TokenData } from '@/lib/types';
import { useState } from 'react';

interface TokenDetailsProps {
  tokens: TokenData[];
  tokenIds: number[];
}

export default function TokenDetails({ tokens, tokenIds }: TokenDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayLimit = 50;
  const hasMore = tokens.length > displayLimit;

  return (
    <div className="my-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          View Detailed Token Information
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Token IDs:</h3>
            <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm font-mono">
                [{tokenIds.slice(0, displayLimit).join(', ')}
                {hasMore && '...'}]
              </code>
            </div>
            {hasMore && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing first {displayLimit} tokens out of {tokens.length} total tokens
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
              Token Breakdown {hasMore && `(first ${displayLimit}):`}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Position
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Token
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Length
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tokens.slice(0, displayLimit).map((token, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {token.position}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {JSON.stringify(String(token.text || ''))}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {token.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {String(token.text || '').length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing first {displayLimit} tokens out of {tokens.length} total tokens
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
