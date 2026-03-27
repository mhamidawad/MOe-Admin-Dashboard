import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCustomers, useCreateCustomer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const emptyForm = { name: "", phone: "", email: "", address: "" };

export default function Customers() {
  const { data, isLoading } = useGetCustomers({});
  const createMutation = useCreateCustomer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
        },
      });
      toast({ title: "تمت إضافة العميل بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setForm({ ...emptyForm });
      setShowDialog(false);
    } catch {
      toast({ title: "حدث خطأ أثناء إضافة العميل", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
          <p className="text-muted-foreground mt-1">قاعدة بيانات العملاء والمشتريات</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
          <Plus className="me-2 h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-right font-bold">اسم العميل</TableHead>
              <TableHead className="text-right font-bold">الهاتف</TableHead>
              <TableHead className="text-right font-bold">البريد الإلكتروني</TableHead>
              <TableHead className="text-right font-bold">تاريخ الانضمام</TableHead>
              <TableHead className="text-right font-bold">إجمالي المشتريات</TableHead>
              <TableHead className="text-right font-bold">المبلغ المدفوع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  لا يوجد عملاء
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-bold">{customer.name}</TableCell>
                  <TableCell className="font-mono" dir="ltr">{customer.phone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.email || '-'}</TableCell>
                  <TableCell>{format(new Date(customer.createdAt), 'PPP', { locale: ar })}</TableCell>
                  <TableCell>{customer.totalPurchases || 0} طلبات</TableCell>
                  <TableCell className="text-primary font-bold">{customer.totalSpent || 0} ر.س</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Customer Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">إضافة عميل جديد</h2>
              <button onClick={() => setShowDialog(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">اسم العميل *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: أحمد محمد" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@email.com" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">العنوان</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="المدينة، الحي" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {createMutation.isPending ? "جاري الحفظ..." : "إضافة العميل"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
