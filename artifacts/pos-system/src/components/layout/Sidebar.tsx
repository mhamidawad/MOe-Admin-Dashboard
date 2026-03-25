import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  FileText, 
  Users, 
  PieChart, 
  Settings, 
  LogOut,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationContext";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/sales/new", label: "نقطة البيع (POS)", icon: ShoppingCart },
  { href: "/sales", label: "المبيعات", icon: FileText },
  { href: "/invoices", label: "الفواتير", icon: FileText },
  { href: "/products", label: "المنتجات", icon: Package },
  { href: "/categories", label: "الفئات", icon: Tags },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/reports", label: "التقارير", icon: PieChart },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
];

const adminItems = [
  { href: "/users", label: "المستخدمون", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const items = user?.role === "admin" ? [...navItems, ...adminItems] : navItems;

  return (
    <aside className="w-64 bg-card border-e border-border h-screen flex flex-col shadow-xl z-20 relative transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3 text-primary">
          <ShoppingCart className="h-8 w-8" />
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">نظام <span className="text-primary">مبيعاتي</span></h1>
        </div>
      </div>

      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'مسؤول' : 'مستخدم'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                <span className="font-medium">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="ms-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
