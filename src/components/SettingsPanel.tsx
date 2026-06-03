import { useState } from 'react';
import { X } from 'lucide-react';
import { Settings } from '../types';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [apiToken, setApiToken] = useState(settings.apiToken);
  const [username, setUsername] = useState(settings.username);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiKey: apiKey.trim(), apiToken: apiToken.trim(), username: username.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
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
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
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
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
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
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
