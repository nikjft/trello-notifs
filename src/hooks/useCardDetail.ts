import { useState, useEffect } from 'react';
import { CardDetail, Settings } from '../types';
import { fetchCardDetail } from '../api';

export function useCardDetail(cardId: string | null | undefined, settings: Settings) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cardId || !settings.apiKey || !settings.apiToken) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetchCardDetail(cardId, settings.apiKey, settings.apiToken)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cardId, settings.apiKey, settings.apiToken]);

  return { detail, loading };
}
