import { io } from "../socket";

export const emitGroupMessage = (message: GroupMessagePayload) => {
  io.to(message.conversationId).emit("new_message", message);
};
