import { useState, useCallback, useEffect } from 'react';
import { FilteredNotification, Settings } from '../types';
import { fetchNotifications, markNotificationRead, markAllBoardNotificationsRead } from '../api';

const STARS_KEY = 'trello-notifs-stars';

function loadStars(): Set<string> {
  try {
    const raw = localStorage.getItem(STARS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveStars(stars: Set<string>) {
  localStorage.setItem(STARS_KEY, JSON.stringify(Array.from(stars)));
}

export function useNotifications(settings: Settings, hasCredentials: boolean) {
  const [notifications, setNotifications] = useState<FilteredNotification[]>([]);
  const [stars, setStars] = useState<Set<string>>(loadStars);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasCredentials) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(settings.apiKey, settings.apiToken);
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.apiKey, settings.apiToken, hasCredentials]);

  useEffect(() => {
    if (hasCredentials) refresh();
  }, [refresh, hasCredentials]);

  // Stars are keyed by cardId, not notification ID
  const toggleStar = useCallback((cardId: string) => {
    setStars((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      saveStars(next);
      return next;
    });
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id, settings.apiKey, settings.apiToken);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [settings.apiKey, settings.apiToken]
  );

  const markBoardRead = useCallback(
    async (boardId: string) => {
      const ids = notifications
        .filter((n) => n.data.board?.id === boardId)
        .map((n) => n.id);
      await markAllBoardNotificationsRead(ids, settings.apiKey, settings.apiToken);
      setNotifications((prev) => prev.filter((n) => n.data.board?.id !== boardId));
    },
    [notifications, settings.apiKey, settings.apiToken]
  );

  // Group by board
  const boardCounts = notifications.reduce<Record<string, { name: string; count: number }>>(
    (acc, n) => {
      const bid = n.data.board?.id;
      const bname = n.data.board?.name;
      if (bid && bname) {
        if (!acc[bid]) acc[bid] = { name: bname, count: 0 };
        acc[bid].count++;
      }
      return acc;
    },
    {}
  );

  // Count unique starred cards that still have notifications
  const starredCardIds = new Set(notifications.map((n) => n.data.card?.id).filter(Boolean));
  const starredCount = [...stars].filter((cardId) => starredCardIds.has(cardId)).length;

  return {
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
  };
}
