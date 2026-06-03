import { useState } from 'react';
import { RefreshCw, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useNotifications } from './hooks/useNotifications';
import Setup from './components/Setup';
import SettingsPanel from './components/SettingsPanel';
import BoardList from './components/BoardList';
import CardList from './components/CardList';
import NotificationDetail from './components/NotificationDetail';
import { BoardFilter, FilteredNotification, Lookback } from './types';

const LOOKBACK_OPTIONS: { value: Lookback; label: string }[] = [
  { value: 'unread', label: 'Unread Only' },
  { value: '7d',     label: '7 Days' },
  { value: '14d',    label: '14 Days' },
  { value: '30d',    label: '30 Days' },
];

export default function App() {
  const { settings, saveSettings, hasCredentials } = useSettings();
  const {
    notifications,
    stars,
    loading,
    error,
    refresh,
    toggleStar,
    markRead,
    markBoardRead,
    boardCounts,
    starredCount,
  } = useNotifications(settings, hasCredentials);

  const [showSettings, setShowSettings] = useState(false);
  const [boardFilter, setBoardFilter] = useState<BoardFilter | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setViewedCards((prev) => new Set(prev).add(cardId));
  };

  if (!hasCredentials) {
    return <Setup onSave={saveSettings} />;
  }

  // Filter notifications for pane 2
  let pane2Notifications: FilteredNotification[];
  if (boardFilter === '__starred__') {
    pane2Notifications = notifications.filter((n) => stars.has(n.data.card?.id ?? ''));
  } else if (boardFilter) {
    pane2Notifications = notifications.filter((n) => n.data.board?.id === boardFilter);
  } else {
    pane2Notifications = notifications;
  }

  // All notifications for the selected card
  const cardNotifications = selectedCardId
    ? notifications.filter((n) => n.data.card?.id === selectedCardId)
    : [];

  const boards = Object.entries(boardCounts).map(([id, { name, count }]) => ({
    id,
    name,
    count,
  }));

  const handleMarkCardRead = async (ids: string[]) => {
    await Promise.all(ids.map(markRead));
    if (selectedCardId) {
      setViewedCards((prev) => { const next = new Set(prev); next.delete(selectedCardId); return next; });
    }
    setSelectedCardId(null);
  };

  const handleMarkBoardRead = async (boardId: string) => {
    await markBoardRead(boardId);
    if (boardFilter === boardId) setBoardFilter(null);
    setSelectedCardId(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Trello Notifications</span>
          {notifications.length > 0 && (
            <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 font-mono">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle size={13} />
              {error}
            </span>
          )}
          <select
            value={settings.lookback ?? 'unread'}
            onChange={(e) => saveSettings({ ...settings, lookback: e.target.value as Lookback })}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {LOOKBACK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={refresh}
            disabled={loading}
            title="Refresh"
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Loading bar */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 border-b border-gray-800 text-gray-500 text-xs">
          <Loader2 size={12} className="animate-spin" />
          Fetching notifications…
        </div>
      )}

      {/* 3-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        <BoardList
          boards={boards}
          starredCount={starredCount}
          selected={boardFilter}
          onSelect={(f) => {
            setBoardFilter(f);
            setSelectedCardId(null);
          }}
        />
        <CardList
          notifications={pane2Notifications}
          stars={stars}
          selectedCardId={selectedCardId}
          viewedCards={viewedCards}
          allViewed={settings.lookback !== 'unread'}
          boardFilter={boardFilter}
          onSelect={handleSelectCard}
          onToggleStar={toggleStar}
          onMarkBoardRead={handleMarkBoardRead}
        />
        <NotificationDetail
          notifications={cardNotifications}
          cardId={selectedCardId}
          isStarred={selectedCardId ? stars.has(selectedCardId) : false}
          onMarkCardRead={handleMarkCardRead}
          onToggleStar={toggleStar}
          settings={settings}
        />
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
