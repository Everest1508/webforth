import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const userRoles = sqliteTable("user_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  role: text("role", { enum: ["admin", "editor", "viewer"] }).notNull().default("viewer"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const drafts = sqliteTable("drafts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  publishedBranch: text("published_branch"),
  publishedUrl: text("published_url"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  draftId: text("draft_id"),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UserRole = typeof userRoles.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type Media = typeof media.$inferSelect;
