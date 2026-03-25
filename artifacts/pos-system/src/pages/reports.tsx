import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Reports() {
  const { data: stats, isLoading } = useGetDashboardStats(); // Using dashboard stats as basic reports for now

  if (isLoading) return <AppLayout><div className="p-8 text-center">جاري التحميل...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">التقارير التحليلية</h1>
        <p className="text-muted-foreground mt-1">نظرة مفصلة على أداء المبيعات</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
        <h3 className="text-lg font-bold mb-6">المبيعات اليومية (أخر 7 أيام)</h3>
        <div className="h-[400px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.salesChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: ar })} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value} ر.س`, 'المبيعات']}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
