import { pgTable, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('EMPLOYEE'), // 'ADMIN' or 'EMPLOYEE'
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  nip: text('nip'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const attendances = pgTable('attendances', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  date: text('date').notNull(), // YYYY-MM-DD
  checkIn: timestamp('check_in').notNull(),
  checkOut: timestamp('check_out'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  checkInStart: text('check_in_start').notNull().default('07:00'),
  checkInEnd: text('check_in_end').notNull().default('09:00'),
  checkOutStart: text('check_out_start').notNull().default('16:00'),
  checkOutEnd: text('check_out_end').notNull().default('18:00'),
  updatedAt: timestamp('updated_at').notNull(),
});
