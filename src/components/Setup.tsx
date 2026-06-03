import { useState } from 'react';
import { Settings } from '../types';
import { KeyRound } from 'lucide-react';

interface Props {
  onSave: (s: Settings) => void;
}

export default function Setup({ onSave }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiKey: apiKey.trim(), apiToken: apiToken.trim(), username: username.trim() });
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="text-blue-400" size={22} />
          <h1 className="text-white text-lg font-semibold">Trello Notifications Setup</h1>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 mb-6 text-sm space-y-1.5">
          <p className="text-gray-300 font-medium">To get your credentials:</p>
          <ol className="text-gray-400 space-y-1 list-decimal list-inside">
            <li>
              Go to{' '}
              <a
                href="https://trello.com/app-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                trello.com/app-key
              </a>
            </li>
            <li>Copy your <span className="text-gray-200">API Key</span> from that page</li>
            <li>Click <span className="text-gray-200">"Generate a Token"</span> on the same page and copy the token</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-300 text-xs font-medium mb-1 uppercase tracking-wide">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-medium mb-1 uppercase tracking-wide">
              API Token
            </label>
            <input
              type="text"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-medium mb-1 uppercase tracking-wide">
              Your Trello Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourtrellousername"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">Optional — used to highlight @mentions</p>
          </div>

          <button
            type="submit"
            className="mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            Save & Connect
          </button>
        </form>
      </div>
    </div>
  );
}
