interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  tokenVersion: number;
}

interface DirectMessagePayload {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  conversationId: string;
  senderUserName: string;
  name: string;
  avatar: string | null;
  type: "direct";
}

interface GroupMessagePayload {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  conversationId: string;
  senderUserName: string;
  name: string;
  avatar: string | null;
  type: "group";
}
