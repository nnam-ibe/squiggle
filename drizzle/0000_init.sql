CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport" text NOT NULL,
	"league_id" text NOT NULL,
	"season" text NOT NULL,
	"source_filename" text,
	"row_count" integer NOT NULL,
	"rounds_present" integer NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"uploader_ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"played_on" date NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"ip_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_ip_hash_window_start_pk" PRIMARY KEY("ip_hash","window_start")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_league_season_uq" ON "datasets" USING btree ("league_id","season");--> statement-breakpoint
CREATE INDEX "matches_dataset_idx" ON "matches" USING btree ("dataset_id","round");