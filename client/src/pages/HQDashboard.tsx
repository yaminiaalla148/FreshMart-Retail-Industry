import { useState } from "react";
import { useBranches, useCreateBranch, useDeleteBranch, useCreateManager, useAuthStore } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Trash2, Users, QrCode, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Branch } from "@shared/schema";

export default function HQDashboard() {
  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch();
  const createManager = useCreateManager();
  const { toast } = useToast();
  const { logout } = useAuthStore();

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerName, setManagerName] = useState("");
  const [showQR, setShowQR] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await createBranch.mutateAsync({ name: newBranchName, address: newBranchAddress });
      toast({ title: "Branch created successfully!" });
      setNewBranchName("");
      setNewBranchAddress("");
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
    } catch {
      toast({ title: "Failed to create branch", variant: "destructive" });
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await deleteBranch.mutateAsync(id);
      toast({ title: "Branch deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
    } catch {
      toast({ title: "Failed to delete branch", variant: "destructive" });
    }
  };

  const handleCreateManager = async () => {
    if (!selectedBranch || !managerUsername || !managerPassword) return;
    try {
      await createManager.mutateAsync({
        username: managerUsername,
        password: managerPassword,
        branchId: selectedBranch.id,
        name: managerName,
      });
      toast({ title: "Manager account created!" });
      setManagerUsername("");
      setManagerPassword("");
      setManagerName("");
      setSelectedBranch(null);
    } catch {
      toast({ title: "Failed to create manager", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary">HQ Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all branches from here</p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Add New Branch</CardTitle>
            <Plus className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label>Branch Name</Label>
                <Input
                  placeholder="e.g., Downtown Store"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  data-testid="input-branch-name"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="e.g., 123 Main St"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  data-testid="input-branch-address"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateBranch} disabled={createBranch.isPending} data-testid="button-create-branch">
                  <Plus className="w-4 h-4 mr-2" /> Create Branch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Branches</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading branches...</p>
            ) : (
              <div className="space-y-4">
                {branches?.map((branch: Branch) => (
                  <div
                    key={branch.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 rounded-xl gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">{branch.address || "No address"}</p>
                        {branch.isMainBranch && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Main Branch</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQR(showQR === branch.id ? null : branch.id)}
                        data-testid={`button-show-qr-${branch.id}`}
                      >
                        <QrCode className="w-4 h-4 mr-1" /> {showQR === branch.id ? "Hide" : "Show"} QR
                      </Button>

                      {/* Staff view removed */}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedBranch(branch)} data-testid={`button-add-manager-${branch.id}`}>
                            <Users className="w-4 h-4 mr-1" /> Add Manager
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Manager for {branch.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Manager Name</Label>
                              <Input
                                placeholder="John Doe"
                                value={managerName}
                                onChange={(e) => setManagerName(e.target.value)}
                                data-testid="input-manager-name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Username</Label>
                              <Input
                                placeholder="manager1"
                                value={managerUsername}
                                onChange={(e) => setManagerUsername(e.target.value)}
                                data-testid="input-manager-username"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Password</Label>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter password"
                                  value={managerPassword}
                                  onChange={(e) => setManagerPassword(e.target.value)}
                                  data-testid="input-manager-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                            <Button onClick={handleCreateManager} className="w-full" disabled={createManager.isPending} data-testid="button-submit-manager">
                              Create Manager Account
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {!branch.isMainBranch && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.id)}
                          data-testid={`button-delete-branch-${branch.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {showQR === branch.id && branch.qrCode && (
                      <div className="w-full md:w-auto mt-4 md:mt-0 p-4 bg-white rounded-xl border text-center">
                        <img src={branch.qrCode} alt={`QR Code for ${branch.name}`} className="w-48 h-48 mx-auto" />
                        <p className="text-xs text-muted-foreground mt-2">Scan to enter store</p>
                      </div>
                    )}
                    {/* staff block removed */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
