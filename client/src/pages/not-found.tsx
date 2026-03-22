import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-secondary mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-sm">
        The shelf you are looking for seems to be empty. Let's get you back to the main aisle.
      </p>
      <Link href="/">
        <Button className="bg-primary hover:bg-primary/90 rounded-xl px-8">
          Go Home
        </Button>
      </Link>
    </div>
  );
}
