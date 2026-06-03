export interface TrelloNotification {
  id: string;
  idMemberCreator: string;
  type: 'addedToCard' | 'mentionedOnCard' | string;
  date: string;
  unread: boolean;
  data: {
    card?: { id: string; name: string; shortLink: string };
    board?: { id: string; name: string };
    list?: { id: string; name: string };
    text?: string;
    member?: { id: string; username: string; fullName: string };
  };
}

export type FilteredNotification = TrelloNotification & {
  type: 'addedToCard' | 'mentionedOnCard';
};

export interface Settings {
  apiKey: string;
  apiToken: string;
  username: string;
}

export type BoardFilter = string | '__starred__';

export interface CardComment {
  id: string;
  date: string;
  text: string;
  author: string;
  authorUsername: string;
}

export interface CardDetail {
  dueComplete: boolean;
  listName?: string;
  desc?: string;
  comments: CardComment[];
}
