import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Item } from "@shared/schema";

interface CartItem extends Item {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Item) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        let newItems;
        if (existingItem) {
          newItems = currentItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          newItems = [...currentItems, { ...item, quantity: 1 }];
        }
        
        const total = newItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
        set({ items: newItems, total });
      },
      removeItem: (itemId) => {
        const newItems = get().items.filter((i) => i.id !== itemId);
        const total = newItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
        set({ items: newItems, total });
      },
      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) return;
        const newItems = get().items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        );
        const total = newItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
        set({ items: newItems, total });
      },
      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: "grocery-cart-storage",
    }
  )
);
