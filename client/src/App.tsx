import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { useEffect } from "react";

import Login from "@/pages/Login";
import Shop from "@/pages/Shop";
import QRScanner from "@/pages/QRScanner";
import ManagerDashboard from "@/pages/ManagerDashboard";
import HQDashboard from "@/pages/HQDashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: any; 
  allowedRoles?: ("customer" | "branch_manager" | "hq_admin")[];
}) {
  const { user, branch } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user && !branch) {
      setLocation("/");
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
      if (user.role === "hq_admin") {
        setLocation("/hq");
      } else if (user.role === "branch_manager") {
        setLocation("/manager");
      } else {
        setLocation("/shop");
      }
    }
  }, [user, branch, allowedRoles, setLocation]);

  if (!user && !branch) return null;
  return <Component />;
}

function Router() {
  const { user } = useAuthStore();
  
  const showNav = user?.role === "customer";

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Navigation />}
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/scan-qr" component={QRScanner} />
        <Route path="/shop">
          <ProtectedRoute component={Shop} allowedRoles={["customer"]} />
        </Route>
        <Route path="/manager">
          <ProtectedRoute component={ManagerDashboard} allowedRoles={["branch_manager"]} />
        </Route>
        <Route path="/hq">
          <ProtectedRoute component={HQDashboard} allowedRoles={["hq_admin"]} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
