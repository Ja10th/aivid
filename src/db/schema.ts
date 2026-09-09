import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  youtubeChannelId: text("youtube_channel_id").notNull().unique(),
  title: text("title").notNull(),
  handle: text("handle"),
  thumbnailUrl: text("thumbnail_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry", { withTimezone: true }),
  subscriberCount: integer("subscriber_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  channelIds: jsonb("channel_ids").$type<number[]>().notNull(),
  perDay: integer("per_day").notNull().default(1),
  mode: text("mode").notNull().default("review"), // review | auto
  postTimes: jsonb("post_times").$type<string[]>().notNull(), // "HH:MM" local
  orientation: text("orientation").notNull().default("landscape"), // landscape | portrait | mixed
  voice: text("voice").notNull().default("random"),
  fallbackVoice: text("fallback_voice").notNull().default("en-CA-Liam"),
  musicMood: text("music_mood").notNull().default("auto"),
  enabled: boolean("enabled").notNull().default(true),
  lastPlannedDate: text("last_planned_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  category: text("category").notNull(),
  seed: text("seed").notNull(),
  orientation: text("orientation").notNull().default("landscape"),
  durationSec: real("duration_sec").notNull().default(0),
  status: text("status").notNull().default("queued"), // queued | rendering | ready | scheduled | posting | posted | failed
  progress: integer("progress").notNull().default(0),
  stage: text("stage").default("queued"),
  composition: jsonb("composition").notNull(),
  thumbnailStyle: jsonb("thumbnail_style"),
  thumbnailFingerprint: text("thumbnail_fingerprint"),
  videoPath: text("video_path"),
  thumbPath: text("thumb_path"),
  musicTrackId: integer("music_track_id"),
  voice: text("voice"),
  channelId: integer("channel_id"),
  automationId: integer("automation_id"),
  mode: text("mode").notNull().default("review"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  youtubeVideoId: text("youtube_video_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
});

export const musicTracks = pgTable("music_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mood: text("mood").notNull(),
  filePath: text("file_path").notNull().unique(),
  source: text("source").notNull().default("incompetech"),
  attribution: text("attribution"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const thumbnailFingerprints = pgTable("thumbnail_fingerprints", {
  id: serial("id").primaryKey(),
  fingerprint: text("fingerprint").notNull().unique(),
  videoId: integer("video_id"),
  grammar: text("grammar"), // Track which grammar was used to prevent duplicates
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type Automation = typeof automations.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type MusicTrack = typeof musicTracks.$inferSelect;
