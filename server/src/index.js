/**
 * Étape 3 du plan MVP : point d’entrée HTTP + Socket.io.
 * La logique d’état et les handlers sont dans `events.js` (INITIAL_STATE, registerSocketHandlers).
 */
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT, getSocketIoCors } from "./config.js";
import { registerSocketHandlers } from "./events.js";

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Flipper Hetic server (socket.io)");
});

const io = new Server(httpServer, {
  cors: getSocketIoCors(),
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Serveur socket.io sur http://localhost:${PORT}`);
});
