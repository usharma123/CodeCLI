import { TokenStats } from '@/lib/types';

interface StatsDisplayProps {
  stats: TokenStats;
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Characters</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.characterCount.toLocaleString()}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Words</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.wordCount.toLocaleString()}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tokens</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {stats.tokenCount.toLocaleString()}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Chars/Token</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.charsPerToken.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
