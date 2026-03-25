import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, colorClass = "text-primary bg-primary/10" }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -end-6 -top-6 w-24 h-24 bg-gradient-to-br from-transparent to-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-display">{value}</h3>
          
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <span className={cn("font-semibold", trendUp ? "text-emerald-500" : "text-destructive")}>
                {trend}
              </span>
              <span className="text-muted-foreground text-xs">منذ الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
