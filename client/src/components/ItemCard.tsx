import { type Item } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface ItemCardProps {
  item: Item;
  floorName?: string;
  rackName?: string;
}

export function ItemCard({ item, floorName, rackName }: ItemCardProps) {
  const discountedPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
      data-testid={`item-card-${item.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {item.discount && item.discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg">
            -{item.discount}% OFF
          </Badge>
        )}
        {item.stock !== null && item.stock < 10 && (
          <Badge className="absolute top-3 right-3 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg">
            Low Stock
          </Badge>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-secondary line-clamp-1" data-testid={`text-item-name-${item.id}`}>
              {item.name}
            </h3>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mt-1">
              {item.category}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="block font-bold text-primary text-lg" data-testid={`text-price-${item.id}`}>
              ₹{discountedPrice.toFixed(2)}
            </span>
            {item.discount && item.discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {item.description || "Fresh and high quality product sourced directly from trusted suppliers."}
        </p>

        {(floorName || rackName) && (
          <div className="flex items-center gap-1 text-xs text-primary font-semibold mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {floorName} {floorName && rackName ? "→" : ""} {rackName}
            </span>
          </div>
        )}

        {item.stock !== null && (
          <p className="text-xs text-muted-foreground">
            In Stock: {item.stock} units
          </p>
        )}
      </div>
    </motion.div>
  );
}
