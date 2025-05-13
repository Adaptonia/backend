// DTOs for WebSocket message events
export class DirectMessageEvent {
  receiverId: string;
  content: string;
}

export class ChannelMessageEvent {
  channelId: string;
  content: string;
}

export class MessageReadEvent {
  messageId: string;
}

export class TypingEvent {
  receiverId?: string;
  channelId?: string;
  isTyping: boolean;
  userName?: string;
}

// Server emitted events
export class MessageSentEvent {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  createdAt: Date;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export class UserOnlineEvent {
  userId: string;
  isOnline: boolean;
} 