import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { socket } from "../socket.js";

export default function PatientView() {
  const [connected, setConnected] = useState(socket.connected);
  const [patients, setPatients] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [avgConsultTime, setAvgConsultTime] = useState(5);
  const [waitingCount, setWaitingCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const [myToken, setMyToken] = useState("");

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onQueueUpdate(state) {
      setCurrentToken((prev) => {
        if (prev !== null && prev !== state.currentToken) {
          setPulse(true);
          setTimeout(() => setPulse(false), 500);
        }
        return state.currentToken;
      });
      setPatients(state.patients);
      setAvgConsultTime(state.avgConsultTime);
      setWaitingCount(state.waitingCount);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queueUpdate", onQueueUpdate);
    socket.emit("requestState");
    

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queueUpdate", onQueueUpdate);
    };
  }, []);

  const servingPatient = patients.find((p) => p.token === currentToken);
  const upNext = patients.filter((p) => p.status === "waiting").slice(0, 5);

  const myStatus = useMemo(() => {
    if (!myToken) return null;
    const tokenNum = Number(myToken);
    const mine = patients.find((p) => p.token === tokenNum);
    if (!mine) return { found: false };
    if (mine.status === "done") return { found: true, done: true };
    if (mine.status === "serving") {
      return { found: true, tokensAhead: 0, estimatedWait: 0, serving: true };
    }
    const tokensAhead = patients.filter(
      (p) => p.status === "waiting" && p.token < tokenNum
    ).length;
    return {
      found: true,
      tokensAhead,
      estimatedWait: tokensAhead * avgConsultTime,
    };
  }, [myToken, patients, avgConsultTime]);

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-sage-dark uppercase">
            Queue Cure '26
          </p>
          <h1 className="text-2xl font-semibold text-ink">Waiting Room</h1>
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
          <Link to="/reception" className="text-sm text-sage-dark underline">
            Receptionist desk
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Now serving board */}
        <div className="bg-ink rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <p className="font-mono text-sm tracking-widest text-paper/60 uppercase mb-4">
            Now serving
          </p>
          <p
            className={`font-mono text-7xl sm:text-8xl font-bold text-saffron ${
              pulse ? "animate-pulseOnce" : ""
            }`}
          >
            {currentToken ? `#${currentToken}` : "—"}
          </p>
          <p className="text-paper/70 mt-3 text-lg">
            {servingPatient ? servingPatient.name : "Waiting for first token"}
          </p>

          <div className="perforated-bottom mt-8 mb-6 w-full max-w-xs" />

          <p className="font-mono text-xs tracking-widest text-paper/50 uppercase mb-3">
            Up next
          </p>
          {upNext.length === 0 ? (
            <p className="text-paper/40 text-sm">Queue is empty</p>
          ) : (
            <div className="flex gap-3 flex-wrap justify-center">
              {upNext.map((p) => (
                <span
                  key={p.token}
                  className="font-mono text-sm bg-paper/10 text-paper px-3 py-1.5 rounded-lg"
                >
                  #{p.token}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Personal token lookup */}
        <div className="bg-white rounded-xl border border-perforation p-5 self-start">
          <h2 className="font-medium text-ink mb-1">Check your wait</h2>
          <p className="text-sm text-ink/60 mb-4">
            Enter the token number from your slip.
          </p>
          <input
            type="number"
            value={myToken}
            onChange={(e) => setMyToken(e.target.value)}
            placeholder="e.g. 7"
            className="w-full rounded-lg border border-perforation px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage mb-4"
          />

          {myStatus && !myStatus.found && (
            <p className="text-sm text-coral">
              Token not found. Check the number on your slip.
            </p>
          )}

          {myStatus && myStatus.found && myStatus.done && (
            <p className="text-sm text-sage-dark">
              This token has already been seen.
            </p>
          )}

          {myStatus && myStatus.found && myStatus.serving && (
            <p className="text-sm font-medium text-saffron">
              It's your turn now — please head in.
            </p>
          )}

          {myStatus &&
            myStatus.found &&
            !myStatus.done &&
            !myStatus.serving && (
              <div className="space-y-3">
                <div className="perforated pt-3">
                  <p className="text-xs text-ink/50 uppercase tracking-wide">
                    Patients ahead of you
                  </p>
                  <p className="font-mono text-2xl font-semibold text-ink">
                    {myStatus.tokensAhead}
                  </p>
                </div>
                <div className="perforated pt-3">
                  <p className="text-xs text-ink/50 uppercase tracking-wide">
                    Estimated wait
                  </p>
                  <p className="font-mono text-2xl font-semibold text-ink">
                    ~{myStatus.estimatedWait} min
                  </p>
                </div>
              </div>
            )}

          <div className="perforated mt-5 pt-3 text-xs text-ink/50">
            {waitingCount} patient{waitingCount === 1 ? "" : "s"} waiting ·{" "}
            {avgConsultTime} min average per patient
          </div>
        </div>
      </div>
    </div>
  );
}
