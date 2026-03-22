import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === BRANCHES ===
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  qrCode: text("qr_code"), // Base64 QR code image
  isMainBranch: boolean("is_main_branch").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FLOORS ===
export const floors = pgTable("floors", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(), // "Ground Floor", "1st Floor", etc.
  floorNumber: integer("floor_number").notNull(),
});

// === RACKS ===
export const racks = pgTable("racks", {
  id: serial("id").primaryKey(),
  floorId: integer("floor_id").notNull(),
  name: text("name").notNull(), // "Rack 1", "Rack 2"
  category: text("category"), // Main category for this rack
});

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password"),
  role: text("role").default("customer"), // 'hq_admin' | 'branch_manager' | 'customer'
  branchId: integer("branch_id"), // null for HQ admin, assigned for branch managers
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ITEMS ===
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: real("price").notNull(),
  discount: integer("discount").default(0),
  rackId: integer("rack_id").notNull(),
  imageUrl: text("image_url").notNull(),
  stock: integer("stock").default(100),
});

// === SALES ===
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  userId: integer("user_id"),
  totalAmount: real("total_amount").notNull(),
  itemsCount: integer("items_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  itemId: integer("item_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtSale: real("price_at_sale").notNull(),
});

// === SCHEMAS ===
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true, qrCode: true });
export const insertFloorSchema = createInsertSchema(floors).omit({ id: true });
export const insertRackSchema = createInsertSchema(racks).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });

// === TYPES ===
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Floor = typeof floors.$inferSelect;
export type InsertFloor = z.infer<typeof insertFloorSchema>;
export type Rack = typeof racks.$inferSelect;
export type InsertRack = z.infer<typeof insertRackSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;

export type CreateSaleRequest = {
  branchId: number;
  userId?: number;
  items: { itemId: number; quantity: number }[];
};

export type SalesStats = {
  dailySales: { date: string; amount: number }[];
  topItems: { name: string; quantity: number; imageUrl: string }[];
  leastItems: { name: string; quantity: number; imageUrl: string }[];
  itemsSoldToday: number;
  lowStockItems: { name: string; stock: number }[];
};

// Extended types for frontend
export type FloorWithRacks = Floor & { racks: RackWithItems[] };
export type RackWithItems = Rack & { items: Item[] };
export type BranchWithFloors = Branch & { floors: FloorWithRacks[] };
