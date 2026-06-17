# Thought Process — Queue Cure '26
 
## The problem, as I understood it
 
76% of India's clinics are still running queues with paper slips and someone
shouting names across a waiting room. That's not a UX nitpick — it's hours of
a daily wage worker's time lost, an elderly patient who can't hear their name
called, a receptionist who has to remember forty things in her head at once.
I didn't want to build a "queue management system" in the abstract. I wanted
to build the thing that replaces one specific object: the paper token slip.
 
That's actually where the visual design came from too — the dashed
perforation lines between queue entries in the UI are a small nod to the
torn edge of a real token stub. I wanted it to still feel familiar to
someone used to paper, just one with a heartbeat.
 
## Why Socket.io instead of polling or Supabase Realtime
 
The single hardest requirement here is "the moment Call Next is clicked, the
patient screen updates." That's a textbook real-time problem, and Socket.io
is the most direct, beginner-explainable way to solve it: the server holds
one source of truth, and every connected screen just listens for
`queueUpdate`. No screen ever has to ask "did anything change?" — it's told.
 
I considered Supabase Realtime, since I'd already used it for KrishiLink. It
would have worked, but it would have hidden the actual mechanism behind a
database row subscription. For a hackathon that explicitly asks for a
"socket event diagram," I wanted the events to be the architecture, not an
implementation detail underneath someone else's platform.
 
## Why no database
 
The whole queue lives in memory on the server: one array of patients, one
"currently serving" token, one average-consult-time number. For a single
clinic's single day, that's genuinely enough — it resets at midnight the
same way a stack of paper slips would get thrown out anyway.
 
The honest tradeoff: if the server restarts, the queue is gone, and there's
no history across days. That's the right scope for a one-week MVP though. If
I were taking this further, the next step isn't "add Postgres" for its own
sake — it's asking what a real receptionist would actually want to look back
on (no-show rates? average wait by time of day?) and only persisting what
answers that.
 
## Why two separate screens instead of one with role-switching
 
I built `/reception` and `/patient` as separate routes rather than one page
with a toggle, because that's how they'll actually be used — on two
different devices, in two different physical locations in the clinic. The
receptionist's laptop and the TV/tablet in the waiting room aren't the same
context, so they shouldn't be the same component pretending to be two
things.
 
## What I'd build next, given more time
 
- A printable/QR token slip so patients don't have to remember their number
- SMS or WhatsApp ping when someone is 2 tokens away, so people can step
  outside instead of sitting in a waiting room for two hours
- Multiple "counters" for clinics with more than one doctor, so the queue
  forks instead of staying single-file
- Basic auth on the receptionist screen, so it's not a public URL anyone
  could click "Call Next" on
## What I actually learned building this
 
Real-time sync sounds intimidating until you build the first version — it's
just "server has the truth, broadcast it, clients render whatever they're
told." The hard part wasn't the sockets, it was deciding what *not* to
build (no login, no database, no multi-clinic support) so the actual ask —
two screens, live sync — stayed sharp instead of getting buried under scope.
 
## Concurrency and edge cases
 
**What happens if two receptionists click "Call Next" at the same time?**
Node.js runs on a single-threaded event loop, so the server never processes
two socket events simultaneously — even if two clicks arrive a millisecond
apart, the server fully finishes handling the first `callNext` (mark
current done, promote next waiting patient, broadcast) before it even looks
at the second one. There's no race condition where two receptionists could
both "win" the same token.
 
**What about one receptionist accidentally double-clicking?**
This one I actually hit while testing, not just thought about in theory.
The button doesn't wait for confirmation by default, so two fast clicks
could call next twice and silently skip a patient. I fixed it by disabling
the button the instant it's clicked, and only re-enabling it once the
server's `queueUpdate` broadcast confirms the change actually went through
— so the button's "busy" state is tied to real server confirmation, not a
guessed timeout.
 
**What about issuing a token with an empty name?**
The "Issue token" button is disabled until the name field has real text, so
the receptionist can't fire an empty submission and wonder why nothing
happened.
 
**What if the queue is empty and "Call Next" is clicked?**
The server checks for a waiting patient; if there isn't one, it just sets
the current token to null and broadcasts that — the waiting room screen
shows "queue is empty" instead of crashing or freezing on a stale number.
 
**What if a patient enters a token number that doesn't exist?**
The lookup explicitly checks and shows "Token not found. Check the number
on your slip." instead of guessing or showing a blank state.
 
**What happens if a screen is closed and reopened, or the network drops?**
This is the actual bug I ran into building this: I initially only sent the
current state to a socket the moment it *connected*. That works for a
fresh tab, but a client-side route change (going from the receptionist
screen to the waiting room screen without a full page reload) reuses the
same socket connection — so the new screen mounted but never got an
initial state push, and just sat there showing an empty queue even though
the server had real data. The fix: every screen now explicitly asks the
server for the current state the moment it mounts (`requestState`),
regardless of whether the underlying connection is new or reused. That's
also what makes a dropped-and-restored network connection self-heal
correctly.
 
**What's NOT handled, on purpose:**
If the server process itself restarts, the in-memory queue resets to
empty — there's no persistence layer. For a single clinic's single day,
that's an acceptable scope tradeoff (see "Why no database" above), but it's
worth saying out loud rather than pretending it's handled.
 
---
— adding my own specific moments from
building it.

---
*A real moment from building this: my waiting room screen kept showing an
empty queue even though the receptionist screen clearly had patients in
it. Turned out clicking between the two screens inside the same browser
tab was reusing one socket connection, so the waiting room never got the
initial data push — only screens opened completely fresh did. Tracking
that down taught me more about how Socket.io connections actually work
than reading the docs would have. The fix was small (ask the server for
state on mount, not just on connect), but finding it wasn't.*