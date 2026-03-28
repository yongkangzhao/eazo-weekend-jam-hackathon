import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Rooms: one per train ride, auto-expires after 2 hours */
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  line: text("line").notNull(),
  station: text("station").notNull(),
  direction: text("direction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true })
    .default(sql`now() + interval '2 hours'`)
    .notNull(),
});

/** Moods: one per user per room */
export const moods = pgTable("moods", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .references(() => rooms.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  mood: text("mood").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Messages: ephemeral chat scoped to a room */
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .references(() => rooms.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
