import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === BRANCHES ===
  app.get(api.branches.list.path, async (req, res) => {
    const branches = await storage.getBranches();
    res.json(branches);
  });

  app.get(api.branches.get.path, async (req, res) => {
    const branch = await storage.getBranchWithDetails(Number(req.params.id));
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  });

  // Get staff for a branch (managers, sales staff, etc.)
  app.get('/api/branches/:id/staff', async (req, res) => {
    const branchId = Number(req.params.id);
    try {
      const staff = await storage.getUsersByBranch(branchId);
      // Filter out customers and HQ admins; show branch-specific staff
      const filtered = staff.filter(u => u.role !== 'customer' && u.role !== 'hq_admin');
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch branch staff' });
    }
  });

  app.get(api.branches.getByQr.path, async (req, res) => {
    // qrId is "BRANCH_<id>"
    const qrId = req.params.qrId as string;
    const branchId = parseInt(qrId.replace("BRANCH_", ""));
    const branch = await storage.getBranch(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  });

  app.post(api.branches.create.path, async (req, res) => {
    try {
      const input = api.branches.create.input.parse(req.body);
      const branch = await storage.createBranch(input);
      res.status(201).json(branch);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.branches.delete.path, async (req, res) => {
    await storage.deleteBranch(Number(req.params.id));
    res.status(204).send();
  });

  // === FLOORS ===
  app.get(api.floors.list.path, async (req, res) => {
    const floors = await storage.getFloorsByBranch(Number(req.params.branchId));
    res.json(floors);
  });

  app.post(api.floors.create.path, async (req, res) => {
    const floor = await storage.createFloor({
      branchId: Number(req.params.branchId),
      ...req.body
    });
    res.status(201).json(floor);
  });

  app.delete(api.floors.delete.path, async (req, res) => {
    await storage.deleteFloor(Number(req.params.id));
    res.status(204).send();
  });

  // === RACKS ===
  app.get(api.racks.list.path, async (req, res) => {
    const racks = await storage.getRacksByFloor(Number(req.params.floorId));
    res.json(racks);
  });

  app.post(api.racks.create.path, async (req, res) => {
    const rack = await storage.createRack({
      floorId: Number(req.params.floorId),
      ...req.body
    });
    res.status(201).json(rack);
  });

  app.delete(api.racks.delete.path, async (req, res) => {
    await storage.deleteRack(Number(req.params.id));
    res.status(204).send();
  });

  // === ITEMS ===
  app.get(api.items.list.path, async (req, res) => {
    const filters = {
      search: req.query.search as string,
      category: req.query.category as string,
      branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
      rackId: req.query.rackId ? Number(req.query.rackId) : undefined,
    };
    const items = await storage.getItems(filters);
    res.json(items);
  });

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.items.create.path, async (req, res) => {
    try {
      const input = api.items.create.input.parse(req.body);
      const item = await storage.createItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.items.update.path, async (req, res) => {
    try {
      const input = api.items.update.input.parse(req.body);
      const item = await storage.updateItem(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.items.delete.path, async (req, res) => {
    await storage.deleteItem(Number(req.params.id));
    res.status(204).send();
  });

  // === USERS / AUTH ===
  app.post(api.users.login.path, async (req, res) => {
    const { identifier, role, password, branchId } = req.body;
    
    // For manager/admin, verify password
    if (role === 'branch_manager' || role === 'hq_admin') {
      const user = await storage.getUserByUsername(identifier);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      return res.json(user);
    }
    
    // For customer, find or create
    let user = await storage.getUserByUsername(identifier);
    if (!user) {
      user = await storage.createUser({
        username: identifier,
        role: 'customer',
        name: identifier,
        phone: identifier,
        email: identifier.includes('@') ? identifier : undefined,
        branchId: branchId,
        password: undefined
      });
    }
    res.json(user);
  });

  app.post(api.users.createManager.path, async (req, res) => {
    const { username, password, branchId, name } = req.body;
    const user = await storage.createUser({
      username,
      password,
      branchId,
      role: 'branch_manager',
      name: name || username,
      email: undefined,
      phone: undefined
    });
    res.status(201).json(user);
  });

  // === SALES ===
  app.post(api.sales.create.path, async (req, res) => {
    const sale = await storage.createSale(req.body);
    res.status(201).json({ success: true, saleId: sale.id });
  });

  app.get(api.sales.stats.path, async (req, res) => {
    const stats = await storage.getSalesStats(Number(req.params.branchId));
    res.json(stats);
  });

  // === MANAGER STATS ===
  app.get("/api/manager/stats/:branchId", async (req, res) => {
    const branchId = Number(req.params.branchId);
    const stats = await storage.getManagerStats(branchId);
    res.json(stats);
  });

  app.get("/api/manager/regular-customers/:branchId", async (req, res) => {
    const branchId = Number(req.params.branchId);
    const customers = await storage.getRegularCustomers(branchId);
    res.json(customers);
  });

  // === FLOOR/RACK UPDATE ROUTES ===
  app.put("/api/floors/:id", async (req, res) => {
    const floor = await storage.updateFloor(Number(req.params.id), req.body);
    res.json(floor);
  });

  app.put("/api/racks/:id", async (req, res) => {
    const rack = await storage.updateRack(Number(req.params.id), req.body);
    res.json(rack);
  });

  // === AI CHATBOT ===
  app.post(api.chat.message.path, async (req, res) => {
    const { message, branchId } = req.body;
    console.log(`[CHAT] Received: message="${message}", branchId=${branchId}`);

    // Gather Context from this branch
    const allItems = await storage.getItemsByBranch(branchId);
    const branchData = await storage.getBranchWithDetails(branchId);
    
    let inventoryText = "";
    if (branchData) {
      for (const floor of branchData.floors) {
        inventoryText += `\n${floor.name}:\n`;
        for (const rack of floor.racks) {
          inventoryText += `  ${rack.name} (${rack.category || 'General'}):\n`;
          for (const item of rack.items) {
            const discountPrice = item.price * (1 - (item.discount || 0) / 100);
            inventoryText += `    - ${item.name}: ₹${item.price.toFixed(2)}`;
            if (item.discount && item.discount > 0) {
              inventoryText += ` (${item.discount}% off = ₹${discountPrice.toFixed(2)})`;
            }
            inventoryText += `\n`;
          }
        }
      }
    }

    const systemPrompt = `
You are a helpful AI assistant for "${branchData?.name || 'Smart Grocery Store'}".

STORE INVENTORY (Organized by Floor > Rack):
${inventoryText}

YOUR TASKS:
1. Answer questions about item locations (Floor, Rack).
2. Answer questions about prices and discounts.
3. When asked about discounts, list all items with discounts > 0%.
4. If a user asks for a recipe (e.g. "Cake", "Biryani"), list the ingredients available in the store, their prices, locations, and the total cost.
5. Be concise and friendly.
6. If an item is not in the inventory, say "Sorry, we don't have that item in stock."

User Question: ${message}
    `;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: systemPrompt }],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("AI Error:", error);
      
      // Fallback: Generate a smart response without AI
      const fallbackResponse = generateSmartResponse(message, branchData, allItems);
      console.log(`[CHAT] Fallback response (first 100 chars): ${fallbackResponse.substring(0, 100)}`);
      
      // Stream the response in chunks (by sentences/lines for better formatting)
      const lines = fallbackResponse.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${JSON.stringify({ content: line + '\n' })}\n\n`);
        }
      }
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  });

  // Enhanced smart response generator (improved location, price, discount and recipe handling)
  function generateSmartResponse(message: string, branchData: any, items: any[]) {
    const lowerMsg = message.toLowerCase();

    const findItemByName = (name: string) => {
      if (!name) return null;
      name = name.toLowerCase();
      return items.find((i: any) => i.name.toLowerCase() === name) || items.find((i: any) => i.name.toLowerCase().includes(name)) || null;
    };

    const locateItem = (itemId: number) => {
      for (const floor of branchData?.floors || []) {
        for (const rack of floor.racks || []) {
          if (rack.items?.some((it: any) => it.id === itemId)) {
            return { floor, rack };
          }
        }
      }
      return null;
    };

    const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

    // Recipe definitions (ingredient names should match store item names when possible)
    const recipes: Record<string, string[]> = {
      biryani: ['Basmati Rice', 'Garam Masala', 'Turmeric Powder', 'Chilli Powder', 'Onion', 'Tomato', 'Chicken', 'Salt'],
      pancake: ['Wheat Flour', 'Milk', 'Eggs (Dozen)', 'Sugar', 'Butter'],
      omelette: ['Eggs (Dozen)', 'Salt', 'Black Pepper', 'Onion', 'Tomato'],
      salad: ['Tomato', 'Cucumber', 'Lemon', 'Salt', 'Olive Oil'],
      cake: ['Wheat Flour', 'Sugar', 'Eggs (Dozen)', 'Butter'],
      'paneer curry': ['Paneer', 'Onion', 'Tomato', 'Garam Masala', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt', 'Coriander Powder'],
      'paneer tikka': ['Paneer', 'Yogurt', 'Garam Masala', 'Turmeric Powder', 'Chilli Powder', 'Lemon', 'Salt'],
      'butter chicken': ['Chicken', 'Butter', 'Tomato', 'Garam Masala', 'Turmeric Powder', 'Chilli Powder', 'Coriander Powder', 'Salt'],
      'chicken curry': ['Chicken', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Garam Masala', 'Coriander Powder', 'Coconut Oil', 'Salt'],
      'dal fry': ['Turmeric Powder', 'Salt', 'Chilli Powder', 'Cumin Seeds', 'Onion', 'Tomato', 'Coriander Powder', 'Coconut Oil'],
      'masala chai': ['Cardamom', 'Turmeric Powder'],
      'vegetable stir fry': ['Onion', 'Bell Pepper', 'Cauliflower', 'Cucumber', 'Salt', 'Sunflower Oil', 'Chilli Powder'],
      'fish curry': ['Fish', 'Coconut Oil', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coriander Powder', 'Salt'],
      'egg curry': ['Eggs (Dozen)', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coriander Powder', 'Coconut Oil', 'Salt'],
      'carrot curry': ['Carrot', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt', 'Coriander Powder'],
      'broccoli curry': ['Broccoli', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt'],
      'cauliflower curry': ['Cauliflower', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt'],
      'potato curry': ['Potato', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Salt', 'Coconut Oil'],
      'spinach curry': ['Spinach', 'Onion', 'Tomato', 'Turmeric Powder', 'Salt', 'Coconut Oil'],
      'cucumber curry': ['Cucumber', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt', 'Coriander Powder'],
      'cabbage curry': ['Cabbage', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt'],
      'tomato curry': ['Tomato', 'Onion', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt', 'Coriander Powder'],
      'bell pepper curry': ['Bell Pepper', 'Onion', 'Tomato', 'Turmeric Powder', 'Chilli Powder', 'Coconut Oil', 'Salt'],
      'egg fried rice': ['Eggs (Dozen)', 'Basmati Rice', 'Onion', 'Bell Pepper', 'Salt', 'Sunflower Oil', 'Chilli Powder'],
      'chicken fried rice': ['Chicken', 'Basmati Rice', 'Onion', 'Bell Pepper', 'Salt', 'Sunflower Oil', 'Chilli Powder'],
      'vegetable fried rice': ['Basmati Rice', 'Onion', 'Bell Pepper', 'Carrot', 'Salt', 'Sunflower Oil', 'Chilli Powder']
    };

    // First, handle simple "i want [product]" queries (like "i want banana", "i want tomato")
    if (lowerMsg.includes('i want') && !lowerMsg.includes('cook') && !lowerMsg.includes('make') && !lowerMsg.includes('recipe')) {
      // Extract the product name after "i want"
      const productPart = lowerMsg.split('i want')[1]?.trim() || '';
      if (productPart) {
        const found = items.find((i: any) => i.name.toLowerCase().includes(productPart));
        if (found) {
          const loc = locateItem(found.id);
          const floorName = loc?.floor?.name || `Floor ${loc?.floor?.floorNumber ?? 'Ground'}`;
          const discountedPrice = (found.price * (1 - (found.discount || 0) / 100)).toFixed(2);
          return `🛒 **${found.name}**\nCategory: ${found.category || 'General'}\nLocation: ${loc ? `${loc.rack.name} (${loc.rack.category}) on ${floorName}` : 'Location not recorded'}\nPrice: ${formatPrice(found.price)}${found.discount ? ` — ${found.discount}% off (Final: ${formatPrice(Number(discountedPrice))})` : ''}\n\nIn stock: ${found.stock || 'Available'}`;
        }
      }
    }

    // Recipe requests (including "i want to cook", "i want to make")
    if (
      lowerMsg.includes('recipe') ||
      lowerMsg.includes('how to make') ||
      lowerMsg.includes('how to cook') ||
      lowerMsg.includes('make') ||
      lowerMsg.includes('cook') ||
      (lowerMsg.includes('want to') && (lowerMsg.includes('cook') || lowerMsg.includes('make')))
    ) {
      // find known recipe by name included in the message
      let foundRecipe = null;
      let recipeKey = null;
      
      // Sort recipe keys by length (longest first) to match more specific recipes first
      const sortedRecipeKeys = Object.keys(recipes).sort((a, b) => b.length - a.length);
      
      for (const key of sortedRecipeKeys) {
        if (lowerMsg.includes(key)) {
          foundRecipe = recipes[key];
          recipeKey = key;
          break;
        }
      }

      if (foundRecipe && recipeKey) {
        const ingredients = foundRecipe;
        let response = `🍽️ **Recipe: ${recipeKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}**\n\nIngredients & where to find them:\n`;
        let total = 0;
        const missing: string[] = [];

        for (const ing of ingredients) {
          const found = findItemByName(ing);
          if (found) {
            const discount = found.discount || 0;
            const finalPrice = found.price * (1 - discount / 100);
            total += finalPrice;
            const loc = locateItem(found.id);
            const floorName = loc?.floor?.name || `Floor ${loc?.floor?.floorNumber ?? 'Ground'}`;
            response += `• **${found.name}** — ${formatPrice(found.price)}${discount ? ` (${discount}% off → ${formatPrice(finalPrice)})` : ''} — ${loc ? `${loc.rack.name} (${loc.rack.category}) on ${floorName}` : 'Location: Not listed'}\n`;
          } else {
            missing.push(ing);
          }
        }

        if (missing.length) {
          response += `\n⚠️ Missing from inventory: ${missing.join(', ')}\n`;
        }

        response += `\n🧾 **Estimated total (using discounted prices if available):** ${formatPrice(total)}`;
        return response;
      }
      
      // If no known recipe found, give a generic hint
      return `Which recipe would you like? Try "i want to cook cucumber curry", "egg fried rice", "carrot curry", "paneer curry", "chicken curry", or "biryani".`;
    }

    // Location / find queries
    if (lowerMsg.includes('where') || lowerMsg.includes('find') || lowerMsg.includes('location')) {
      // try to match any item name present in the sentence
      const found = items.find((i: any) => lowerMsg.includes(i.name.toLowerCase()));
      if (found) {
        const loc = locateItem(found.id);
        const floorName = loc?.floor?.name || `Floor ${loc?.floor?.floorNumber ?? 'Ground'}`;
        const discountedPrice = (found.price * (1 - (found.discount || 0) / 100)).toFixed(2);
        return `📍 **${found.name}**\nCategory: ${found.category || 'General'}\nLocation: ${loc ? `${loc.rack.name} (${loc.rack.category}) on ${floorName}` : 'Location not recorded'}\nPrice: ${formatPrice(found.price)}${found.discount ? ` — ${found.discount}% off (Final: ${formatPrice(Number(discountedPrice))})` : ''}`;
      }
      return `I can help you find products. Try \"Where is Kurkure?\" or use the exact product name.`;
    }

    // Discount / offers
    if (lowerMsg.includes('discount') || lowerMsg.includes('offer') || lowerMsg.includes('sale') || lowerMsg.includes('promo')) {
      const discountedItems = items.filter((i: any) => i.discount && i.discount > 0).sort((a: any, b: any) => b.discount - a.discount);
      if (discountedItems.length === 0) return `We don't have active discounts right now.`;
      let response = `🎉 **Current Discounts:**\n\n`;
      discountedItems.slice(0, 10).forEach((it: any) => {
        const finalP = (it.price * (1 - (it.discount || 0) / 100)).toFixed(2);
        response += `• ${it.name}: ${it.discount}% off — ${formatPrice(it.price)} → ${formatPrice(Number(finalP))}\n`;
      });
      return response;
    }

    // Price queries
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('how much')) {
      const found = items.find((i: any) => lowerMsg.includes(i.name.toLowerCase()));
      if (found) {
        const final = (found.price * (1 - (found.discount || 0) / 100)).toFixed(2);
        const loc = locateItem(found.id);
        return `💰 **${found.name}**\nRegular: ${formatPrice(found.price)}${found.discount ? `\nDiscount: ${found.discount}%\nFinal: ${formatPrice(Number(final))}` : ''}\n${loc ? `Location: ${loc.rack.name} (${loc.rack.category}) on ${loc.floor.name || `Floor ${loc.floor.floorNumber}`}` : 'Location: Not recorded'}`;
      }
      return `Which product price do you want to check? For example: \"What's the price of Dairy Milk?\"`;
    }

    // Store layout / floors
    if (lowerMsg.includes('floor') || lowerMsg.includes('section') || lowerMsg.includes('vegetables') || lowerMsg.includes('fruits') || lowerMsg.includes('dairy') || lowerMsg.includes('grocery')) {
      let floorResponse = `🏢 **Store Layout:**\n\n`;
      branchData.floors?.forEach((floor: any) => {
        const categories = Array.from(new Set(floor.racks?.map((r: any) => r.category).filter(Boolean) || []));
        floorResponse += `• ${floor.name || `Floor ${floor.floorNumber}`}: ${categories.join(', ')}\n`;
      });
      return floorResponse;
    }

    // Suggestions / popular
    if (lowerMsg.includes('suggest') || lowerMsg.includes('popular') || lowerMsg.includes('trending') || lowerMsg.includes('best')) {
      const topItems = items.slice().sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0)).slice(0, 6);
      let response = `⭐ **Recommendations:**\n\n`;
      topItems.forEach((it: any) => {
        const final = (it.price * (1 - (it.discount || 0) / 100)).toFixed(2);
        response += `• ${it.name} ${it.discount ? `— ${it.discount}% off (Now ${formatPrice(Number(final))})` : `— ${formatPrice(it.price)}`}\n`;
      });
      return response;
    }

    return `👋 Hi — I can help with product locations, prices, discounts, and recipes. Try: \n• \"Where is Kurkure?\" \n• \"What's the price of Dairy Milk?\" \n• \"Recipe for biryani\"`;
  }

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingBranches = await storage.getBranches();
  if (existingBranches.length > 0) return;

  console.log("Seeding database with multi-branch data...");
  
  // Create HQ Admin
  await storage.createUser({
    username: "admin",
    password: "admin123",
    role: "hq_admin",
    name: "HQ Administrator",
    branchId: undefined,
    email: "admin@grocery.com",
    phone: undefined
  });

  // Create Main Branch (HQ)
  const mainBranch = await storage.createBranch({
    name: "Main Store - Downtown",
    address: "123 Main Street, Downtown",
    isMainBranch: true
  });

  // Create Branch Manager for main branch
  await storage.createUser({
    username: "manager1",
    password: "manager123",
    role: "branch_manager",
    name: "John Manager",
    branchId: mainBranch.id,
    email: "manager1@grocery.com",
    phone: undefined
  });

  // Create another branch
  const branch2 = await storage.createBranch({
    name: "North Side Store",
    address: "456 North Avenue",
    isMainBranch: false
  });

  await storage.createUser({
    username: "manager2",
    password: "manager123",
    role: "branch_manager",
    name: "Jane Manager",
    branchId: branch2.id,
    email: "manager2@grocery.com",
    phone: undefined
  });

  // Create floors and racks for main branch
  const floorNames = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];
  const rackCategories = [
    ["Vegetables", "Fruits", "Spices", "Rice & Grains"],
    ["Snacks", "Chocolates", "Soft Drinks", "Milk Products"],
    ["Soaps", "Cosmetics", "Baby Care", "Cleaning"],
    ["Stationery", "Non-veg", "Oils", "Miscellaneous"]
  ];

  const sampleItems: Record<string, { name: string; price: number; image: string }[]> = {
    "Vegetables": [
      { name: "Tomato", price: 30, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcccf?w=400&h=400&fit=crop" },
      { name: "Potato", price: 20, image: "https://images.unsplash.com/photo-1590906352359-48dfb73a62c5?w=400&h=400&fit=crop" },
      { name: "Onion", price: 25, image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=400&fit=crop" },
      { name: "Carrot", price: 35, image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd0b744?w=400&h=400&fit=crop" },
      { name: "Cabbage", price: 15, image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&h=400&fit=crop" },
      { name: "Broccoli", price: 50, image: "https://images.unsplash.com/photo-1599599810066-9f7a7604d7c9?w=400&h=400&fit=crop" },
      { name: "Spinach", price: 28, image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd0b744?w=400&h=400&fit=crop" },
      { name: "Bell Pepper", price: 45, image: "https://images.unsplash.com/photo-1599599810066-9f7a7604d7c9?w=400&h=400&fit=crop" },
      { name: "Cauliflower", price: 40, image: "https://images.unsplash.com/photo-1597103442097-8ad5a71e0081?w=400&h=400&fit=crop" },
      { name: "Cucumber", price: 22, image: "https://images.unsplash.com/photo-1599599810066-9f7a7604d7c9?w=400&h=400&fit=crop" },
    ],
    "Fruits": [
      { name: "Apple", price: 80, image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop" },
      { name: "Banana", price: 40, image: "https://images.unsplash.com/photo-1587182923c0-7de97f28c9e3?w=400&h=400&fit=crop" },
      { name: "Orange", price: 60, image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop" },
      { name: "Mango", price: 100, image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop" },
      { name: "Grapes", price: 120, image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop" },
      { name: "Watermelon", price: 80, image: "https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=400&h=400&fit=crop" },
      { name: "Pineapple", price: 90, image: "https://images.unsplash.com/photo-1599599810489-66d7740cea4e?w=400&h=400&fit=crop" },
      { name: "Papaya", price: 50, image: "https://images.unsplash.com/photo-1590921591226-7a5b4d13aa6b?w=400&h=400&fit=crop" },
      { name: "Lemon", price: 35, image: "https://images.unsplash.com/photo-1535320903710-d993d3ecda32?w=400&h=400&fit=crop" },
      { name: "Guava", price: 55, image: "https://images.unsplash.com/photo-1585313647787-f6a96a1b0847?w=400&h=400&fit=crop" },
    ],
    "Spices": [
      { name: "Turmeric Powder", price: 200, image: "https://images.unsplash.com/photo-1615485500704-8e99099928b3?w=400&h=400&fit=crop" },
      { name: "Chilli Powder", price: 150, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
      { name: "Garam Masala", price: 250, image: "https://images.unsplash.com/photo-1585604158893-55f8ed62a98e?w=400&h=400&fit=crop" },
      { name: "Sugar", price: 40, image: "https://images.unsplash.com/photo-1585707572537-f80189da2d41?w=400&h=400&fit=crop" },
      { name: "Salt", price: 20, image: "https://images.unsplash.com/photo-1518110925495-5fe258dbcd25?w=400&h=400&fit=crop" },
      { name: "Cumin Seeds", price: 180, image: "https://images.unsplash.com/photo-1616110447266-f15e9b934b49?w=400&h=400&fit=crop" },
      { name: "Black Pepper", price: 220, image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd0b744?w=400&h=400&fit=crop" },
      { name: "Coriander Powder", price: 120, image: "https://images.unsplash.com/photo-1585604158893-55f8ed62a98e?w=400&h=400&fit=crop" },
      { name: "Cardamom", price: 400, image: "https://images.unsplash.com/photo-1596547609652-9cf5d8c76921?w=400&h=400&fit=crop" },
      { name: "Fenugreek", price: 180, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop" },
    ],
    "Rice & Grains": [
      { name: "Basmati Rice", price: 300, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
      { name: "Sona Masoori Rice", price: 250, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
      { name: "Wheat Flour", price: 60, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
      { name: "Oats", price: 120, image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=400&fit=crop" },
      { name: "Corn Flakes", price: 180, image: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400&h=400&fit=crop" },
      { name: "Brown Rice", price: 220, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
      { name: "Ragi Flour", price: 90, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
      { name: "Chickpea Flour", price: 110, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
      { name: "Millet", price: 150, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
      { name: "Semolina", price: 70, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
    ],
    "Snacks": [
      { name: "Lays Chips", price: 35, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
      { name: "Kurkure", price: 20, image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
      { name: "Pringles", price: 100, image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
      { name: "Biscuits", price: 50, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop" },
      { name: "Nachos", price: 60, image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop" },
      { name: "Cheetos", price: 30, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
      { name: "Mixed Nuts", price: 280, image: "https://images.unsplash.com/photo-1585518419759-8b0033bd8e77?w=400&h=400&fit=crop" },
      { name: "Popcorn", price: 40, image: "https://images.unsplash.com/photo-1585951237318-cf11c989c759?w=400&h=400&fit=crop" },
      { name: "Wafers", price: 55, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop" },
      { name: "Granola Bars", price: 80, image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
    ],
    "Chocolates": [
      { name: "Dairy Milk", price: 70, image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd0b744?w=400&h=400&fit=crop" },
      { name: "KitKat", price: 50, image: "https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop" },
      { name: "Munch", price: 15, image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop" },
      { name: "Snickers", price: 60, image: "https://images.unsplash.com/photo-1534260164206-2a3a4a72891d?w=400&h=400&fit=crop" },
      { name: "5 Star", price: 25, image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop" },
      { name: "Toblerone", price: 100, image: "https://images.unsplash.com/photo-1580822261290-991b38693d1b?w=400&h=400&fit=crop" },
      { name: "Cadbury Silk", price: 120, image: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop" },
      { name: "Ferrero Rocher", price: 150, image: "https://images.unsplash.com/photo-1579039802853-e05c24c8c4c4?w=400&h=400&fit=crop" },
      { name: "Bounty", price: 40, image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
      { name: "Mars Bar", price: 45, image: "https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&h=400&fit=crop" },
    ],
    "Soft Drinks": [
      { name: "Coca Cola", price: 50, image: "https://images.unsplash.com/photo-1554866585-c2db3811b558?w=400&h=400&fit=crop" },
      { name: "Sprite", price: 50, image: "https://images.unsplash.com/photo-1554118811-1e0d58224e24?w=400&h=400&fit=crop" },
      { name: "Pepsi", price: 50, image: "https://images.unsplash.com/photo-1554118811-1e0d58224e24?w=400&h=400&fit=crop" },
      { name: "Fanta", price: 50, image: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400&h=400&fit=crop" },
      { name: "Mountain Dew", price: 50, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop" },
      { name: "Thums Up", price: 50, image: "https://images.unsplash.com/photo-1554866585-c2db3811b558?w=400&h=400&fit=crop" },
      { name: "7UP", price: 50, image: "https://images.unsplash.com/photo-1554118811-1e0d58224e24?w=400&h=400&fit=crop" },
      { name: "Limca", price: 50, image: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400&h=400&fit=crop" },
      { name: "Orange Juice", price: 70, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop" },
      { name: "Apple Juice", price: 80, image: "https://images.unsplash.com/photo-1473093295203-cad00df16e50?w=400&h=400&fit=crop" },
    ],
    "Milk Products": [
      { name: "Fresh Milk", price: 50, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop" },
      { name: "Curd", price: 60, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop" },
      { name: "Butter", price: 400, image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop" },
      { name: "Cheese", price: 350, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop" },
      { name: "Paneer", price: 300, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop" },
      { name: "Ghee", price: 500, image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop" },
      { name: "Ice Cream", price: 120, image: "https://images.unsplash.com/photo-1563805042-7684c019e157?w=400&h=400&fit=crop" },
      { name: "Yogurt", price: 80, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop" },
      { name: "Condensed Milk", price: 150, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop" },
      { name: "Evaporated Milk", price: 130, image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop" },
    ],
    "Soaps": [
      { name: "Dove Soap", price: 60, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
      { name: "Lux Soap", price: 40, image: "https://images.unsplash.com/photo-1608079927245-0462a4e2c62a?w=400&h=400&fit=crop" },
      { name: "Dettol Soap", price: 50, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
      { name: "Lifebuoy Soap", price: 35, image: "https://images.unsplash.com/photo-1608079927245-0462a4e2c62a?w=400&h=400&fit=crop" },
      { name: "Pears Soap", price: 70, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
      { name: "Cinthol Soap", price: 45, image: "https://images.unsplash.com/photo-1608079927245-0462a4e2c62a?w=400&h=400&fit=crop" },
      { name: "Medimix Soap", price: 55, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
      { name: "Neem Soap", price: 50, image: "https://images.unsplash.com/photo-1608079927245-0462a4e2c62a?w=400&h=400&fit=crop" },
      { name: "Sandal Soap", price: 65, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
      { name: "Aloe Vera Soap", price: 55, image: "https://images.unsplash.com/photo-1608079927245-0462a4e2c62a?w=400&h=400&fit=crop" },
    ],
    "Cosmetics": [
      { name: "Shampoo", price: 150, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
      { name: "Conditioner", price: 180, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
      { name: "Face Cream", price: 350, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
      { name: "Body Lotion", price: 250, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop" },
      { name: "Sunscreen", price: 400, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
      { name: "Face Wash", price: 200, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
      { name: "Moisturizer", price: 320, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
      { name: "Deodorant", price: 280, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
      { name: "Hair Oil", price: 220, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
      { name: "Lip Balm", price: 100, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
    ],
    "Baby Care": [
      { name: "Baby Diapers", price: 600, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Powder", price: 150, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Oil", price: 200, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Wipes", price: 250, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Lotion", price: 280, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Soap", price: 180, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Shampoo", price: 220, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Feeding Bottle", price: 350, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Food", price: 200, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
      { name: "Baby Cereal", price: 180, image: "https://images.unsplash.com/photo-1584839404042-8bc02d40ac5e?w=400&h=400&fit=crop" },
    ],
    "Cleaning": [
      { name: "Floor Cleaner", price: 120, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Dish Soap", price: 80, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Toilet Cleaner", price: 100, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Glass Cleaner", price: 140, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Mop", price: 350, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Broom", price: 150, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Air Freshener", price: 200, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Detergent Powder", price: 250, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Bleach", price: 120, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
      { name: "Disinfectant", price: 180, image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&h=400&fit=crop" },
    ],
    "Stationery": [
      { name: "Notebook", price: 50, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop" },
      { name: "Pens Pack", price: 80, image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop" },
      { name: "Pencils Pack", price: 40, image: "https://images.unsplash.com/photo-1596073419667-9d77d59f033f?w=400&h=400&fit=crop" },
      { name: "Eraser", price: 15, image: "https://images.unsplash.com/photo-1596073419667-9d77d59f033f?w=400&h=400&fit=crop" },
      { name: "Ruler", price: 30, image: "https://images.unsplash.com/photo-1596073419667-9d77d59f033f?w=400&h=400&fit=crop" },
      { name: "Sticky Notes", price: 35, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop" },
      { name: "Pencil Box", price: 120, image: "https://images.unsplash.com/photo-1596073419667-9d77d59f033f?w=400&h=400&fit=crop" },
      { name: "School Bag", price: 800, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop" },
      { name: "Copy", price: 100, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop" },
      { name: "Highlighter Pen", price: 60, image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop" },
    ],
    "Non-veg": [
      { name: "Eggs (Dozen)", price: 100, image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop" },
      { name: "Chicken", price: 250, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop" },
      { name: "Fish", price: 300, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop" },
      { name: "Mutton", price: 450, image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&h=400&fit=crop" },
      { name: "Prawns", price: 500, image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop" },
      { name: "Chicken Breast", price: 280, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop" },
      { name: "Salmon Fish", price: 420, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop" },
      { name: "Shrimp", price: 550, image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop" },
      { name: "Turkey", price: 400, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop" },
      { name: "Duck", price: 380, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop" },
    ],
    "Oils": [
      { name: "Sunflower Oil", price: 200, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Groundnut Oil", price: 250, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Coconut Oil", price: 280, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Olive Oil", price: 600, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Mustard Oil", price: 180, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Vegetable Oil", price: 220, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Sesame Oil", price: 350, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Rice Bran Oil", price: 320, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Canola Oil", price: 200, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Soybean Oil", price: 210, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
    ],
    "Miscellaneous": [
      { name: "Tissue Paper", price: 40, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Garbage Bags", price: 60, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Aluminum Foil", price: 80, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Cling Wrap", price: 70, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Paper Cups", price: 50, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Plastic Containers", price: 90, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Matches Box", price: 15, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Candles", price: 120, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Lightbulb", price: 80, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
      { name: "Batteries", price: 150, image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
    ],
  };

  for (let branchIndex = 0; branchIndex < 2; branchIndex++) {
    const branchId = branchIndex === 0 ? mainBranch.id : branch2.id;
    
    for (let f = 0; f < floorNames.length; f++) {
      const floor = await storage.createFloor({
        branchId,
        name: floorNames[f],
        floorNumber: f
      });

      for (let r = 0; r < rackCategories[f].length; r++) {
        const category = rackCategories[f][r];
        const rack = await storage.createRack({
          floorId: floor.id,
          name: `Rack ${r + 1}`,
          category
        });

        const categoryItems = sampleItems[category] || [];
        for (const item of categoryItems) {
          const seed = encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, '-'));
          const stableImage = `https://picsum.photos/seed/${seed}/400/400`;
          await storage.createItem({
            name: item.name,
            description: `Fresh ${item.name}`,
            category,
            price: item.price,
            discount: Math.floor(Math.random() * 25), // Random discount 0-25%
            rackId: rack.id,
            imageUrl: stableImage,
            stock: 50 + Math.floor(Math.random() * 100)
          });
        }
      }
    }
  }

  console.log("Seeding complete!");
}
