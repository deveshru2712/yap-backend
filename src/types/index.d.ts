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
  type: "text" | "image";
  conversationId: string;
}
