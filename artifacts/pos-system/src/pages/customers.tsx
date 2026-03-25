import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCustomers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Customers() {
  const { data, isLoading } = useGetCustomers({});

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
        <p className="text-muted-foreground mt-1">قاعدة بيانات العملاء والمشتريات</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-right font-bold">اسم العميل</TableHead>
              <TableHead className="text-right font-bold">الهاتف</TableHead>
              <TableHead className="text-right font-bold">تاريخ الانضمام</TableHead>
              <TableHead className="text-right font-bold">إجمالي المشتريات</TableHead>
              <TableHead className="text-right font-bold">المبلغ المدفوع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  لا يوجد عملاء
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-bold">{customer.name}</TableCell>
                  <TableCell className="font-mono" dir="ltr">{customer.phone || '-'}</TableCell>
                  <TableCell>{format(new Date(customer.createdAt), 'PPP', { locale: ar })}</TableCell>
                  <TableCell>{customer.totalPurchases || 0} طلبات</TableCell>
                  <TableCell className="text-primary font-bold">{customer.totalSpent || 0} ر.س</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
