import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Menu } from "lucide-react";
import { Link } from "wouter";
import { useNotifications } from "@/context/NotificationContext";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative hidden md:block w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث سريع..." 
            className="ps-10 bg-muted/50 border-transparent focus:bg-background rounded-full h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/notifications">
          <div className="relative p-2 rounded-full hover:bg-muted cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-card"></span>
            )}
          </div>
        </Link>
        
        <div className="h-8 w-px bg-border hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:block">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </header>
  );
}
