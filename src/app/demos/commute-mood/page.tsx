"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Data ─────────────────────────────────────────────────────────── */

interface Line {
  name: string;
  color: string;
  stations: string[];
}

const LINES: Record<string, Line> = {
  yellow: {
    name: "Yellow",
    color: "#F59E0B",
    stations: ["Antioch", "Pittsburg", "Concord", "Walnut Creek", "Fremont", "SF"],
  },
  red: {
    name: "Red",
    color: "#EF4444",
    stations: ["Richmond", "El Cerrito", "Berkeley", "Oakland", "Millbrae"],
  },
  blue: {
    name: "Blue",
    color: "#2563EB",
    stations: ["Dublin", "Castro Valley", "Bay Fair", "Coliseum", "Daly City"],
  },
  green: {
    name: "Green",
    color: "#10B981",
    stations: ["Berryessa", "Milpitas", "Fremont", "Balboa Park", "Daly City"],
  },
};

const MOODS = [
  { key: "Dead Tired", icon: "😴", color: "#94A3B8" },
  { key: "Just Woke Up", icon: "☕", color: "#F59E0B" },
  { key: "Stressed", icon: "😤", color: "#EF4444" },
  { key: "Chill", icon: "😌", color: "#10B981" },
  { key: "In the Zone", icon: "🎧", color: "#8B5CF6" },
  { key: "Good Day", icon: "🤩", color: "#F97316" },
] as const;

type MoodKey = (typeof MOODS)[number]["key"];

interface Rider {
  id: number | string;
  mood: MoodKey;
  offsetX: number;
  offsetY: number;
  duration: number;
  delay: number;
  isReal?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  mood: MoodKey | null;
  text: string;
  timestamp: number;
}

function randomMood(): MoodKey {
  return MOODS[Math.floor(Math.random() * MOODS.length)].key;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateRiders(count: number, startId: number): Rider[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    mood: randomMood(),
    offsetX: Math.random() * 100,
    offsetY: Math.random() * 100,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * -5,
  }));
}

function getDistribution(riders: Rider[]): Record<MoodKey, number> {
  const counts: Record<string, number> = {};
  for (const m of MOODS) counts[m.key] = 0;
  for (const r of riders) counts[r.mood]++;
  const total = riders.length || 1;
  const dist: Record<string, number> = {};
  for (const m of MOODS) dist[m.key] = Math.round((counts[m.key] / total) * 100);
  return dist as Record<MoodKey, number>;
}

function getVibeSummary(dist: Record<MoodKey, number>): string {
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const phrases: Record<string, string> = {
    "Dead Tired": "Monday energy",
    "Just Woke Up": "still booting up",
    Stressed: "big deadline vibes",
    Chill: "smooth sailing",
    "In the Zone": "deep focus mode",
    "Good Day": "main character energy",
  };
  return `This train is mostly ${top[0]} (${phrases[top[0]] || "interesting vibe"})`;
}

/* ─── Select Screen ────────────────────────────────────────────────── */

function SelectScreen({
  onBoard,
}: {
  onBoard: (line: string, station: string, direction: string) => void;
}) {
  const [line, setLine] = useState("");
  const [station, setStation] = useState("");
  const [direction, setDirection] = useState("Inbound");

  const stations = line ? LINES[line].stations : [];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F5F0" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "#EFF6FF" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="3" />
              <path d="M4 11h16" />
              <path d="M8 19l-2 3" />
              <path d="M16 19l2 3" />
              <circle cx="9" cy="15" r="1" fill="#2563EB" />
              <circle cx="15" cy="15" r="1" fill="#2563EB" />
              <path d="M9 7h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "#1A1D23" }}>
            CommuteMood
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
            Join your train. Feel the vibe.
          </p>
        </div>

        <div className="rounded-2xl border p-6 space-y-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          {/* Line */}
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6B7280" }}>
              Line
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LINES).map(([key, l]) => (
                <button
                  key={key}
                  onClick={() => {
                    setLine(key);
                    setStation("");
                  }}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: line === key ? l.color : "#E5E7EB",
                    background: line === key ? `${l.color}10` : "#FFFFFF",
                    color: "#1A1D23",
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: l.color }}
                  />
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Station */}
          {line && (
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6B7280" }}>
                Station
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#E5E7EB", color: station ? "#1A1D23" : "#6B7280", background: "#FFFFFF" }}
              >
                <option value="">Select a station</option>
                {stations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Direction */}
          {station && (
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6B7280" }}>
                Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Inbound", "Outbound"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className="rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: direction === d ? "#2563EB" : "#E5E7EB",
                      background: direction === d ? "#EFF6FF" : "#FFFFFF",
                      color: "#1A1D23",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Board Button */}
          <button
            disabled={!line || !station}
            onClick={() => onBoard(line, station, direction)}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
            style={{
              background: line && station ? "#2563EB" : "#E5E7EB",
              color: line && station ? "#FFFFFF" : "#9CA3AF",
              cursor: line && station ? "pointer" : "not-allowed",
            }}
          >
            Board Train
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
          An ephemeral mood-sharing experience for transit riders
        </p>
      </div>
    </div>
  );
}

/* ─── Mood Bubble ──────────────────────────────────────────────────── */

function MoodBubble({ rider }: { rider: Rider }) {
  const mood = MOODS.find((m) => m.key === rider.mood);
  if (!mood) return null;

  return (
    <div
      className="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs"
      style={{
        left: `${rider.offsetX}%`,
        top: `${rider.offsetY}%`,
        background: `${mood.color}20`,
        border: `1.5px solid ${mood.color}40`,
        animation: `commute-float ${rider.duration}s ease-in-out ${rider.delay}s infinite`,
      }}
    >
      {mood.icon}
    </div>
  );
}

/* ─── Room Screen ──────────────────────────────────────────────────── */

function RoomScreen({
  lineKey,
  station,
  direction,
  onLeave,
}: {
  lineKey: string;
  station: string;
  direction: string;
  onLeave: () => void;
}) {
  const line = LINES[lineKey];
  const stations = line.stations;
  const startIdx = stations.indexOf(station);
  const isInbound = direction === "Inbound";
  const upcomingStations = isInbound
    ? stations.slice(startIdx + 1)
    : stations.slice(0, startIdx).reverse();

  const userId = useRef(crypto.randomUUID());
  const username = useRef(`Rider ${Math.floor(Math.random() * 900) + 100}`);

  const [simulatedRiders, setSimulatedRiders] = useState<Rider[]>(() => generateRiders(15, 0));
  const [realRiders, setRealRiders] = useState<Rider[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [riderFlash, setRiderFlash] = useState(false);
  const [vibeImageUrl, setVibeImageUrl] = useState<string | null>(null);
  const [vibeImageLoading, setVibeImageLoading] = useState(false);
  const [vibeImageError, setVibeImageError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const nextId = useRef(15);
  const boardTime = useRef(
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );

  const allRiders = [...simulatedRiders, ...realRiders];
  const distribution = getDistribution(allRiders);

  // Supabase Realtime channel for presence + broadcast
  useEffect(() => {
    const channelName = `commute:${lineKey}:${direction}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceRiders: Rider[] = [];
        for (const key of Object.keys(state)) {
          const entries = state[key] as unknown as Array<{ userId: string; mood: MoodKey; username: string }>;
          for (const entry of entries) {
            if (entry.userId === userId.current) continue;
            presenceRiders.push({
              id: entry.userId,
              mood: entry.mood,
              offsetX: Math.abs(hashCode(entry.userId) % 100),
              offsetY: Math.abs((hashCode(entry.userId) * 31) % 100),
              duration: 3 + (hashCode(entry.userId) % 4),
              delay: -(hashCode(entry.userId) % 5),
              isReal: true,
            });
          }
        }
        setRealRiders(presenceRiders);
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setChatMessages((prev) => [...prev.slice(-49), msg]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track initial presence (no mood yet)
          await channel.track({
            userId: userId.current,
            username: username.current,
            mood: "Chill",
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [lineKey, direction]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Simulate riders boarding at stops
  useEffect(() => {
    const interval = setInterval(() => {
      const count = 2 + Math.floor(Math.random() * 2);
      const newRiders = generateRiders(count, nextId.current);
      nextId.current += count;
      setSimulatedRiders((prev) => [...prev, ...newRiders]);
      setCurrentStopIdx((prev) =>
        prev < upcomingStations.length - 1 ? prev + 1 : prev
      );
      setRiderFlash(true);
      setTimeout(() => setRiderFlash(false), 600);
    }, 10000);
    return () => clearInterval(interval);
  }, [upcomingStations.length]);

  const handleSelectMood = useCallback(
    (mood: MoodKey) => {
      setSelectedMood(mood);
      // Update simulated rider 0 to reflect user's mood
      setSimulatedRiders((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], mood };
        }
        return updated;
      });
      // Update presence with new mood
      channelRef.current?.track({
        userId: userId.current,
        username: username.current,
        mood,
      });
    },
    []
  );

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !channelRef.current) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: userId.current,
      username: username.current,
      mood: selectedMood,
      text,
      timestamp: Date.now(),
    };
    channelRef.current.send({
      type: "broadcast",
      event: "chat",
      payload: msg,
    });
    // Add own message locally
    setChatMessages((prev) => [...prev.slice(-49), msg]);
    setChatInput("");
  }, [chatInput, selectedMood]);

  const handleLeave = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    onLeave();
  }, [onLeave]);

  // Fetch vibe image when mood is selected
  const fetchVibeImage = useCallback(async () => {
    if (!selectedMood) return;
    setVibeImageLoading(true);
    setVibeImageError(null);
    try {
      const dist = getDistribution(allRiders);
      const res = await fetch("/api/commute-mood/vibe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, distribution: dist }),
      });
      if (!res.ok) throw new Error("Failed to generate vibe image");
      const data = await res.json();
      setVibeImageUrl(data.imageUrl);
    } catch (err) {
      setVibeImageError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVibeImageLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood]);

  useEffect(() => {
    if (selectedMood && !vibeImageUrl && !vibeImageLoading) {
      fetchVibeImage();
    }
    // Only run on first mood selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood]);

  const destination = isInbound ? stations[stations.length - 1] : stations[0];

  const moodIconForKey = (key: MoodKey | null) => {
    const m = MOODS.find((mood) => mood.key === key);
    return m ? m.icon : "";
  };

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: "#F5F5F0" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ background: line.color }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1A1D23" }}>
                  BART {line.name} &middot; {station} &rarr; {destination}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  Boarded at {boardTime.current} &middot; {username.current}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: riderFlash ? "#DBEAFE" : "#F3F4F6",
                color: riderFlash ? "#2563EB" : "#6B7280",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              {allRiders.length} riders
              {realRiders.length > 0 && (
                <span style={{ color: "#2563EB" }}>({realRiders.length + 1} live)</span>
              )}
            </div>
          </div>
        </div>

        {/* Mood Picker */}
        <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#6B7280" }}>
            {selectedMood ? "Your mood" : "How are you feeling?"}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => handleSelectMood(m.key)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: isSelected ? m.color : "#E5E7EB",
                    background: isSelected ? `${m.color}12` : "#FFFFFF",
                    boxShadow: isSelected ? `0 0 0 1px ${m.color}` : "none",
                  }}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span
                    className="text-[10px] font-medium leading-tight text-center"
                    style={{ color: isSelected ? m.color : "#6B7280" }}
                  >
                    {m.key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distribution & Bubbles — only shown after mood is selected */}
        {selectedMood && (
          <>
            {/* Vibe Summary */}
            <div
              className="rounded-2xl border px-5 py-4 text-center"
              style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}
            >
              <p className="text-sm font-medium" style={{ color: "#1E40AF" }}>
                {getVibeSummary(distribution)}
              </p>
            </div>

            {/* Mood Distribution */}
            <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                Mood distribution
              </p>
              <div className="space-y-3">
                {MOODS.map((m) => {
                  const pct = distribution[m.key];
                  return (
                    <div key={m.key} className="flex items-center gap-3">
                      <span className="text-sm w-5 text-center">{m.icon}</span>
                      <span className="text-xs w-24 truncate" style={{ color: "#6B7280" }}>
                        {m.key}
                      </span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: m.color,
                            transition: "width 700ms ease",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right" style={{ color: "#1A1D23" }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
              <div className="px-5 pt-5 mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
                  Chat
                </p>
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                  Messages vanish when you leave the train
                </p>
              </div>
              <div
                className="mx-5 mb-3 overflow-y-auto space-y-2"
                style={{ maxHeight: "200px" }}
              >
                {chatMessages.length === 0 && (
                  <p className="text-xs py-4 text-center" style={{ color: "#9CA3AF" }}>
                    No messages yet. Say something!
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 text-sm">
                    <span className="font-medium shrink-0" style={{ color: "#1A1D23" }}>
                      {msg.username} {moodIconForKey(msg.mood)}
                    </span>
                    <span style={{ color: "#374151" }}>{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#E5E7EB", color: "#1A1D23", background: "#FFFFFF" }}
                  maxLength={200}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: chatInput.trim() ? "#2563EB" : "#E5E7EB",
                    color: chatInput.trim() ? "#FFFFFF" : "#9CA3AF",
                    cursor: chatInput.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Floating Mood Bubbles */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
              <p className="text-xs font-medium uppercase tracking-wider px-5 pt-5 mb-3" style={{ color: "#6B7280" }}>
                Riders on this train
              </p>
              <div className="relative h-48 mx-5 mb-5 rounded-xl overflow-hidden" style={{ background: "#F9FAFB" }}>
                {allRiders.slice(0, 40).map((r) => (
                  <MoodBubble key={r.id} rider={r} />
                ))}
              </div>
            </div>

            {/* AI Vibe Image */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
              <div className="px-5 pt-5 mb-3">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
                  AI vibe check
                </p>
              </div>
              {vibeImageLoading && (
                <div className="flex flex-col items-center justify-center py-16 px-5">
                  <svg className="animate-spin h-6 w-6 mb-3" style={{ color: "#2563EB" }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    Generating the vibe...
                  </p>
                </div>
              )}
              {vibeImageError && (
                <div className="px-5 pb-5">
                  <div className="rounded-lg p-3 text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    {vibeImageError}
                  </div>
                </div>
              )}
              {vibeImageUrl && (
                <img
                  src={vibeImageUrl}
                  alt="AI-generated vibe image reflecting the collective mood"
                  className="w-full"
                />
              )}
            </div>
          </>
        )}

        {/* Station Ticker */}
        <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#6B7280" }}>
            Upcoming stops
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {upcomingStations.map((s, i) => {
              const isPast = i < currentStopIdx;
              const isCurrent = i === currentStopIdx;
              return (
                <div key={s} className="flex items-center gap-2 shrink-0">
                  {i > 0 && (
                    <div
                      className="w-6 h-0.5 rounded-full"
                      style={{ background: isPast ? line.color : "#E5E7EB" }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border-2 transition-colors"
                      style={{
                        borderColor: isPast || isCurrent ? line.color : "#D1D5DB",
                        background: isPast ? line.color : isCurrent ? `${line.color}30` : "transparent",
                      }}
                    />
                    <span
                      className="text-[10px] font-medium whitespace-nowrap"
                      style={{
                        color: isCurrent ? "#1A1D23" : isPast ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {s}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Train */}
        <button
          onClick={handleLeave}
          className="w-full rounded-xl border py-3 text-sm font-medium transition-colors"
          style={{ borderColor: "#E5E7EB", color: "#6B7280", background: "#FFFFFF" }}
        >
          Leave Train
        </button>
      </div>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes commute-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */

export default function CommuteMoodPage() {
  const [screen, setScreen] = useState<"select" | "room">("select");
  const [lineKey, setLineKey] = useState("");
  const [station, setStation] = useState("");
  const [direction, setDirection] = useState("");

  if (screen === "room" && lineKey) {
    return (
      <RoomScreen
        lineKey={lineKey}
        station={station}
        direction={direction}
        onLeave={() => setScreen("select")}
      />
    );
  }

  return (
    <SelectScreen
      onBoard={(l, s, d) => {
        setLineKey(l);
        setStation(s);
        setDirection(d);
        setScreen("room");
      }}
    />
  );
}
