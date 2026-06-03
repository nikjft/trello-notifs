import { useState, useCallback } from 'react';
import { Settings } from '../types';

const STORAGE_KEY = 'trello-notifs-settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {}
  return { apiKey: '', apiToken: '', username: '' };
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  const saveSettings = useCallback((updated: Settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSettingsState(updated);
  }, []);

  const hasCredentials =
    settings.apiKey.trim() !== '' && settings.apiToken.trim() !== '';

  return { settings, saveSettings, hasCredentials };
}
