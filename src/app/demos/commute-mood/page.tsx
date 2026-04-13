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

/* ─── Stable rotation helpers ─────────────────────────────────────── */

const LINE_ROTATIONS: Record<string, number> = {
  yellow: -1.5,
  red: 1.8,
  blue: -0.8,
  green: 2.1,
};

const MOOD_ROTATIONS: Record<string, number> = {
  "Dead Tired": -2.5,
  "Just Woke Up": 1.2,
  Stressed: -1.8,
  Chill: 2.8,
  "In the Zone": -0.5,
  "Good Day": 1.5,
};

/* ─── Select Screen ────────────────────────────────────────────────── */

function prewarmVibeImages() {
  for (const m of MOODS) {
    const dist = Object.fromEntries(MOODS.map((x) => [x.key, x.key === m.key ? 100 : 0]));
    fetch("/api/commute-mood/vibe-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: m.key, distribution: dist }),
    }).catch(() => {/* fire-and-forget */});
  }
}

function SelectScreen({
  onBoard,
}: {
  onBoard: (line: string, station: string, direction: string) => void;
}) {
  const [line, setLine] = useState("");
  const [station, setStation] = useState("");
  const [direction, setDirection] = useState("Inbound");

  // Kick off background image generation for all moods while user picks their train
  useEffect(() => { prewarmVibeImages(); }, []);

  const stations = line ? LINES[line].stations : [];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D1B2E" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-bold"
            style={{ fontFamily: "'Caveat', cursive", color: "#FFFFFF" }}
          >
            CommuteMood
          </h1>
          <p
            className="mt-3 text-lg"
            style={{ fontFamily: "'Caveat', cursive", color: "rgba(255,255,255,0.6)" }}
          >
            Join your train. Feel the vibe.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Line */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                style={{
                  border: "2px solid rgba(255,255,255,0.4)",
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "'Caveat', cursive",
                }}
              >
                1
              </span>
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Pick your line
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(LINES).map(([key, l]) => {
                const rotation = LINE_ROTATIONS[key] ?? 0;
                const isSelected = line === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setLine(key);
                      setStation("");
                    }}
                    className="relative text-left transition-transform hover:scale-105"
                    style={{
                      padding: "8px 8px 32px 8px",
                      background: "#FFFFFF",
                      borderRadius: "4px",
                      boxShadow: isSelected
                        ? `0 0 0 3px ${l.color}, 2px 4px 12px rgba(0,0,0,0.3)`
                        : "2px 4px 12px rgba(0,0,0,0.3)",
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    {/* Color-tinted photo area */}
                    <div
                      className="w-full h-20 rounded-sm flex items-center justify-center"
                      style={{ background: `${l.color}25` }}
                    >
                      <span
                        className="w-8 h-8 rounded-full"
                        style={{ background: l.color }}
                      />
                    </div>
                    {/* Polaroid label */}
                    <p
                      className="mt-2 text-center text-base font-bold"
                      style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                    >
                      {l.name} Line
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Station */}
          {line && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                  style={{
                    border: "2px solid rgba(255,255,255,0.4)",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'Caveat', cursive",
                  }}
                >
                  2
                </span>
                <span
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Where are you?
                </span>
              </div>
              <div
                className="relative"
                style={{
                  background: "#FFF9E6",
                  padding: "12px 16px",
                  borderRadius: "2px",
                  boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
                  transform: "rotate(-1deg)",
                }}
              >
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full text-sm focus:outline-none"
                  style={{
                    background: "transparent",
                    color: station ? "#1A1D23" : "#6B7280",
                    fontFamily: "'Caveat', cursive",
                    fontSize: "18px",
                    border: "none",
                  }}
                >
                  <option value="">pick a station...</option>
                  {stations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Direction */}
          {station && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                  style={{
                    border: "2px solid rgba(255,255,255,0.4)",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'Caveat', cursive",
                  }}
                >
                  3
                </span>
                <span
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Which way?
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Inbound", "Outbound"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className="rounded-sm px-3 py-2.5 text-base font-bold transition-colors"
                    style={{
                      fontFamily: "'Caveat', cursive",
                      background: direction === d ? "rgba(255,255,255,0.15)" : "transparent",
                      border: `2px solid ${direction === d ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}`,
                      color: direction === d ? "#FFFFFF" : "rgba(255,255,255,0.5)",
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
            className="w-full py-3.5 text-xl font-bold transition-all"
            style={{
              fontFamily: "'Caveat', cursive",
              background: line && station ? LINES[line].color : "rgba(255,255,255,0.1)",
              color: line && station ? "#FFFFFF" : "rgba(255,255,255,0.3)",
              cursor: line && station ? "pointer" : "not-allowed",
              borderRadius: "4px",
              transform: "rotate(-1.5deg)",
              boxShadow:
                line && station
                  ? `0 0 20px ${LINES[line].color}40, 0 0 40px ${LINES[line].color}20`
                  : "none",
              animation: line && station ? "ctaPulse 2s ease-in-out infinite" : "none",
            }}
          >
            Board Train
          </button>

          {/* Stats sticker */}
          <div className="flex justify-center">
            <div
              style={{
                background: "#FFE4E6",
                padding: "6px 16px",
                borderRadius: "2px",
                boxShadow: "1px 2px 6px rgba(0,0,0,0.15)",
                transform: "rotate(2.5deg)",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ fontFamily: "'Caveat', cursive", color: "#9F1239" }}
              >
                42 riders vibing right now
              </p>
            </div>
          </div>
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          An ephemeral mood-sharing experience for transit riders
        </p>
      </div>

      <style>{`
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 20px var(--pulse-color, rgba(255,255,255,0.2)), 0 0 40px var(--pulse-color, rgba(255,255,255,0.1)); }
          50% { box-shadow: 0 0 30px var(--pulse-color, rgba(255,255,255,0.4)), 0 0 60px var(--pulse-color, rgba(255,255,255,0.2)); }
        }
      `}</style>
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
        opacity: 0.7 + Math.random() * 0.3,
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
  const prefetchedImages = useRef<Map<MoodKey, string>>(new Map());

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

  // Prefetch all mood images into memory on mount (uses Supabase cache, ~100ms per mood after first generation)
  useEffect(() => {
    for (const m of MOODS) {
      const dist = Object.fromEntries(MOODS.map((x) => [x.key, x.key === m.key ? 100 : 0]));
      fetch("/api/commute-mood/vibe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: m.key, distribution: dist }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.imageUrl) prefetchedImages.current.set(m.key, data.imageUrl);
        })
        .catch(() => {/* ignore */});
    }
  }, []);

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
      setSimulatedRiders((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], mood };
        }
        return updated;
      });
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

    // Serve from in-memory prefetch if already resolved (instant)
    const prefetched = prefetchedImages.current.get(selectedMood);
    if (prefetched) {
      setVibeImageUrl(prefetched);
      return;
    }

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
    <div className="min-h-screen px-4 py-6" style={{ background: "#0D1B2E" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div
          className="p-5"
          style={{
            background: "#FFFFFF",
            padding: "8px 8px 28px 8px",
            borderRadius: "4px",
            boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
            transform: "rotate(-0.5deg)",
          }}
        >
          <div
            className="rounded-sm px-4 py-3"
            style={{ background: `${line.color}15` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: line.color }}
                />
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                  >
                    BART {line.name} &middot; {station} &rarr; {destination}
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: "'Caveat', cursive", color: "#6B7280" }}
                  >
                    Boarded at {boardTime.current} &middot; {username.current}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold"
                style={{
                  background: riderFlash ? "#FFE4E6" : "#FFF9E6",
                  borderRadius: "2px",
                  transform: "rotate(2deg)",
                  boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
                  fontFamily: "'Caveat', cursive",
                  fontSize: "14px",
                  color: riderFlash ? "#9F1239" : "#92400E",
                }}
              >
                {allRiders.length} riders
                {realRiders.length > 0 && (
                  <span style={{ color: "#2563EB" }}> ({realRiders.length + 1} live)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mood Picker */}
        <div>
          <p
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {selectedMood ? "Your mood" : "How are you feeling?"}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.key;
              const rotation = MOOD_ROTATIONS[m.key] ?? 0;
              return (
                <button
                  key={m.key}
                  onClick={() => handleSelectMood(m.key)}
                  className="flex flex-col items-center transition-transform hover:scale-105"
                  style={{
                    padding: "8px 8px 24px 8px",
                    background: "#FFFFFF",
                    borderRadius: "4px",
                    boxShadow: isSelected
                      ? `0 0 0 3px ${m.color}, 2px 4px 12px rgba(0,0,0,0.3)`
                      : "2px 4px 12px rgba(0,0,0,0.3)",
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <div
                    className="w-full h-12 rounded-sm flex items-center justify-center"
                    style={{ background: `${m.color}20` }}
                  >
                    <span className="text-2xl">{m.icon}</span>
                  </div>
                  <span
                    className="mt-1 text-xs font-bold leading-tight text-center"
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: "13px",
                      color: isSelected ? m.color : "#4B5563",
                    }}
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
            {/* Vibe Summary — sticky note */}
            <div className="flex justify-center">
              <div
                style={{
                  background: "#FFF9E6",
                  padding: "14px 24px",
                  borderRadius: "2px",
                  boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
                  transform: "rotate(1.5deg)",
                }}
              >
                <p
                  className="text-lg font-bold text-center"
                  style={{ fontFamily: "'Caveat', cursive", color: "#92400E" }}
                >
                  {getVibeSummary(distribution)}
                </p>
              </div>
            </div>

            {/* Mood Distribution */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "8px 8px 32px 8px",
                borderRadius: "4px",
                boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
                transform: "rotate(0.8deg)",
              }}
            >
              <div className="p-4">
                <p
                  className="text-base font-bold mb-4"
                  style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                >
                  Mood distribution
                </p>
                <div className="space-y-3">
                  {MOODS.map((m) => {
                    const pct = distribution[m.key];
                    return (
                      <div key={m.key} className="flex items-center gap-3">
                        <span className="text-sm w-5 text-center">{m.icon}</span>
                        <span
                          className="text-xs w-24 truncate"
                          style={{ fontFamily: "'Caveat', cursive", fontSize: "14px", color: "#6B7280" }}
                        >
                          {m.key}
                        </span>
                        <div
                          className="flex-1 h-4 overflow-hidden"
                          style={{ background: "#F3F4F6", borderRadius: "10px" }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${pct}%`,
                              background: m.color,
                              borderRadius: "10px",
                              transition: "width 700ms ease",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold w-8 text-right"
                          style={{ fontFamily: "'Caveat', cursive", fontSize: "14px", color: "#1A1D23" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "8px 8px 32px 8px",
                borderRadius: "4px",
                boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
                transform: "rotate(-0.6deg)",
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-base font-bold"
                    style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                  >
                    Chat
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: "'Caveat', cursive", color: "#9CA3AF" }}
                  >
                    Messages vanish when you leave
                  </p>
                </div>
                <div
                  className="overflow-y-auto space-y-2 mb-3"
                  style={{ maxHeight: "200px" }}
                >
                  {chatMessages.length === 0 && (
                    <div
                      className="py-4 text-center"
                      style={{
                        background: "#FFF9E6",
                        padding: "12px 16px",
                        borderRadius: "2px",
                        transform: "rotate(-0.5deg)",
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ fontFamily: "'Caveat', cursive", color: "#92400E" }}
                      >
                        No messages yet. Say something!
                      </p>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex gap-2 text-sm p-2"
                      style={{
                        background: "#FFF9E6",
                        borderRadius: "2px",
                        boxShadow: "1px 2px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      <span
                        className="font-bold shrink-0"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "15px", color: "#1A1D23" }}
                      >
                        {msg.username} {moodIconForKey(msg.mood)}
                      </span>
                      <span
                        style={{ fontFamily: "'Caveat', cursive", fontSize: "15px", color: "#374151" }}
                      >
                        {msg.text}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
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
                    className="flex-1 rounded-sm px-3 py-2 text-sm focus:outline-none"
                    style={{
                      border: "2px solid rgba(13,27,46,0.15)",
                      color: "#1A1D23",
                      background: "#FFF9E6",
                      fontFamily: "'Caveat', cursive",
                      fontSize: "16px",
                    }}
                    maxLength={200}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className="rounded-sm px-4 py-2 text-sm font-bold transition-colors"
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: "16px",
                      background: chatInput.trim() ? line.color : "#E5E7EB",
                      color: chatInput.trim() ? "#FFFFFF" : "#9CA3AF",
                      cursor: chatInput.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Mood Bubbles */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "8px 8px 32px 8px",
                borderRadius: "4px",
                boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
                transform: "rotate(0.4deg)",
              }}
            >
              <div className="p-4">
                <p
                  className="text-base font-bold mb-3"
                  style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                >
                  Riders on this train
                </p>
                <div
                  className="relative h-48 rounded-sm overflow-hidden"
                  style={{ background: `${line.color}10` }}
                >
                  {allRiders.slice(0, 40).map((r) => (
                    <MoodBubble key={r.id} rider={r} />
                  ))}
                </div>
              </div>
            </div>

            {/* AI Vibe Image */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "8px",
                paddingBottom: vibeImageUrl ? "32px" : "8px",
                borderRadius: "4px",
                boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
                transform: "rotate(-1.2deg)",
              }}
            >
              <div className="p-4 pb-0">
                <p
                  className="text-base font-bold mb-3"
                  style={{ fontFamily: "'Caveat', cursive", color: "#1A1D23" }}
                >
                  AI vibe check
                </p>
              </div>
              {vibeImageLoading && (
                <div className="flex flex-col items-center justify-center py-16 px-5">
                  <svg className="animate-spin h-6 w-6 mb-3" style={{ color: line.color }} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p
                    className="text-sm"
                    style={{ fontFamily: "'Caveat', cursive", color: "#6B7280" }}
                  >
                    Generating the vibe...
                  </p>
                </div>
              )}
              {vibeImageError && (
                <div className="px-5 pb-5">
                  <div
                    className="rounded-sm p-3 text-sm"
                    style={{
                      background: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      fontFamily: "'Caveat', cursive",
                    }}
                  >
                    {vibeImageError}
                  </div>
                </div>
              )}
              {vibeImageUrl && (
                <img
                  src={vibeImageUrl}
                  alt="AI-generated vibe image reflecting the collective mood"
                  className="w-full rounded-sm"
                  style={{ padding: "0 4px" }}
                />
              )}
            </div>
          </>
        )}

        {/* Station Ticker — film strip style */}
        <div
          style={{
            background: "#1A1A2E",
            padding: "16px",
            borderRadius: "4px",
            boxShadow: "2px 4px 12px rgba(0,0,0,0.3)",
            border: "3px solid #2A2A3E",
          }}
        >
          <p
            className="text-sm font-bold mb-3"
            style={{ fontFamily: "'Caveat', cursive", color: "rgba(255,255,255,0.5)" }}
          >
            Upcoming stops
          </p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {upcomingStations.map((s, i) => {
              const isPast = i < currentStopIdx;
              const isCurrent = i === currentStopIdx;
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  {i > 0 && (
                    <div
                      className="w-4 h-0.5"
                      style={{ background: isPast ? line.color : "rgba(255,255,255,0.15)" }}
                    />
                  )}
                  <div
                    className="flex flex-col items-center gap-1 px-3 py-2"
                    style={{
                      background: isCurrent
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                      borderRadius: "4px",
                      border: isCurrent ? `1px solid ${line.color}` : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full border-2 transition-colors"
                      style={{
                        borderColor: isPast || isCurrent ? line.color : "rgba(255,255,255,0.2)",
                        background: isPast ? line.color : isCurrent ? `${line.color}30` : "transparent",
                      }}
                    />
                    <span
                      className="text-[10px] font-medium whitespace-nowrap"
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: "13px",
                        color: isCurrent ? "#FFFFFF" : isPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
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
          className="w-full py-3 text-base font-bold transition-colors"
          style={{
            fontFamily: "'Caveat', cursive",
            background: "transparent",
            border: "2px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.4)",
            borderRadius: "4px",
            cursor: "pointer",
          }}
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
