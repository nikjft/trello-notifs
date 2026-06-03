import { Star, Archive } from 'lucide-react';
import { FilteredNotification, BoardFilter } from '../types';
import { formatDistanceToNow } from '../utils';

interface Props {
  notifications: FilteredNotification[];
  stars: Set<string>;
  selectedCardId: string | null;
  viewedCards: Set<string>;
  boardFilter: BoardFilter | null;
  onSelect: (cardId: string) => void;
  onToggleStar: (cardId: string) => void;
  onMarkBoardRead: (boardId: string) => void;
}

function cleanCardName(name: string): string {
  return name
    .replace(/^\(\d+\)\s*/, '')
    .replace(/\s*[\[{]\d+[\]}]\s*$/, '')
    .trim();
}

export default function CardList({
  notifications,
  stars,
  selectedCardId,
  viewedCards,
  boardFilter,
  onSelect,
  onToggleStar,
  onMarkBoardRead,
}: Props) {
  const boardName =
    boardFilter && boardFilter !== '__starred__'
      ? notifications.find((n) => n.data.board?.id === boardFilter)?.data.board?.name
      : null;

  // Deduplicate by card — one row per card, latest notification first
  const cardMap = new Map<string, { cardId: string; name: string; latest: FilteredNotification; types: Set<string> }>();
  for (const n of notifications) {
    const cardId = n.data.card?.id;
    if (!cardId) continue;
    const existing = cardMap.get(cardId);
    if (!existing) {
      cardMap.set(cardId, { cardId, name: n.data.card?.name ?? '', latest: n, types: new Set([n.type]) });
    } else {
      existing.types.add(n.type);
      if (n.date > existing.latest.date) existing.latest = n;
    }
  }
  const cards = [...cardMap.values()];

  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-800" style={{ width: 280, minWidth: 280 }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between gap-2">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest truncate">
          {boardFilter === '__starred__' ? 'Starred' : boardName ?? 'Cards'}
        </span>
        {boardFilter && boardFilter !== '__starred__' && cards.length > 0 && (
          <button
            onClick={() => onMarkBoardRead(boardFilter)}
            title="Archive all"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <Archive size={13} />
            <span>Archive all</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {cards.length === 0 && (
          <div className="px-3 py-4 text-gray-400 text-xs">No notifications</div>
        )}
        {cards.map(({ cardId, name, latest, types }) => {
          const isStarred = stars.has(cardId);
          const isSelected = selectedCardId === cardId;
          const isViewed = viewedCards.has(cardId);
          return (
            <div
              key={cardId}
              onClick={() => onSelect(cardId)}
              className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-800/50 ${
                isSelected
                  ? 'bg-blue-600/20 border-l-2 border-l-blue-500'
                  : 'hover:bg-gray-800/60 border-l-2 border-l-transparent'
              }`}
            >
              {/* Unread / viewed dot */}
              <div className="mt-1.5 flex-shrink-0">
                {isViewed
                  ? <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <span className={`text-sm leading-snug line-clamp-2 ${isViewed ? 'text-gray-500 font-normal' : 'text-gray-200 font-medium'}`}>
                    {cleanCardName(name)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStar(cardId); }}
                    className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    <Star
                      size={13}
                      className={isStarred ? 'text-yellow-400' : ''}
                      fill={isStarred ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {types.has('addedToCard') && (
                    <span className="text-xs bg-green-900/60 text-green-300 px-1.5 py-0.5 rounded">Assigned</span>
                  )}
                  {types.has('mentionedOnCard') && (
                    <span className="text-xs bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">Mentioned</span>
                  )}
                  <span className="text-gray-400 text-xs">{formatDistanceToNow(latest.date)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
