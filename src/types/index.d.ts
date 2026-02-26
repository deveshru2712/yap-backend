interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  tokenVersion: number;
}

interface DirectMessagePayload {
  id: string;
  senderId: string;
  conversationId: string;
  content: string;
  createdAt: string;
  type: "direct";
  receiverId: string;
}
