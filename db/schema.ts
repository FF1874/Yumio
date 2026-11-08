import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sponsorAccount = sqliteTable('sponsor_account', {
  id: integer('id').primaryKey(),
  sealed: text('sealed').notNull(),
  usedSetupHash: text('used_setup_hash').notNull(),
  expiresAt: integer('expires_at').notNull(),
  refreshLease: text('refresh_lease'),
  leaseUntil: integer('lease_until').notNull().default(0),
});
export const sponsorSetup = sqliteTable('sponsor_setup', {
  state: text('state').primaryKey(),
  cookieHash: text('cookie_hash').notNull(),
  setupHash: text('setup_hash').notNull(),
  sealedVerifier: text('sealed_verifier').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const sponsoredJob = sqliteTable('sponsored_job', {
  key: text('key').primaryKey(),
  imageHash: text('image_hash').notNull(),
  status: text('status').notNull(),
  points: integer('points').notNull().default(0),
  taskId: text('task_id'),
  progress: integer('progress'),
  updatedAt: integer('updated_at').notNull(),
});
