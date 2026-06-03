import { TrelloNotification, FilteredNotification, CardDetail, CardComment } from './types';

const BASE = 'https://api.trello.com/1';

export async function fetchNotifications(
  apiKey: string,
  apiToken: string,
  lookback: import('./types').Lookback = 'unread'
): Promise<FilteredNotification[]> {
  const days = lookback === '7d' ? 7 : lookback === '14d' ? 14 : lookback === '30d' ? 30 : null;
  const since = days
    ? new Date(Date.now() - days * 86400 * 1000).toISOString()
    : null;

  const params = since
    ? `read_filter=all&limit=1000&since=${encodeURIComponent(since)}`
    : `read_filter=unread&limit=200`;

  const [notifsRes, meRes] = await Promise.all([
    fetch(`${BASE}/members/me/notifications?${params}&key=${apiKey}&token=${apiToken}`),
    fetch(`${BASE}/members/me?fields=id&key=${apiKey}&token=${apiToken}`),
  ]);
  if (!notifsRes.ok) throw new Error(`Trello API error: ${notifsRes.status} ${notifsRes.statusText}`);
  const data: TrelloNotification[] = await notifsRes.json();
  const myId = meRes.ok ? (await meRes.json()).id : null;

  return data.filter(
    (n): n is FilteredNotification =>
      (n.type === 'addedToCard' || n.type === 'mentionedOnCard') &&
      n.idMemberCreator !== myId
  );
}

export async function markNotificationRead(
  id: string,
  apiKey: string,
  apiToken: string
): Promise<void> {
  const url = `${BASE}/notifications/${id}?key=${apiKey}&token=${apiToken}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unread: false }),
  });
  if (!res.ok) {
    throw new Error(`Failed to mark notification read: ${res.status}`);
  }
}

export async function markAllBoardNotificationsRead(
  notificationIds: string[],
  apiKey: string,
  apiToken: string
): Promise<void> {
  await Promise.all(
    notificationIds.map((id) => markNotificationRead(id, apiKey, apiToken))
  );
}

export async function postCardComment(
  cardId: string,
  text: string,
  apiKey: string,
  apiToken: string
): Promise<void> {
  const res = await fetch(`${BASE}/cards/${cardId}/actions/comments?key=${apiKey}&token=${apiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to post comment: ${res.status}`);
}

export async function fetchCardDetail(
  cardId: string,
  apiKey: string,
  apiToken: string
): Promise<CardDetail> {
  const [cardRes, actionsRes] = await Promise.all([
    fetch(`${BASE}/cards/${cardId}?fields=name,dueComplete,idList,desc&key=${apiKey}&token=${apiToken}`),
    fetch(`${BASE}/cards/${cardId}/actions?filter=commentCard&limit=14&key=${apiKey}&token=${apiToken}`),
  ]);

  if (!cardRes.ok) throw new Error(`Card fetch failed: ${cardRes.status}`);
  if (!actionsRes.ok) throw new Error(`Actions fetch failed: ${actionsRes.status}`);

  const card = await cardRes.json();
  const actions = await actionsRes.json();

  // Also fetch the list name
  let listName: string | undefined;
  if (card.idList) {
    const listRes = await fetch(`${BASE}/lists/${card.idList}?fields=name&key=${apiKey}&token=${apiToken}`);
    if (listRes.ok) {
      const list = await listRes.json();
      listName = list.name;
    }
  }

  const comments: CardComment[] = (actions as any[]).map((a) => ({
    id: a.id,
    date: a.date,
    text: a.data?.text ?? '',
    author: a.memberCreator?.fullName || a.memberCreator?.username || 'Unknown',
    authorUsername: a.memberCreator?.username || '',
  }));

  return {
    dueComplete: card.dueComplete ?? false,
    listName,
    desc: card.desc || undefined,
    comments,
  };
}
