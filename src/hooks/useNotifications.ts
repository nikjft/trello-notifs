import { useState, useCallback, useEffect, useRef } from 'react';
import { FilteredNotification, Settings } from '../types';
import { fetchNotifications, markNotificationRead, markAllBoardNotificationsRead } from '../api';

const STARS_KEY = 'trello-notifs-stars';
const STARRED_DATA_KEY = 'trello-notifs-starred-data';

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

function loadStarredData(): Map<string, FilteredNotification> {
  try {
    const raw = localStorage.getItem(STARRED_DATA_KEY);
    if (raw) return new Map(JSON.parse(raw) as [string, FilteredNotification][]);
  } catch {}
  return new Map();
}
function saveStarredData(data: Map<string, FilteredNotification>) {
  localStorage.setItem(STARRED_DATA_KEY, JSON.stringify(Array.from(data.entries())));
}

function sortByDate(list: FilteredNotification[]): FilteredNotification[] {
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function mergeNotifications(prev: FilteredNotification[], fresh: FilteredNotification[]): FilteredNotification[] {
  const map = new Map(prev.map(n => [n.id, n]));
  for (const n of fresh) map.set(n.id, n);
  return sortByDate(Array.from(map.values()));
}

export function useNotifications(settings: Settings, hasCredentials: boolean) {
  const [notifications, setNotifications] = useState<FilteredNotification[]>([]);
  const [stars, setStars] = useState<Set<string>>(loadStars);
  const [starredData, setStarredData] = useState<Map<string, FilteredNotification>>(loadStarredData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous lookback to detect mode changes
  const prevLookbackRef = useRef(settings.lookback);
  // Always-fresh ref to stars so refresh closure can read current value
  const starsRef = useRef(stars);
  useEffect(() => { starsRef.current = stars; }, [stars]);

  const refresh = useCallback(async () => {
    if (!hasCredentials) return;

    const lookbackChanged = settings.lookback !== prevLookbackRef.current;
    prevLookbackRef.current = settings.lookback;

    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchNotifications(settings.apiKey, settings.apiToken, settings.lookback ?? 'unread');
      const currentStars = starsRef.current;

      // Mode changed → full replace. Same mode → merge (keep viewed items in view).
      if (lookbackChanged) {
        setNotifications(sortByDate(fresh));
      } else {
        setNotifications(prev => mergeNotifications(prev, fresh));
      }

      // Populate starredData for any starred card found in fresh results
      // (covers migration: cards starred before starredData existed)
      setStarredData(prev => {
        const next = new Map(prev);
        let changed = false;
        for (const n of fresh) {
          const cardId = n.data.card?.id;
          if (cardId && currentStars.has(cardId)) {
            next.set(cardId, n);
            changed = true;
          }
        }
        if (changed) saveStarredData(next);
        return changed ? next : prev;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.apiKey, settings.apiToken, settings.lookback, hasCredentials]);

  useEffect(() => {
    if (hasCredentials) refresh();
  }, [refresh, hasCredentials]);

  const toggleStar = useCallback((cardId: string, notification?: FilteredNotification) => {
    setStars(prev => {
      const next = new Set(prev);
      setStarredData(prevData => {
        const nextData = new Map(prevData);
        if (next.has(cardId)) {
          next.delete(cardId);
          nextData.delete(cardId);
        } else {
          next.add(cardId);
          if (notification) nextData.set(cardId, notification);
        }
        saveStarredData(nextData);
        return nextData;
      });
      saveStars(next);
      return next;
    });
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id, settings.apiKey, settings.apiToken);
      setNotifications(prev => prev.filter(n => n.id !== id));
    },
    [settings.apiKey, settings.apiToken]
  );

  const markBoardRead = useCallback(
    async (boardId: string) => {
      const ids = notifications.filter(n => n.data.board?.id === boardId).map(n => n.id);
      await markAllBoardNotificationsRead(ids, settings.apiKey, settings.apiToken);
      setNotifications(prev => prev.filter(n => n.data.board?.id !== boardId));
    },
    [notifications, settings.apiKey, settings.apiToken]
  );

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

  const starredCount = stars.size;

  return {
    notifications,
    stars,
    starredData,
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
