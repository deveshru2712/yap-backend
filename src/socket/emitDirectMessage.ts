import { io } from "../socket";

export const emitDirectMessage = (message: DirectMessagePayload) => {
  io.to(`user:${message.receiverId}`).emit("new_message", message);
};
