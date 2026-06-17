import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Receptionist from "./pages/Receptionist.jsx";
import PatientView from "./pages/PatientView.jsx";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs tracking-widest text-sage-dark uppercase mb-3">
        Queue Cure '26
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold text-ink mb-2">
        No more shouting across the waiting room.
      </h1>
      <p className="text-ink/70 max-w-md mb-10">
        Pick a screen. Open both on different devices and watch them stay in
        sync the moment a token is called.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/reception"
          className="px-6 py-3 rounded-lg bg-sage text-white font-medium hover:bg-sage-dark transition-colors"
        >
          Open Receptionist Desk
        </Link>
        <Link
          to="/patient"
          className="px-6 py-3 rounded-lg bg-white border border-perforation text-ink font-medium hover:border-sage transition-colors"
        >
          Open Waiting Room Display
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reception" element={<Receptionist />} />
        <Route path="/patient" element={<PatientView />} />
      </Routes>
    </BrowserRouter>
  );
}
