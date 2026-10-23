import { boolean, date, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────
// MANAGER == PG Owner, TENANT == Renter (kept for migration compatibility).
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'TENANT']);
export const billingStatusEnum = pgEnum('billing_status', ['PAID', 'PENDING']);
export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const notificationChannelEnum = pgEnum('notification_channel', ['EMAIL', 'SMS', 'PUSH', 'IN_APP']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CHECKED_IN',
  'CHECKED_OUT',
]);

// ─── Users / Profiles ───────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── PG Properties ──────────────────────────────────────────────────
export const pgProperties = pgTable('pg_properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  city: text('city').notNull().default(''),
  state: text('state').notNull().default(''),
  pincode: text('pincode').notNull().default(''),
  amenities: jsonb('amenities').notNull().default([]),
  // Property photos stored as base64 data URLs (`data:image/jpeg;base64,...`).
  images: text('images').array().notNull().default([]),
  totalRooms: integer('total_rooms').notNull().default(0),
  occupiedRooms: integer('occupied_rooms').notNull().default(0),
  rentRangeMin: numeric('rent_range_min', { precision: 10, scale: 2 }),
  rentRangeMax: numeric('rent_range_max', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Rooms ───────────────────────────────────────────────────────────
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  pgId: uuid('pg_id')
    .notNull()
    .references(() => pgProperties.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  capacity: integer('capacity').notNull(),
  currentOccupancy: integer('current_occupancy').notNull().default(0),
  hasAc: boolean('has_ac').notNull().default(false),
  features: jsonb('features').notNull().default([]),
});

// ─── Tenants ─────────────────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  pgId: uuid('pg_id')
    .notNull()
    .references(() => pgProperties.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  rentStatus: text('rent_status').notNull(),
  lastPaymentDate: date('last_payment_date'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Bookings ────────────────────────────────────────────────────────
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  renterId: uuid('renter_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  pgId: uuid('pg_id')
    .notNull()
    .references(() => pgProperties.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  moveInDate: date('move_in_date').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Reviews ─────────────────────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  pgId: uuid('pg_id')
    .notNull()
    .references(() => pgProperties.id, { onDelete: 'cascade' }),
  renterId: uuid('renter_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Billing ─────────────────────────────────────────────────────────
export const billing = pgTable('billing', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  status: billingStatusEnum('status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  channel: notificationChannelEnum('channel').notNull().default('IN_APP'),
  targetRole: userRoleEnum('target_role'),
  targetUserId: uuid('target_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  isGlobal: boolean('is_global').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
});

// ─── Support Tickets ─────────────────────────────────────────────────
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').notNull().default('OPEN'),
  priority: ticketPriorityEnum('priority').notNull().default('MEDIUM'),
  raisedBy: uuid('raised_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  assignedTo: uuid('assigned_to').references(() => profiles.id, { onDelete: 'set null' }),
  pgId: uuid('pg_id').references(() => pgProperties.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// ─── System Settings ─────────────────────────────────────────────────
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
});
