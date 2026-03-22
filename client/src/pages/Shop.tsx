import { useState } from "react";
import { useAuthStore, useBranch } from "@/hooks/use-auth";
import { ItemCard } from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Search, ChevronRight, Layers, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { FloorWithRacks, RackWithItems, Item } from "@shared/schema";

export default function Shop() {
  const { branch } = useAuthStore();
  const { data: branchData, isLoading } = useBranch(branch?.id || 1);
  const [search, setSearch] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);

  const floors: FloorWithRacks[] = branchData?.floors || [];
  const selectedFloor = floors.find(f => f.id === selectedFloorId);
  const selectedRack = selectedFloor?.racks.find(r => r.id === selectedRackId);

  const allItems: Item[] = floors.flatMap(f => f.racks.flatMap(r => r.items));
  const searchResults = search.trim() 
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleFloorClick = (floorId: number) => {
    setSelectedFloorId(floorId);
    setSelectedRackId(null);
    setSearch("");
  };

  const handleRackClick = (rackId: number) => {
    setSelectedRackId(rackId);
  };

  const handleBack = () => {
    if (selectedRackId) {
      setSelectedRackId(null);
    } else if (selectedFloorId) {
      setSelectedFloorId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">
              {branch?.name || "Welcome to the Store"}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {selectedFloorId && (
                <>
                  <Button variant="link" className="p-0 h-auto" onClick={() => { setSelectedFloorId(null); setSelectedRackId(null); }}>
                    Floors
                  </Button>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
              {selectedFloor && (
                <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedRackId(null)}>
                  {selectedFloor.name}
                </Button>
              )}
              {selectedRack && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>{selectedRack.name}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items across all floors..." 
              className="pl-10 h-11 rounded-xl bg-white border-border/50 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        {search.trim() ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results for "{search}"</h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((item) => {
                  // Find floor and rack for this item
                  let floorName = "";
                  let rackName = "";
                  
                  for (const floor of floors) {
                    for (const rack of floor.racks) {
                      if (rack.items.some(i => i.id === item.id)) {
                        floorName = floor.name;
                        rackName = rack.name;
                        break;
                      }
                    }
                    if (floorName) break;
                  }
                  
                  return (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      floorName={floorName}
                      rackName={rackName}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No items found matching your search.</p>
            )}
          </div>
        ) : !selectedFloorId ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Select a Floor
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {floors.map((floor) => (
                  <motion.div
                    key={floor.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleFloorClick(floor.id)}
                      data-testid={`button-floor-${floor.id}`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Layers className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{floor.name}</h3>
                        <p className="text-sm text-muted-foreground">{floor.racks.length} Racks</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedRackId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedFloor?.name} - Select a Rack</h2>
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                Back to Floors
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedFloor?.racks.map((rack) => (
                <motion.div
                  key={rack.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleRackClick(rack.id)}
                    data-testid={`button-rack-${rack.id}`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-accent/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold">{rack.name}</h3>
                      <Badge variant="secondary" className="mt-2">{rack.category}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{rack.items.length} items</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedRack?.name}</h2>
                <Badge variant="outline" className="mt-1">{selectedRack?.category}</Badge>
              </div>
              <Button variant="outline" onClick={handleBack} data-testid="button-back-to-racks">
                Back to Racks
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedRack?.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  layout
                >
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <ChatAssistant />
    </div>
  );
}
