import { useState } from "react";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/use-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type InsertItem } from "@shared/schema";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useItems({ search });
  const { toast } = useToast();
  
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(InsertItem & { id?: number }) | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      if (editingItem.id) {
        await updateItem.mutateAsync({ id: editingItem.id, ...editingItem });
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        await createItem.mutateAsync(editingItem as InsertItem);
        toast({ title: "Success", description: "Item created successfully" });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem.mutateAsync(id);
      toast({ title: "Deleted", description: "Item removed from inventory" });
    }
  };

  const openCreateDialog = () => {
    setEditingItem({
      name: "",
      category: "Vegetables",
      price: 0,
      stock: 100,
      floor: "Ground",
      rack: "A1",
      description: "",
      imageUrl: "",
      discount: 0
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-secondary">Inventory</h1>
            <p className="text-muted-foreground">Manage products, stock levels, and prices</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add New Item
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search inventory..." 
                className="pl-10 h-10 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading inventory...</TableCell>
                  </TableRow>
                ) : items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No items found</TableCell>
                  </TableRow>
                ) : (
                  items?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-secondary">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.floor} / {item.rack}</TableCell>
                      <TableCell className="text-right font-medium">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.stock < 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-secondary">
              {editingItem?.id ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Item Name</Label>
                <Input 
                  value={editingItem?.name} 
                  onChange={e => setEditingItem(prev => ({ ...prev!, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={editingItem?.category} 
                  onValueChange={v => setEditingItem(prev => ({ ...prev!, category: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Vegetables", "Fruits", "Spices", "Snacks", "Beverages", "Dairy"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input 
                  type="number" step="0.01" 
                  value={editingItem?.price}
                  onChange={e => setEditingItem(prev => ({ ...prev!, price: parseFloat(e.target.value) }))}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Floor</Label>
                <Select 
                  value={editingItem?.floor} 
                  onValueChange={v => setEditingItem(prev => ({ ...prev!, floor: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Ground", "1st", "2nd"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rack Number</Label>
                <Input 
                  value={editingItem?.rack} 
                  onChange={e => setEditingItem(prev => ({ ...prev!, rack: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input 
                  type="number"
                  value={editingItem?.stock}
                  onChange={e => setEditingItem(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input 
                  placeholder="https://..."
                  value={editingItem?.imageUrl}
                  onChange={e => setEditingItem(prev => ({ ...prev!, imageUrl: e.target.value }))}
                  required 
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Input 
                  value={editingItem?.description || ""} 
                  onChange={e => setEditingItem(prev => ({ ...prev!, description: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
