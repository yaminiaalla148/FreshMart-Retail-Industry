import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value?: string | number;
  icon: ReactNode;
  trend?: string;
  isLoading?: boolean;
}

export function StatsCard({ title, value, icon, trend, isLoading }: StatsCardProps) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold font-display text-secondary">{value}</div>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {trend.startsWith('+') ? (
                  <span className="text-emerald-500 font-medium">{trend}</span>
                ) : (
                  <span className="text-red-500 font-medium">{trend}</span>
                )}
                from last month
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
