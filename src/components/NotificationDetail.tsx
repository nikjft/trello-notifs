import { useState } from 'react';
import { ExternalLink, Archive, Star, Loader2, CheckSquare, Square, MessageSquare, FileText, CornerDownLeft, Send, X } from 'lucide-react';
import { FilteredNotification, Settings } from '../types';
import { formatDistanceToNow, formatDate } from '../utils';
import { useCardDetail } from '../hooks/useCardDetail';
import { postCardComment } from '../api';
import { MarkdownBody } from './MarkdownBody';

interface Props {
  notifications: FilteredNotification[];
  cardId: string | null;
  isStarred: boolean;
  onMarkCardRead: (ids: string[]) => void;
  onToggleStar: (cardId: string) => void;
  settings: Settings;
}

function ReplyBox({
  initialText,
  cardId,
  apiKey,
  apiToken,
  onClose,
}: {
  initialText: string;
  cardId: string;
  apiKey: string;
  apiToken: string;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await postCardComment(cardId, text.trim(), apiKey, apiToken);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
      setSending(false);
    }
  };

  return (
    <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
          if (e.key === 'Escape') onClose();
        }}
        rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500"
        placeholder="Write a reply…"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-gray-600 text-xs">⌘↵ to send · Esc to cancel</span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={14} />
          </button>
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, cardId, replyingTo, setReplyingTo, apiKey, apiToken }: {
  notification: FilteredNotification;
  cardId: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  apiKey: string;
  apiToken: string;
}) {
  const { data, type, date } = notification;
  const replyUsername = data.member?.username ?? '';
  const isReplying = replyingTo === notification.id;

  return (
    <div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span>
            {type === 'addedToCard' ? (
              <span className="bg-green-900/60 text-green-300 text-xs px-1.5 py-0.5 rounded">Assigned</span>
            ) : (
              <span className="bg-purple-900/60 text-purple-300 text-xs px-1.5 py-0.5 rounded">Mentioned</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span title={formatDate(date)} className="text-gray-600 text-xs">{formatDistanceToNow(date)}</span>
            <button
              onClick={() => setReplyingTo(isReplying ? null : notification.id)}
              title="Reply"
              className="text-gray-600 hover:text-gray-300 transition-colors"
            >
              <CornerDownLeft size={13} />
            </button>
          </div>
        </div>
        {type === 'mentionedOnCard' && data.text && (
          <MarkdownBody text={data.text} className="mt-1 text-gray-300" />
        )}
        {type === 'addedToCard' && data.member && (
          <p className="text-gray-400 text-sm">
            Assigned by <span className="text-gray-200">{data.member.fullName || data.member.username}</span>
          </p>
        )}
      </div>
      {isReplying && (
        <ReplyBox
          initialText={replyUsername ? `@${replyUsername} ` : ''}
          cardId={cardId}
          apiKey={apiKey}
          apiToken={apiToken}
          onClose={() => setReplyingTo(null)}
        />
      )}
    </div>
  );
}

export default function NotificationDetail({ notifications, cardId, isStarred, onMarkCardRead, onToggleStar, settings }: Props) {
  const { detail, loading: detailLoading } = useCardDetail(cardId, settings);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // comment id or 'card'

  // Reset reply box when card changes
  if (!cardId || notifications.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
        Select a notification
      </div>
    );
  }

  const first = notifications[0];
  const { data } = first;
  const cardName = data.card?.name ?? '(unknown card)';
  const shortLink = data.card?.shortLink;
  const cardUrl = shortLink ? `https://trello.com/c/${shortLink}` : null;
  const listName = detail?.listName ?? data.list?.name;
  const notifIds = notifications.map((n) => n.id);

  const replyPrefix = (username: string) => username ? `@${username} ` : '';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl">
        {/* Card header with star */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-white text-base font-semibold leading-snug">{cardName}</h2>
          <button
            onClick={() => onToggleStar(cardId)}
            className="flex-shrink-0 text-gray-500 hover:text-yellow-400 transition-colors mt-0.5"
            title={isStarred ? 'Unstar card' : 'Star card'}
          >
            <Star size={18} className={isStarred ? 'text-yellow-400' : ''} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-sm text-gray-400">
          {data.board?.name && (
            <span><span className="text-gray-600">Board</span> {data.board.name}</span>
          )}
          {listName && (
            <span><span className="text-gray-600">List</span> {listName}</span>
          )}
          {detailLoading ? (
            <span className="flex items-center gap-1 text-gray-600 text-xs">
              <Loader2 size={11} className="animate-spin" /> Loading…
            </span>
          ) : detail ? (
            detail.dueComplete ? (
              <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckSquare size={13} /> Done</span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-600 text-xs"><Square size={13} /> Not done</span>
            )
          ) : null}
        </div>

        {/* Unread notifications for this card */}
        <div className="space-y-2 mb-4">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              cardId={cardId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              apiKey={settings.apiKey}
              apiToken={settings.apiToken}
            />
          ))}
        </div>

        {/* Mark all read + open link */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => onMarkCardRead(notifIds)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            <Archive size={15} />
            Archive{notifications.length > 1 ? ` (${notifications.length})` : ''}
          </button>
          {cardUrl && (
            <a
              href={cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded px-4 py-2 text-sm transition-colors"
            >
              <ExternalLink size={15} />
              Open in Trello
            </a>
          )}
        </div>

        {/* Card description */}
        {!detailLoading && detail?.desc && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-600 uppercase tracking-wider">
              <FileText size={12} />
              <span>Description</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <MarkdownBody text={detail.desc} className="text-gray-300" />
            </div>
          </div>
        )}

        {/* Comments */}
        {!detailLoading && detail && detail.comments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 uppercase tracking-wider">
              <MessageSquare size={12} />
              <span>Recent comments ({detail.comments.length})</span>
            </div>
            <div className="space-y-3">
              {detail.comments.map((comment) => (
                <div key={comment.id}>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-300 text-xs font-medium">{comment.author}</span>
                      <div className="flex items-center gap-2">
                        <span title={formatDate(comment.date)} className="text-gray-600 text-xs">
                          {formatDistanceToNow(comment.date)}
                        </span>
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          title="Reply"
                          className="text-gray-600 hover:text-gray-300 transition-colors"
                        >
                          <CornerDownLeft size={13} />
                        </button>
                      </div>
                    </div>
                    <MarkdownBody text={comment.text} className="text-gray-400" />
                  </div>
                  {replyingTo === comment.id && cardId && (
                    <ReplyBox
                      initialText={replyPrefix(comment.authorUsername)}
                      cardId={cardId}
                      apiKey={settings.apiKey}
                      apiToken={settings.apiToken}
                      onClose={() => setReplyingTo(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply to card (for assignments or when no comments) */}
        {!detailLoading && (
          <div className="mt-6">
            <button
              onClick={() => setReplyingTo(replyingTo === 'card' ? null : 'card')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 text-xs transition-colors"
            >
              <CornerDownLeft size={13} />
              Add comment
            </button>
            {replyingTo === 'card' && cardId && (
              <ReplyBox
                initialText=""
                cardId={cardId}
                apiKey={settings.apiKey}
                apiToken={settings.apiToken}
                onClose={() => setReplyingTo(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
