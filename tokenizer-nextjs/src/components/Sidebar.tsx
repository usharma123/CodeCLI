export default function Sidebar() {
  return (
    <aside className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ℹ️ About</h2>
      
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p>
          This application calculates the number of tokens in your text using OpenAI&apos;s tiktoken library.
        </p>

        <div>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Encoding Models:</h3>
          <ul className="space-y-2 ml-4">
            <li>
              <strong className="text-blue-600 dark:text-blue-400">cl100k_base:</strong> Used by GPT-4, GPT-3.5-turbo, and text-embedding-ada-002
            </li>
            <li>
              <strong className="text-blue-600 dark:text-blue-400">p50k_base:</strong> Used by Codex models and text-davinci-002/003
            </li>
            <li>
              <strong className="text-blue-600 dark:text-blue-400">r50k_base:</strong> Used by GPT-3 models (davinci, curie, babbage, ada)
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Why Token Count Matters:</h3>
          <ul className="list-disc ml-4 space-y-1">
            <li>API costs are based on token usage</li>
            <li>Models have maximum token limits</li>
            <li>Understanding tokenization helps optimize prompts</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
