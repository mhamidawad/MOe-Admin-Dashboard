import { AppLayout } from "@/components/layout/AppLayout";
import { useNotifications } from "@/context/NotificationContext";
import { Bell, Check, AlertTriangle, Info, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Notifications() {
  const { notifications, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch(type) {
      case 'low_stock': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'sale_completed': return <ShoppingBag className="h-5 w-5 text-emerald-500" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الإشعارات</h1>
          <p className="text-muted-foreground mt-1">التنبيهات وتحديثات النظام</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-card p-12 rounded-2xl border border-border text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد إشعارات حالياً</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${notif.isRead ? 'bg-card border-border/50' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
            >
              <div className={`p-2 rounded-full ${notif.isRead ? 'bg-muted' : 'bg-background shadow-sm'}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${notif.isRead ? 'text-foreground' : 'text-primary'}`}>{notif.title}</h4>
                <p className="text-muted-foreground mt-1 text-sm">{notif.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-2">{format(new Date(notif.createdAt), 'PPP hh:mm a', { locale: ar })}</p>
              </div>
              {!notif.isRead && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="تحديد كمقروء"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
