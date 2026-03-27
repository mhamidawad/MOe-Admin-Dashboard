import { AppLayout } from "@/components/layout/AppLayout";
import { useGetInvoices } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Receipt, Search } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetInvoices({ search });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">الفواتير</h1>
        <p className="text-muted-foreground mt-1">سجل مبيعات الفواتير</p>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث برقم الفاتورة..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 bg-background"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-right font-bold w-[150px]">رقم الفاتورة</TableHead>
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">العميل</TableHead>
                <TableHead className="text-right font-bold">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right font-bold">طريقة الدفع</TableHead>
                <TableHead className="text-right font-bold">الحالة</TableHead>
                <TableHead className="text-left font-bold w-[100px]">عرض</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    لا توجد فواتير
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(invoice.createdAt), 'PPP hh:mm a', { locale: ar })}</TableCell>
                    <TableCell>{invoice.customerName || <span className="text-muted-foreground">عميل نقدي</span>}</TableCell>
                    <TableCell className="font-bold">{invoice.total} SDG</TableCell>
                    <TableCell>
                      {invoice.paymentMethod === 'cash' ? 'نقدي' : invoice.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        مكتملة
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
