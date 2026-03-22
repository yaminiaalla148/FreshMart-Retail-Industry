import { useState, useEffect } from "react";
import { useLogin, useAuthStore, useBranches } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Store, ShoppingBag, Shield, QrCode, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Branch } from "@shared/schema";

type PortalType = "customer" | "manager" | "hq";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [portal, setPortal] = useState<PortalType | null>(null);
  const [step, setStep] = useState<"select-portal" | "select-branch" | "login">("select-portal");
  
  const loginMutation = useLogin();
  const { data: branches } = useBranches();
  const { setBranch, user } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === "hq_admin") {
        setLocation("/hq");
      } else if (user.role === "branch_manager") {
        setLocation("/manager");
      } else {
        setLocation("/shop");
      }
    }
  }, [user, setLocation]);

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    const branch = branches?.find((b: Branch) => b.id === Number(branchId));
    if (branch) {
      setBranch(branch);
    }
  };

  const handlePortalSelect = (selectedPortal: PortalType) => {
    setPortal(selectedPortal);
    if (selectedPortal === "hq") {
      setStep("login");
    } else if (selectedPortal === "manager") {
      setStep("select-branch");
    } else {
      setStep("select-branch");
    }
  };

  const handleContinue = () => {
    if (!selectedBranchId && branches?.length > 0) {
      const firstBranch = branches[0];
      setSelectedBranchId(String(firstBranch.id));
      setBranch(firstBranch);
    }
    setStep("login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const role = portal === "hq" ? "hq_admin" : portal === "manager" ? "branch_manager" : "customer";
      const user = await loginMutation.mutateAsync({ 
        identifier, 
        password, 
        role,
        branchId: selectedBranchId ? Number(selectedBranchId) : undefined
      });
      
      if (user.role === "hq_admin") {
        setLocation("/hq");
      } else if (user.role === "branch_manager") {
        setLocation("/manager");
      } else {
        setLocation("/shop");
      }
    } catch {
    }
  };

  const handleSkipLogin = async () => {
    try {
      await loginMutation.mutateAsync({ 
        identifier: `guest_${Date.now()}`, 
        role: "customer",
        branchId: selectedBranchId ? Number(selectedBranchId) : undefined
      });
      setLocation("/shop");
    } catch {
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="hidden lg:flex w-1/2 bg-secondary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Fresh Groceries <br />
              <span className="text-primary">Smart Shopping</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Experience the future of retail with AI-powered assistance, smart inventory tracking, and seamless checkout.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white/50 backdrop-blur-xl">
        <div className="max-w-md w-full">
          {step === "select-portal" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-secondary">Welcome</h2>
                <p className="text-muted-foreground mt-2">Select your portal to continue</p>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-16 justify-start px-6 rounded-xl"
                  onClick={() => handlePortalSelect("customer")}
                  data-testid="button-customer-portal"
                >
                  <ShoppingBag className="w-6 h-6 mr-4 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Customer Portal</p>
                    <p className="text-xs text-muted-foreground">Browse and shop products</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-16 justify-start px-6 rounded-xl"
                  onClick={() => handlePortalSelect("manager")}
                  data-testid="button-manager-portal"
                >
                  <Store className="w-6 h-6 mr-4 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold">Branch Manager Portal</p>
                    <p className="text-xs text-muted-foreground">Manage inventory and sales</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-16 justify-start px-6 rounded-xl"
                  onClick={() => handlePortalSelect("hq")}
                  data-testid="button-hq-portal"
                >
                  <Shield className="w-6 h-6 mr-4 text-purple-600" />
                  <div className="text-left">
                    <p className="font-semibold">HQ Admin Portal</p>
                    <p className="text-xs text-muted-foreground">Multi-branch management</p>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}

          {step === "select-branch" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-secondary">
                  {portal === "manager" ? "Manager Login" : "Select Store"}
                </h2>
                <p className="text-muted-foreground mt-2">Choose your store location</p>
              </div>

              <div className="space-y-4">
                <Label>Select Store</Label>
                <Select value={selectedBranchId} onValueChange={handleSelectBranch} disabled={!branches || branches.length === 0}>
                  <SelectTrigger className="h-12 rounded-xl" data-testid="select-branch">
                    <SelectValue placeholder={!branches || branches.length === 0 ? "Loading stores..." : "Choose a store location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches && branches.length > 0 ? (
                      branches.map((branch: Branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No stores available</div>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleContinue}
                  className="w-full h-12 rounded-xl text-lg"
                  disabled={!selectedBranchId}
                  data-testid="button-continue"
                >
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setStep("select-portal"); setPortal(null); }}
                data-testid="button-back"
              >
                Back to portal selection
              </Button>
            </motion.div>
          )}

          {step === "login" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
                  backgroundColor: portal === "hq" ? "rgb(147 51 234 / 0.1)" : portal === "manager" ? "rgb(37 99 235 / 0.1)" : "rgb(22 163 74 / 0.1)"
                }}>
                  {portal === "hq" && <Shield className="w-8 h-8 text-purple-600" />}
                  {portal === "manager" && <Store className="w-8 h-8 text-blue-600" />}
                  {portal === "customer" && <ShoppingBag className="w-8 h-8 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold text-secondary">
                  {portal === "hq" ? "HQ Admin Login" : portal === "manager" ? "Manager Login" : "Customer Login"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {portal === "customer" ? "Enter your details or continue as guest" : "Enter your credentials"}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {portal === "customer" ? "Phone Number or Email" : "Username"}
                  </Label>
                  <Input
                    id="identifier"
                    placeholder={portal === "customer" ? "e.g. +91 9876543210" : portal === "manager" ? "e.g. manager1" : "e.g. admin"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="rounded-xl h-12 bg-white"
                    required={portal !== "customer"}
                    data-testid="input-identifier"
                  />
                </div>

                {portal !== "customer" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl h-12 bg-white"
                      required
                      data-testid="input-password"
                    />
                  </div>
                )}

                {loginMutation.error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                    {loginMutation.error.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {portal === "customer" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    onClick={handleSkipLogin}
                    disabled={loginMutation.isPending}
                    data-testid="button-skip-login"
                  >
                    Skip & Continue as Guest
                  </Button>
                )}
              </form>

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => { 
                  if (portal === "hq") {
                    setStep("select-portal");
                    setPortal(null);
                  } else {
                    setStep("select-branch");
                  }
                }}
                data-testid="button-back"
              >
                {portal === "hq" ? "Back to portal selection" : "Back to store selection"}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
