CREATE TABLE `sponsor_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`sealed` text NOT NULL,
	`used_setup_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`refresh_lease` text,
	`lease_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sponsor_setup` (
	`state` text PRIMARY KEY NOT NULL,
	`cookie_hash` text NOT NULL,
	`setup_hash` text NOT NULL,
	`sealed_verifier` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sponsored_job` (
	`key` text PRIMARY KEY NOT NULL,
	`image_hash` text NOT NULL,
	`status` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`task_id` text,
	`progress` integer,
	`updated_at` integer NOT NULL
);
