import { io } from "../socket";

export const emitDirectMessage = (message: DirectMessagePayload) => {
  io.to(message.receiverId).emit("new_message", message);
};
