import { io } from "socket.io-client";

// During local dev this hits your local server. Once you deploy the
// server (Render/Railway etc), set VITE_SERVER_URL in a .env file
// at build time and this picks it up automatically.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket = io(SERVER_URL, {
  autoConnect: true,
});
