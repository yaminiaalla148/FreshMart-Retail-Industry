import { Link, useLocation } from "wouter";
import { ShoppingCart, LogOut, LayoutDashboard, Store, UserCircle, Building2 } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useCartStore } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const [location] = useLocation();
  const { user, branch, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (location === "/") return null;

  const isHQAdmin = user?.role === "hq_admin";
  const isBranchManager = user?.role === "branch_manager";
  const isCustomer = user?.role === "customer" || !user;

  const getHomeLink = () => {
    if (isHQAdmin) return "/hq";
    if (isBranchManager) return "/manager";
    return "/shop";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link href={getHomeLink()} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
            S
          </div>
          <span className="font-bold text-xl tracking-tight text-secondary">
            Smart<span className="text-primary">Grocer</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1">
            {isHQAdmin && (
              <NavLink href="/hq" icon={<Building2 className="w-4 h-4" />}>HQ Admin</NavLink>
            )}
            {isBranchManager && (
              <>
                <NavLink href="/manager" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
                <NavLink href="/manager/inventory" icon={<Store className="w-4 h-4" />}>Inventory</NavLink>
              </>
            )}
            {isCustomer && (
              <NavLink href="/shop" icon={<Store className="w-4 h-4" />}>Shop</NavLink>
            )}
          </div>

          <div className="flex items-center gap-3 pl-6 border-l border-border/50">
            {isCustomer && (
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary transition-colors" data-testid="button-cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent hover:bg-accent border-2 border-white text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.name || user?.username || "Guest"}</p>
                <p className="text-xs text-muted-foreground">
                  {isHQAdmin ? "HQ Admin" : isBranchManager ? "Branch Manager" : branch?.name || "Customer"}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()} 
                title="Logout"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href} className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
      ${isActive 
        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }
    `}>
      {icon}
      {children}
    </Link>
  );
}
