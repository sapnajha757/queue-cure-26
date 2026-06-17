import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // tighten this to your deployed client URL before going live
    methods: ["GET", "POST"],
  },
});

// ----- In-memory queue state -----
// This is the entire "database" for the MVP. Good enough for one clinic,
// one day, one queue. Swap for a real DB (Postgres/Supabase) once you
// need history across days or multiple clinics - see docs/thought-process.md
let nextTokenNumber = 1;
let avgConsultTime = 5; // minutes
let currentToken = null; // token number currently being served, or null
const patients = []; // { token, name, phone, status: 'waiting' | 'serving' | 'done', addedAt }

function getPublicState() {
  const waiting = patients.filter((p) => p.status === "waiting");
  return {
    patients,
    currentToken,
    avgConsultTime,
    waitingCount: waiting.length,
  };
}

function broadcastState() {
  io.emit("queueUpdate", getPublicState());
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current state immediately so a freshly opened tab isn't blank
  socket.emit("queueUpdate", getPublicState());

  // A page can call this on mount to re-sync, even if the underlying
  // socket connection was already open (e.g. client-side route change
  // from one screen to another reuses the same connection).
  socket.on("requestState", () => {
    socket.emit("queueUpdate", getPublicState());
  });

  socket.on("addPatient", ({ name, phone }) => {
    if (!name || !name.trim()) return;
    const patient = {
      token: nextTokenNumber++,
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      status: "waiting",
      addedAt: Date.now(),
    };
    patients.push(patient);
    broadcastState();
  });

  socket.on("callNext", () => {
    // mark whoever was being served as done
    if (currentToken !== null) {
      const servingPatient = patients.find(
        (p) => p.token === currentToken && p.status === "serving"
      );
      if (servingPatient) servingPatient.status = "done";
    }

    // FIFO: first patient still waiting, by token order
    const next = patients.find((p) => p.status === "waiting");
    if (next) {
      next.status = "serving";
      currentToken = next.token;
    } else {
      currentToken = null; // queue is empty
    }
    broadcastState();
  });

  socket.on("setAvgTime", ({ minutes }) => {
    const val = Number(minutes);
    if (!Number.isFinite(val) || val <= 0) return;
    avgConsultTime = val;
    broadcastState();
  });

  // Handy for demos/testing - wipes the queue back to a clean slate
  socket.on("resetQueue", () => {
    patients.length = 0;
    nextTokenNumber = 1;
    currentToken = null;
    broadcastState();
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.send("Queue Cure '26 server is running.");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Queue Cure server listening on port ${PORT}`);
});
