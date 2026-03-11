import { io } from "../socket";

export const emitGroupMessage = (message: GroupMessagePayload) => {
  io.to(`conversation:${message.conversationId}`).emit("new_message", message);
};
