import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { socket } from "../socket.js";
 
export default function Receptionist() {
  const [connected, setConnected] = useState(socket.connected);
  const [patients, setPatients] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [avgConsultTime, setAvgConsultTime] = useState(5);
  const [waitingCount, setWaitingCount] = useState(0);
 
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avgInput, setAvgInput] = useState(5);
  const [callingNext, setCallingNext] = useState(false);
 
  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onQueueUpdate(state) {
      setPatients(state.patients);
      setCurrentToken(state.currentToken);
      setAvgConsultTime(state.avgConsultTime);
      setWaitingCount(state.waitingCount);
      setAvgInput(state.avgConsultTime);
      setCallingNext(false); // server confirmed the change went through
    }
 
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queueUpdate", onQueueUpdate);
 
    // Always ask for fresh state when this screen mounts, even if the
    // socket connection was already open from a previous screen.
    socket.emit("requestState");
 
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queueUpdate", onQueueUpdate);
    };
  }, []);
 
  function handleAddPatient(e) {
    e.preventDefault();
    if (!name.trim()) return;
    socket.emit("addPatient", { name, phone });
    setName("");
    setPhone("");
  }
 
  function handleCallNext() {
    if (callingNext) return;
    setCallingNext(true);
    socket.emit("callNext");
  }
 
  function handleSetAvgTime(e) {
    e.preventDefault();
    socket.emit("setAvgTime", { minutes: avgInput });
  }
 
  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const servingPatient = patients.find((p) => p.token === currentToken);
 
  return (
    <div className="min-h-screen px-4 sm:px-8 py-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-sage-dark uppercase">
            Queue Cure '26
          </p>
          <h1 className="text-2xl font-semibold text-ink">Receptionist Desk</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-ink/70">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-sage" : "bg-coral"
              }`}
            />
            {connected ? "Live" : "Reconnecting..."}
          </span>
          <Link to="/patient" className="text-sm text-sage-dark underline">
            Open waiting room view
          </Link>
        </div>
      </header>
 
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Left column: controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-perforation p-5">
            <h2 className="font-medium text-ink mb-4">Add patient</h2>
            <form onSubmit={handleAddPatient} className="space-y-3">
              <div>
                <label className="text-sm text-ink/70 block mb-1">
                  Patient name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-lg border border-perforation px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div>
                <label className="text-sm text-ink/70 block mb-1">
                  Phone (optional)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-perforation px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-sage text-white rounded-lg py-2 font-medium hover:bg-sage-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sage"
              >
                Issue token
              </button>
            </form>
          </div>
 
          <div className="bg-white rounded-xl border border-perforation p-5">
            <h2 className="font-medium text-ink mb-4">Average consult time</h2>
            <form onSubmit={handleSetAvgTime} className="flex gap-2">
              <input
                type="number"
                min="1"
                value={avgInput}
                onChange={(e) => setAvgInput(e.target.value)}
                className="w-24 rounded-lg border border-perforation px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <span className="self-center text-sm text-ink/70">minutes</span>
              <button
                type="submit"
                className="ml-auto px-4 rounded-lg border border-sage text-sage-dark font-medium hover:bg-sage-light transition-colors"
              >
                Update
              </button>
            </form>
            <p className="text-xs text-ink/50 mt-2">
              Used to estimate every patient's wait time on the waiting room
              screen.
            </p>
          </div>
 
          <div className="bg-sage-light rounded-xl p-5 text-center">
            <p className="text-sm text-sage-dark mb-1">Now serving</p>
            <p className="font-mono text-4xl font-bold text-sage-dark">
              {currentToken ? `#${currentToken}` : "—"}
            </p>
            <p className="text-sm text-ink/60 mt-1">
              {servingPatient ? servingPatient.name : "No one currently"}
            </p>
            <button
              onClick={handleCallNext}
              disabled={
                callingNext || (currentToken === null && waitingCount === 0)
              }
              className="mt-4 w-full bg-saffron text-ink font-semibold rounded-lg py-2.5 hover:bg-saffron/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-saffron"
            >
              {callingNext ? "Calling..." : "Call next →"}
            </button>
            <p className="text-xs text-ink/50 mt-2">
              {waitingCount} patient{waitingCount === 1 ? "" : "s"} waiting
            </p>
          </div>
        </div>
 
        {/* Right column: queue list */}
        <div className="bg-white rounded-xl border border-perforation overflow-hidden">
          <div className="px-5 py-4 border-b border-perforation flex items-center justify-between">
            <h2 className="font-medium text-ink">Queue</h2>
            <span className="text-xs text-ink/50 font-mono">
              {patients.length} total today
            </span>
          </div>
          {patients.length === 0 ? (
            <div className="px-5 py-10 text-center text-ink/50">
              No patients yet. Issue the first token to get started.
            </div>
          ) : (
            <ul>
              {patients
                .slice()
                .reverse()
                .map((p, idx) => (
                  <li
                    key={p.token}
                    className={`flex items-center gap-4 px-5 py-3 ${
                      idx !== 0 ? "perforated" : ""
                    }`}
                  >
                    <span className="font-mono text-lg font-semibold w-12 text-ink">
                      #{p.token}
                    </span>
                    <span className="flex-1 text-ink">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
 
function StatusBadge({ status }) {
  const styles = {
    waiting: "bg-paper text-ink/60 border border-perforation",
    serving: "bg-saffron-light text-saffron border border-saffron",
    done: "bg-sage-light text-sage-dark border border-sage",
  };
  const labels = {
    waiting: "Waiting",
    serving: "Serving",
    done: "Done",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
 