CREATE TABLE "automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"categories" jsonb NOT NULL,
	"channel_ids" jsonb NOT NULL,
	"per_day" integer DEFAULT 1 NOT NULL,
	"mode" text DEFAULT 'review' NOT NULL,
	"post_times" jsonb NOT NULL,
	"orientation" text DEFAULT 'landscape' NOT NULL,
	"voice" text DEFAULT 'random' NOT NULL,
	"fallback_voice" text DEFAULT 'en-CA-Liam' NOT NULL,
	"music_mood" text DEFAULT 'auto' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_planned_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"title" text NOT NULL,
	"handle" text,
	"thumbnail_url" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expiry" timestamp with time zone,
	"subscriber_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channels_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "music_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"mood" text NOT NULL,
	"file_path" text NOT NULL,
	"source" text DEFAULT 'incompetech' NOT NULL,
	"attribution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "music_tracks_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thumbnail_fingerprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"video_id" integer,
	"grammar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "thumbnail_fingerprints_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text NOT NULL,
	"seed" text NOT NULL,
	"orientation" text DEFAULT 'landscape' NOT NULL,
	"duration_sec" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"stage" text DEFAULT 'queued',
	"composition" jsonb NOT NULL,
	"thumbnail_style" jsonb,
	"thumbnail_fingerprint" text,
	"video_path" text,
	"thumb_path" text,
	"music_track_id" integer,
	"voice" text,
	"channel_id" integer,
	"automation_id" integer,
	"mode" text DEFAULT 'review' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"youtube_video_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone
);
