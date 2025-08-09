import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  voiceId: text("voice_id").notNull().unique(),
  phoneNumber: text("phone_number"),
  countryCode: text("country_code"),
  companyName: text("company_name"),
  jobTitle: text("job_title"),
  profileImage: text("profile_image"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  birthDate: text("birth_date"),
  bio: text("bio"),
  isOnline: boolean("is_online").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: text("caller_id").notNull().references(() => users.id),
  recipientId: text("recipient_id").notNull().references(() => users.id),
  status: text("status").notNull(), // 'calling', 'ringing', 'connected', 'ended', 'missed'
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: text("duration"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  voiceId: true,
  isOnline: true,
  createdAt: true,
}).extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  voiceId: true,
  username: true,
  isOnline: true,
  createdAt: true,
}).partial();

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  startTime: true,
  endTime: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
