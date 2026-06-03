import { Star, Layout } from 'lucide-react';
import { BoardFilter } from '../types';

interface BoardEntry {
  id: string;
  name: string;
  count: number;
}

interface Props {
  boards: BoardEntry[];
  starredCount: number;
  selected: BoardFilter | null;
  onSelect: (f: BoardFilter) => void;
}

export default function BoardList({ boards, starredCount, selected, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-800" style={{ width: 220, minWidth: 220 }}>
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Boards</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Starred */}
        {starredCount > 0 && (
          <button
            onClick={() => onSelect('__starred__')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
              selected === '__starred__'
                ? 'bg-blue-600/20 border-l-2 border-blue-500 text-white'
                : 'text-gray-300 hover:bg-gray-800 border-l-2 border-transparent'
            }`}
          >
            <Star size={14} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
            <span className="flex-1 truncate">Starred</span>
            <span className="text-xs bg-yellow-900/60 text-yellow-300 rounded px-1.5 py-0.5 font-mono">
              {starredCount}
            </span>
          </button>
        )}

        {/* Boards */}
        {boards.length === 0 && starredCount === 0 && (
          <div className="px-3 py-4 text-gray-600 text-xs">No unread notifications</div>
        )}
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
              selected === b.id
                ? 'bg-blue-600/20 border-l-2 border-blue-500 text-white'
                : 'text-gray-300 hover:bg-gray-800 border-l-2 border-transparent'
            }`}
          >
            <Layout size={14} className="text-gray-500 flex-shrink-0" />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-xs bg-gray-800 text-gray-400 rounded px-1.5 py-0.5 font-mono">
              {b.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
