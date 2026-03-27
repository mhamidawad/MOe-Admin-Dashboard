import { useRoute } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetInvoiceById } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowRight, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = Number(params?.id);
  const { data: invoice, isLoading } = useGetInvoiceById(invoiceId, { query: { enabled: !!invoiceId }});

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <AppLayout><div className="p-8 text-center">جاري التحميل...</div></AppLayout>;
  if (!invoice) return <AppLayout><div className="p-8 text-center text-destructive">الفاتورة غير موجودة</div></AppLayout>;

  return (
    <AppLayout>
      {/* Hide controls when printing */}
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => window.history.back()} className="text-muted-foreground">
          <ArrowRight className="me-2 h-4 w-4" /> عودة
        </Button>
        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
          <Printer className="me-2 h-4 w-4" /> طباعة الفاتورة
        </Button>
      </div>

      <div className="max-w-2xl mx-auto bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Header */}
        <div className="bg-primary/5 p-8 border-b border-border text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
             <CheckCircle2 className="h-64 w-64" />
          </div>
          <h2 className="text-3xl font-black font-display text-primary mb-2">نظام مبيعاتي</h2>
          <p className="text-muted-foreground text-sm">المملكة العربية السعودية - الرياض</p>
          <p className="text-muted-foreground text-sm">الرقم الضريبي: 300123456789003</p>
        </div>

        {/* Info */}
        <div className="p-8 grid grid-cols-2 gap-8 border-b border-border/50 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">فاتورة إلى:</p>
            <p className="font-bold text-lg">{invoice.customerName || "عميل نقدي"}</p>
            {invoice.customerPhone && <p className="text-muted-foreground">{invoice.customerPhone}</p>}
          </div>
          <div className="text-end">
            <p className="text-muted-foreground mb-1">تفاصيل الفاتورة:</p>
            <p className="font-mono font-bold text-lg text-primary">{invoice.invoiceNumber}</p>
            <p className="text-muted-foreground mt-1">{format(new Date(invoice.createdAt), 'PPP hh:mm a', { locale: ar })}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              الدفع: {invoice.paymentMethod === 'cash' ? 'نقدي' : invoice.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-start pb-3 font-bold">المنتج</th>
                <th className="text-center pb-3 font-bold">الكمية</th>
                <th className="text-center pb-3 font-bold">السعر</th>
                <th className="text-end pb-3 font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-4 font-medium">{item.productName}</td>
                  <td className="py-4 text-center">{item.quantity}</td>
                  <td className="py-4 text-center">{item.unitPrice} SDG</td>
                  <td className="py-4 text-end font-bold">{item.total} SDG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-muted/20 p-8 pt-4">
          <div className="w-1/2 ms-auto space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="font-medium">{invoice.subtotal} SDG</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>الخصم</span>
                <span>-{invoice.discount} SDG</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">الضريبة المضافة (15%)</span>
              <span className="font-medium">{invoice.tax} SDG</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-border mt-2">
              <span className="font-bold text-lg">الإجمالي</span>
              <span className="font-black text-2xl text-primary font-display">{invoice.total} SDG</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center border-t border-border">
          <p className="text-muted-foreground text-sm font-medium">شكراً لتسوقكم معنا!</p>
        </div>
      </div>
    </AppLayout>
  );
}
