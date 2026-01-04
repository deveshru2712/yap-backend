// When users connect (WebSocket/Socket.io)
logger.info({ userId, username }, "User connected");

// When messages are sent
logger.debug({ userId, roomId }, "Message sent");

// When errors occur
logger.error({ err, userId }, "Failed to send message");

// Database operations
logger.info("Database connected");
logger.error({ err }, "Database connection failed");

// Authentication events
logger.info({ userId }, "User logged in");
logger.warn({ userId }, "Failed login attempt");
