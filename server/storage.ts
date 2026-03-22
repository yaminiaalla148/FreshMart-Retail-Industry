import { db } from "./db";
import {
  users, items, sales, saleItems, branches, floors, racks,
  type User, type InsertUser,
  type Item, type InsertItem,
  type Branch, type InsertBranch,
  type Floor, type InsertFloor,
  type Rack, type InsertRack,
  type Sale, type CreateSaleRequest,
  type SalesStats, type FloorWithRacks, type RackWithItems, type BranchWithFloors
} from "@shared/schema";
import { eq, like, desc, sql, and, inArray } from "drizzle-orm";
import QRCode from "qrcode";

export interface IStorage {
  // Branches
  getBranch(id: number): Promise<Branch | undefined>;
  getBranchWithDetails(id: number): Promise<BranchWithFloors | undefined>;
  getBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;

  // Floors
  getFloor(id: number): Promise<Floor | undefined>;
  getFloorsByBranch(branchId: number): Promise<FloorWithRacks[]>;
  createFloor(floor: InsertFloor): Promise<Floor>;
  deleteFloor(id: number): Promise<void>;

  // Racks
  getRack(id: number): Promise<Rack | undefined>;
  getRacksByFloor(floorId: number): Promise<RackWithItems[]>;
  createRack(rack: InsertRack): Promise<Rack>;
  deleteRack(id: number): Promise<void>;

  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Items
  getItem(id: number): Promise<Item | undefined>;
  getItems(filters?: { search?: string; category?: string; branchId?: number; rackId?: number }): Promise<Item[]>;
  getItemsByBranch(branchId: number): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item>;
  deleteItem(id: number): Promise<void>;
  
  // Sales
  createSale(sale: CreateSaleRequest): Promise<Sale>;
  getSalesStats(branchId: number): Promise<SalesStats>;
  
  // Manager Stats
  getManagerStats(branchId: number): Promise<any>;
  getRegularCustomers(branchId: number): Promise<any[]>;
  updateFloor(id: number, data: Partial<InsertFloor>): Promise<Floor>;
  updateRack(id: number, data: Partial<InsertRack>): Promise<Rack>;
  getUsersByBranch(branchId: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // === BRANCHES ===
  async getBranch(id: number): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getBranchWithDetails(id: number): Promise<BranchWithFloors | undefined> {
    const branch = await this.getBranch(id);
    if (!branch) return undefined;
    
    const floorsList = await this.getFloorsByBranch(id);
    return { ...branch, floors: floorsList };
  }

  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.id);
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(insertBranch).returning();
    
    // Generate QR code with a scannable URL that directs to the QR scanner
    const qrData = `BRANCH_${branch.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 256 });
    
    // Update branch with QR code
    const [updated] = await db.update(branches)
      .set({ qrCode: qrCodeDataUrl })
      .where(eq(branches.id, branch.id))
      .returning();
    
    return updated;
  }

  async deleteBranch(id: number): Promise<void> {
    // Delete related data first (floors, racks, items)
    const branchFloors = await db.select().from(floors).where(eq(floors.branchId, id));
    for (const floor of branchFloors) {
      await this.deleteFloor(floor.id);
    }
    await db.delete(branches).where(eq(branches.id, id));
  }

  // === FLOORS ===
  async getFloor(id: number): Promise<Floor | undefined> {
    const [floor] = await db.select().from(floors).where(eq(floors.id, id));
    return floor;
  }

  async getFloorsByBranch(branchId: number): Promise<FloorWithRacks[]> {
    const floorsList = await db.select().from(floors)
      .where(eq(floors.branchId, branchId))
      .orderBy(floors.floorNumber);
    
    const result: FloorWithRacks[] = [];
    for (const floor of floorsList) {
      const racksWithItems = await this.getRacksByFloor(floor.id);
      result.push({ ...floor, racks: racksWithItems });
    }
    return result;
  }

  async createFloor(insertFloor: InsertFloor): Promise<Floor> {
    const [floor] = await db.insert(floors).values(insertFloor).returning();
    return floor;
  }

  async deleteFloor(id: number): Promise<void> {
    // Delete racks and items first
    const floorRacks = await db.select().from(racks).where(eq(racks.floorId, id));
    for (const rack of floorRacks) {
      await this.deleteRack(rack.id);
    }
    await db.delete(floors).where(eq(floors.id, id));
  }

  // === RACKS ===
  async getRack(id: number): Promise<Rack | undefined> {
    const [rack] = await db.select().from(racks).where(eq(racks.id, id));
    return rack;
  }

  async getRacksByFloor(floorId: number): Promise<RackWithItems[]> {
    const racksList = await db.select().from(racks).where(eq(racks.floorId, floorId));
    
    const result: RackWithItems[] = [];
    for (const rack of racksList) {
      const rackItems = await db.select().from(items).where(eq(items.rackId, rack.id));
      result.push({ ...rack, items: rackItems });
    }
    return result;
  }

  async createRack(insertRack: InsertRack): Promise<Rack> {
    const [rack] = await db.insert(racks).values(insertRack).returning();
    return rack;
  }

  async deleteRack(id: number): Promise<void> {
    await db.delete(items).where(eq(items.rackId, id));
    await db.delete(racks).where(eq(racks.id, id));
  }

  // === USERS ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByBranch(branchId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.branchId, branchId));
  }

  // === ITEMS ===
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItems(filters?: { search?: string; category?: string; branchId?: number; rackId?: number }): Promise<Item[]> {
    if (filters?.rackId) {
      return await db.select().from(items).where(eq(items.rackId, filters.rackId));
    }
    
    if (filters?.branchId) {
      return await this.getItemsByBranch(filters.branchId);
    }

    let query = db.select().from(items);
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(like(items.name, `%${filters.search}%`));
    }
    if (filters?.category && filters.category !== 'all') {
      conditions.push(eq(items.category, filters.category));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getItemsByBranch(branchId: number): Promise<Item[]> {
    // Get all floors for this branch
    const branchFloors = await db.select().from(floors).where(eq(floors.branchId, branchId));
    if (branchFloors.length === 0) return [];
    
    // Get all racks for these floors
    const floorIds = branchFloors.map(f => f.id);
    const branchRacks = await db.select().from(racks).where(inArray(racks.floorId, floorIds));
    if (branchRacks.length === 0) return [];
    
    // Get all items for these racks
    const rackIds = branchRacks.map(r => r.id);
    return await db.select().from(items).where(inArray(items.rackId, rackIds));
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async updateItem(id: number, updates: Partial<InsertItem>): Promise<Item> {
    const [item] = await db.update(items).set(updates).where(eq(items.id, id)).returning();
    return item;
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  // === SALES ===
  async createSale(request: CreateSaleRequest): Promise<Sale> {
    let total = 0;
    const saleItemsData = [];
    
    for (const reqItem of request.items) {
      const item = await this.getItem(reqItem.itemId);
      if (item) {
        const price = item.price * (1 - (item.discount || 0) / 100);
        total += price * reqItem.quantity;
        saleItemsData.push({
          itemId: item.id,
          quantity: reqItem.quantity,
          priceAtSale: price
        });
        
        await this.updateItem(item.id, { stock: (item.stock || 0) - reqItem.quantity });
      }
    }

    const [sale] = await db.insert(sales).values({
      branchId: request.branchId,
      userId: request.userId || null,
      totalAmount: total,
      itemsCount: request.items.length
    }).returning();

    for (const data of saleItemsData) {
      await db.insert(saleItems).values({ saleId: sale.id, ...data });
    }

    return sale;
  }

  async getSalesStats(branchId: number): Promise<SalesStats> {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Get all items for this branch
    const branchItems = await this.getItemsByBranch(branchId);
    const branchItemIds = branchItems.map(i => i.id);

    // Today's sales count
    const todaySales = await db.select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(and(
        eq(sales.branchId, branchId),
        sql`${sales.createdAt} >= ${today.toISOString()}`
      ));

    // Top selling items
    const topItems = branchItemIds.length > 0 
      ? await db.select({
          name: items.name,
          quantity: sql<number>`COALESCE(sum(${saleItems.quantity}), 0)`,
          imageUrl: items.imageUrl
        })
        .from(items)
        .leftJoin(saleItems, eq(saleItems.itemId, items.id))
        .where(inArray(items.id, branchItemIds))
        .groupBy(items.id, items.name, items.imageUrl)
        .orderBy(desc(sql`COALESCE(sum(${saleItems.quantity}), 0)`))
        .limit(5)
      : [];

    // Least selling items (with at least 1 sale)
    const leastItems = branchItemIds.length > 0
      ? await db.select({
          name: items.name,
          quantity: sql<number>`COALESCE(sum(${saleItems.quantity}), 0)`,
          imageUrl: items.imageUrl
        })
        .from(items)
        .leftJoin(saleItems, eq(saleItems.itemId, items.id))
        .where(inArray(items.id, branchItemIds))
        .groupBy(items.id, items.name, items.imageUrl)
        .orderBy(sql`COALESCE(sum(${saleItems.quantity}), 0)`)
        .limit(5)
      : [];

    // Daily sales (last 7 days)
    const dailySales = await db.select({
      date: sql<string>`to_char(${sales.createdAt}, 'YYYY-MM-DD')`,
      amount: sql<number>`sum(${sales.totalAmount})`
    })
    .from(sales)
    .where(eq(sales.branchId, branchId))
    .groupBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
    .limit(7);

    // Low stock items
    const lowStockItems = branchItems
      .filter(i => (i.stock || 0) < 20)
      .map(i => ({ name: i.name, stock: i.stock || 0 }));

    return {
      dailySales: dailySales.map(d => ({ date: d.date, amount: Number(d.amount) })),
      topItems: topItems.map(t => ({ name: t.name, quantity: Number(t.quantity), imageUrl: t.imageUrl })),
      leastItems: leastItems.map(t => ({ name: t.name, quantity: Number(t.quantity), imageUrl: t.imageUrl })),
      itemsSoldToday: Number(todaySales[0]?.count || 0),
      lowStockItems
    };
  }

  // === MANAGER STATS ===
  async getManagerStats(branchId: number): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all branch items
    const branchItems = await this.getItemsByBranch(branchId);
    const branchItemIds = branchItems.map(i => i.id);

    // Today's sales
    const todaySalesData = await db.select()
      .from(sales)
      .where(and(
        eq(sales.branchId, branchId),
        sql`${sales.createdAt} >= ${today.toISOString()}`
      ));

    // Get customer details from today's sales
    const todayCustomers: any[] = [];
    const userIds = Array.from(new Set(todaySalesData.filter(s => s.userId).map(s => s.userId!)));
    
    for (const userId of userIds) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user) {
        const userSales = todaySalesData.filter(s => s.userId === userId);
        let purchases: any[] = [];
        let totalSpent = 0;
        
        for (const sale of userSales) {
          const saleItemsList = await db.select({
            itemId: saleItems.itemId,
            quantity: saleItems.quantity,
            priceAtSale: saleItems.priceAtSale
          })
          .from(saleItems)
          .where(eq(saleItems.saleId, sale.id));
          
          for (const si of saleItemsList) {
            const [item] = await db.select().from(items).where(eq(items.id, si.itemId));
            if (item) {
              const total = Number(si.priceAtSale) * si.quantity;
              totalSpent += total;
              purchases.push({
                name: item.name,
                quantity: si.quantity,
                price: Number(si.priceAtSale),
                total
              });
            }
          }
        }
        
        todayCustomers.push({
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          purchases,
          totalSpent
        });
      }
    }

    // Sold items today with quantities
    const soldItemsToday: any[] = [];
    if (todaySalesData.length > 0) {
      const saleIds = todaySalesData.map(s => s.id);
      const allSaleItems = await db.select()
        .from(saleItems)
        .where(inArray(saleItems.saleId, saleIds));
      
      const itemQuantities: Record<number, number> = {};
      for (const si of allSaleItems) {
        itemQuantities[si.itemId] = (itemQuantities[si.itemId] || 0) + si.quantity;
      }
      
      for (const [itemId, quantity] of Object.entries(itemQuantities)) {
        const [item] = await db.select().from(items).where(eq(items.id, Number(itemId)));
        if (item) {
          soldItemsToday.push({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity
          });
        }
      }
    }

    // Low stock items (below 10 units)
    const lowStockItems = branchItems
      .filter(i => (i.stock || 0) < 10)
      .map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        stock: i.stock || 0
      }));

    // Today's revenue
    const todayRevenue = todaySalesData.reduce((sum, s) => sum + Number(s.totalAmount), 0);

    // Top products (overall)
    const topProducts = branchItemIds.length > 0 
      ? await db.select({
          name: items.name,
          quantity: sql<number>`COALESCE(sum(${saleItems.quantity}), 0)`
        })
        .from(items)
        .leftJoin(saleItems, eq(saleItems.itemId, items.id))
        .where(inArray(items.id, branchItemIds))
        .groupBy(items.id, items.name)
        .orderBy(desc(sql`COALESCE(sum(${saleItems.quantity}), 0)`))
        .limit(10)
      : [];

    // Least products
    const leastProducts = branchItemIds.length > 0
      ? await db.select({
          id: items.id,
          name: items.name,
          quantity: sql<number>`COALESCE(sum(${saleItems.quantity}), 0)`
        })
        .from(items)
        .leftJoin(saleItems, eq(saleItems.itemId, items.id))
        .where(inArray(items.id, branchItemIds))
        .groupBy(items.id, items.name)
        .orderBy(sql`COALESCE(sum(${saleItems.quantity}), 0)`)
        .limit(10)
      : [];

    return {
      todayCustomers,
      soldItemsToday,
      lowStockItems,
      todayRevenue,
      topProducts: topProducts.map(p => ({ name: p.name, quantity: Number(p.quantity) })),
      leastProducts: leastProducts.map(p => ({ id: p.id, name: p.name, quantity: Number(p.quantity) }))
    };
  }

  async getRegularCustomers(branchId: number): Promise<any[]> {
    // Get all sales for this branch grouped by user
    const userSalesData = await db.select({
      userId: sales.userId,
      visitCount: sql<number>`count(*)`,
      totalSpent: sql<number>`sum(${sales.totalAmount})`
    })
    .from(sales)
    .where(and(
      eq(sales.branchId, branchId),
      sql`${sales.userId} IS NOT NULL`
    ))
    .groupBy(sales.userId)
    .having(sql`count(*) >= 2`) // Regular = 2+ visits
    .orderBy(desc(sql`sum(${sales.totalAmount})`));

    const regularCustomers: any[] = [];
    
    for (const userData of userSalesData) {
      if (!userData.userId) continue;
      
      const [user] = await db.select().from(users).where(eq(users.id, userData.userId));
      if (!user) continue;
      
      // Get items purchased
      const userSales = await db.select().from(sales)
        .where(and(eq(sales.branchId, branchId), eq(sales.userId, userData.userId)));
      
      const itemsPurchased: Record<number, { name: string; quantity: number }> = {};
      
      for (const sale of userSales) {
        const saleItemsList = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
        
        for (const si of saleItemsList) {
          const [item] = await db.select().from(items).where(eq(items.id, si.itemId));
          if (item) {
            if (!itemsPurchased[item.id]) {
              itemsPurchased[item.id] = { name: item.name, quantity: 0 };
            }
            itemsPurchased[item.id].quantity += si.quantity;
          }
        }
      }
      
      regularCustomers.push({
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        visitCount: Number(userData.visitCount),
        totalSpent: Number(userData.totalSpent),
        items: Object.values(itemsPurchased)
      });
    }
    
    return regularCustomers;
  }

  async updateFloor(id: number, data: Partial<InsertFloor>): Promise<Floor> {
    const [floor] = await db.update(floors).set(data).where(eq(floors.id, id)).returning();
    return floor;
  }

  async updateRack(id: number, data: Partial<InsertRack>): Promise<Rack> {
    const [rack] = await db.update(racks).set(data).where(eq(racks.id, id)).returning();
    return rack;
  }
}

export const storage = new DatabaseStorage();
