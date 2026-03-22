import { useState } from "react";
import { useAuthStore } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ShoppingBag, AlertTriangle, IndianRupee, Eye, ChevronRight, Plus, Pencil, Trash2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ManagerDashboard() {
  const { user, logout } = useAuthStore();
  const branchId = user?.branchId || 1;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Branch Manager Portal</h1>
            <p className="text-sm text-muted-foreground">{user?.name || user?.username}</p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab branchId={branchId} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab branchId={branchId} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab branchId={branchId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ branchId }: { branchId: number }) {
  const [showCustomers, setShowCustomers] = useState(false);
  const [showSoldItems, setShowSoldItems] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/manager/stats", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/stats/${branchId}`);
      return res.json();
    },
  });

  const todayCustomers = stats?.todayCustomers || [];
  const soldItems = stats?.soldItemsToday || [];
  const lowStockItems = stats?.lowStockItems || [];
  const todayRevenue = stats?.todayRevenue || 0;
  const topProducts = stats?.topProducts || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setShowCustomers(true)} data-testid="card-today-customers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Today's Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setShowSoldItems(true)} data-testid="card-sold-items">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Sold Items Today</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldItems.reduce((acc: number, i: any) => acc + i.quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setShowLowStock(true)} data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Stock below 10 units</p>
          </CardContent>
        </Card>

        <Card data-testid="card-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Highly Sold Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {item.stock} left
                  </Badge>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <p className="text-muted-foreground text-center py-4">All items are well stocked!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Least Sold Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.leastProducts?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary">{item.quantity} sold</Badge>
                </div>
              ))}
              {(!stats?.leastProducts || stats.leastProducts.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No sales data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCustomers} onOpenChange={setShowCustomers}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Today's Customers</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name || customer.username}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedCustomer(customer)} data-testid={`button-view-bill-${customer.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Bill for {selectedCustomer?.name || selectedCustomer?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1">
            {selectedCustomer?.purchases?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold">₹{item.total.toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{selectedCustomer?.totalSpent?.toFixed(2) || 0}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSoldItems} onOpenChange={setShowSoldItems}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Items Sold Today</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLowStock} onOpenChange={setShowLowStock}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Low Stock Items (Below 10 units)</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{item.stock}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersTab({ branchId }: { branchId: number }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: regularCustomers } = useQuery({
    queryKey: ["/api/manager/regular-customers", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/manager/regular-customers/${branchId}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regular Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularCustomers?.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name || customer.username}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.visitCount}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedCustomer(customer)} data-testid={`button-view-customer-${customer.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name || selectedCustomer?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedCustomer?.totalSpent?.toLocaleString() || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold">{selectedCustomer?.visitCount || 0}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Items Purchased</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedCustomer?.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InventoryTab({ branchId }: { branchId: number }) {
  const queryClient = useQueryClient();
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);
  const [editingFloor, setEditingFloor] = useState<any>(null);
  const [editingRack, setEditingRack] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [isAddingRack, setIsAddingRack] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ["/api/branches", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}`);
      return res.json();
    },
  });

  const floors = branchData?.floors || [];
  const selectedFloor = floors.find((f: any) => f.id === selectedFloorId);
  const selectedRack = selectedFloor?.racks?.find((r: any) => r.id === selectedRackId);

  const deleteFloor = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/floors/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] }),
  });

  const deleteRack = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/racks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Floors</CardTitle>
          <Button size="sm" onClick={() => setIsAddingFloor(true)} data-testid="button-add-floor">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {floors.map((floor: any) => (
              <div 
                key={floor.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedFloorId === floor.id ? "bg-primary/10 border border-primary/30" : "bg-slate-50 hover:bg-slate-100"}`}
                onClick={() => { setSelectedFloorId(floor.id); setSelectedRackId(null); }}
              >
                <span className="font-medium">{floor.name}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingFloor(floor); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if(confirm("Delete this floor?")) deleteFloor.mutate(floor.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Racks {selectedFloor ? `- ${selectedFloor.name}` : ""}</CardTitle>
          {selectedFloorId && (
            <Button size="sm" onClick={() => setIsAddingRack(true)} data-testid="button-add-rack">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {selectedFloorId ? (
            <div className="space-y-2">
              {selectedFloor?.racks?.map((rack: any) => (
                <div 
                  key={rack.id} 
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedRackId === rack.id ? "bg-primary/10 border border-primary/30" : "bg-slate-50 hover:bg-slate-100"}`}
                  onClick={() => setSelectedRackId(rack.id)}
                >
                  <div>
                    <span className="font-medium">{rack.name}</span>
                    <Badge variant="secondary" className="ml-2">{rack.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingRack(rack); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if(confirm("Delete this rack?")) deleteRack.mutate(rack.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Select a floor to view racks</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Items {selectedRack ? `- ${selectedRack.name}` : ""}</CardTitle>
          {selectedRackId && (
            <Button size="sm" onClick={() => setIsAddingItem(true)} data-testid="button-add-item">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {selectedRackId ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {selectedRack?.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price} | Stock: {item.stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingItem(item)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if(confirm("Delete this item?")) deleteItem.mutate(item.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Select a rack to view items</p>
          )}
        </CardContent>
      </Card>

      <FloorDialog 
        open={isAddingFloor || !!editingFloor} 
        onClose={() => { setIsAddingFloor(false); setEditingFloor(null); }} 
        floor={editingFloor}
        branchId={branchId}
        floorCount={floors.length}
      />

      <RackDialog 
        open={isAddingRack || !!editingRack} 
        onClose={() => { setIsAddingRack(false); setEditingRack(null); }} 
        rack={editingRack}
        floorId={selectedFloorId!}
      />

      <ItemDialog 
        open={isAddingItem || !!editingItem} 
        onClose={() => { setIsAddingItem(false); setEditingItem(null); }} 
        item={editingItem}
        rackId={selectedRackId!}
        category={selectedRack?.category}
      />
    </div>
  );
}

function FloorDialog({ open, onClose, floor, branchId, floorCount }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(floor?.name || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (floor) {
        await fetch(`/api/floors/${floor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      } else {
        await fetch(`/api/branches/${branchId}/floors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, floorNumber: floorCount }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches", branchId] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{floor ? "Edit Floor" : "Add Floor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Floor Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Ground Floor" />
          </div>
          <Button onClick={() => saveMutation.mutate()} className="w-full">
            {floor ? "Update" : "Add"} Floor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RackDialog({ open, onClose, rack, floorId }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(rack?.name || "");
  const [category, setCategory] = useState(rack?.category || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (rack) {
        await fetch(`/api/racks/${rack.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, category }),
        });
      } else {
        await fetch(`/api/floors/${floorId}/racks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, category }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rack ? "Edit Rack" : "Add Rack"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rack Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Rack 1" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Vegetables" />
          </div>
          <Button onClick={() => saveMutation.mutate()} className="w-full">
            {rack ? "Update" : "Add"} Rack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({ open, onClose, item, rackId, category }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || 0,
    stock: item?.stock || 100,
    discount: item?.discount || 0,
    imageUrl: item?.imageUrl || "",
    category: item?.category || category || "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (item) {
        await fetch(`/api/items/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch(`/api/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, rackId }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <Label>Discount (%)</Label>
            <Input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <Button onClick={() => saveMutation.mutate()} className="w-full">
            {item ? "Update" : "Add"} Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
