import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetSales } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Eye } from "lucide-react";
import { useLocation } from "wouter";

const paymentLabels: Record<string, string> = {
  cash: "نقدي",
  card: "بطاقة",
  bank_transfer: "تحويل بنكي",
};

const statusLabels: Record<string, string> = {
  completed: "مكتمل",
  cancelled: "ملغي",
  refunded: "مسترد",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  cancelled: "destructive",
  refunded: "secondary",
};

export default function SalesList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  const { data, isLoading } = useGetSales({ page, limit: 10, search });

  const sales = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">المبيعات</h1>
          <Button onClick={() => setLocation("/sales/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            فاتورة جديدة
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pr-9"
                  placeholder="بحث برقم الفاتورة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-right">طريقة الدفع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد مبيعات
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                          <TableCell>{sale.customerName ?? "عميل عام"}</TableCell>
                          <TableCell className="font-semibold">{sale.total.toFixed(2)} SDG</TableCell>
                          <TableCell>{paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariants[sale.status] ?? "default"}>
                              {statusLabels[sale.status] ?? sale.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(sale.createdAt).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/invoices/${sale.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {meta && meta.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      السابق
                    </Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">
                      {page} / {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
