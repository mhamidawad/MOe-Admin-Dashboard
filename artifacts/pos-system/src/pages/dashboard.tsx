import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { DollarSign, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) return <AppLayout><div className="p-8 text-center text-muted-foreground">جاري التحميل...</div></AppLayout>;
  if (!stats) return <AppLayout><div className="p-8 text-center text-destructive">فشل في تحميل البيانات</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على أداء المبيعات والمخزون</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="مبيعات اليوم" 
          value={`${stats.todaySales.toLocaleString()} ر.س`} 
          icon={DollarSign} 
          colorClass="bg-emerald-500/10 text-emerald-500"
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="المبيعات الشهرية" 
          value={`${stats.monthSales.toLocaleString()} ر.س`} 
          icon={ShoppingBag} 
          colorClass="bg-blue-500/10 text-blue-500"
          trend="+8%"
          trendUp={true}
        />
        <StatCard 
          title="إجمالي المنتجات" 
          value={stats.totalProducts} 
          icon={Package} 
          colorClass="bg-purple-500/10 text-purple-500"
        />
        <StatCard 
          title="تنبيهات المخزون" 
          value={stats.lowStockProducts} 
          icon={AlertTriangle} 
          colorClass="bg-destructive/10 text-destructive"
          trend="عاجل"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">المبيعات خلال 7 أيام</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'EEEE', { locale: ar })}
                  stroke="#94a3b8" 
                  fontSize={12}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} ر.س`, 'المبيعات']}
                  labelFormatter={(label) => format(new Date(label), 'PPP', { locale: ar })}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6">آخر المبيعات</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-semibold text-sm">{sale.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(sale.createdAt), 'hh:mm a')}</p>
                </div>
                <div className="text-end">
                  <p className="font-bold text-primary">{sale.total} ر.س</p>
                  <p className="text-xs text-muted-foreground">{sale.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}</p>
                </div>
              </div>
            ))}
            {stats.recentSales.length === 0 && (
              <p className="text-center text-muted-foreground py-10">لا توجد مبيعات حديثة</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
