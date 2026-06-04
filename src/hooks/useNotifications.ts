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

function mergeNotifications(
  prev: FilteredNotification[],
  fresh: FilteredNotification[]
): FilteredNotification[] {
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

  // Refs so callbacks always see current values without stale closures
  const starsRef = useRef(stars);
  const starredDataRef = useRef(starredData);
  const prevLookbackRef = useRef(settings.lookback);

  useEffect(() => { starsRef.current = stars; }, [stars]);
  useEffect(() => { starredDataRef.current = starredData; }, [starredData]);

  const refresh = useCallback(async () => {
    if (!hasCredentials) return;

    const lookbackChanged = settings.lookback !== prevLookbackRef.current;
    prevLookbackRef.current = settings.lookback;

    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchNotifications(
        settings.apiKey,
        settings.apiToken,
        settings.lookback ?? 'unread'
      );

      // Mode changed → replace. Same mode → merge.
      if (lookbackChanged) {
        setNotifications(sortByDate(fresh));
      } else {
        setNotifications(prev => mergeNotifications(prev, fresh));
      }

      // Populate starredData for starred cards found in fresh results.
      // Compute outside an updater, save synchronously, then set state.
      const currentStars = starsRef.current;
      const currentData = starredDataRef.current;
      let changed = false;
      const nextData = new Map(currentData);
      for (const n of fresh) {
        const cardId = n.data.card?.id;
        if (cardId && currentStars.has(cardId)) {
          nextData.set(cardId, n);
          changed = true;
        }
      }
      if (changed) {
        saveStarredData(nextData);
        setStarredData(nextData);
      }
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
    // Read current values from refs — no stale closure, no state updater side effects
    const currentlyStarred = starsRef.current.has(cardId);
    const newStars = new Set(starsRef.current);
    const newData = new Map(starredDataRef.current);

    if (currentlyStarred) {
      newStars.delete(cardId);
      newData.delete(cardId);
    } else {
      newStars.add(cardId);
      if (notification) newData.set(cardId, notification);
    }

    // Save to localStorage synchronously before any React re-render
    saveStars(newStars);
    saveStarredData(newData);

    // Update React state (no updater functions — values already computed)
    setStars(newStars);
    setStarredData(newData);
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
      const ids = notifications
        .filter(n => n.data.board?.id === boardId)
        .map(n => n.id);
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
