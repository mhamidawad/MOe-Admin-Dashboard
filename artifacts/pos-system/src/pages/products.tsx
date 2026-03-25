import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProducts, useDeleteProduct, Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetProducts({ search });
  const deleteMutation = useDeleteProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "تم حذف المنتج بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch {
      toast({ title: "فشل حذف المنتج", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المنتجات</h1>
          <p className="text-muted-foreground mt-1">إدارة المنتجات والمخزون</p>
        </div>
        <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
          <Plus className="me-2 h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن منتج، باركود..." 
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
                <TableHead className="w-[80px] text-right font-bold">الرمز</TableHead>
                <TableHead className="text-right font-bold">اسم المنتج</TableHead>
                <TableHead className="text-right font-bold">الفئة</TableHead>
                <TableHead className="text-right font-bold">السعر</TableHead>
                <TableHead className="text-right font-bold">المخزون</TableHead>
                <TableHead className="text-right font-bold">الحالة</TableHead>
                <TableHead className="text-left font-bold w-[100px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    لا توجد منتجات
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs">{product.barcode || '-'}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categoryName || '-'}</TableCell>
                    <TableCell className="font-semibold text-primary">{product.price} ر.س</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                        {product.stock <= product.minStock && (
                          <Badge variant="destructive" className="text-[10px] h-5">منخفض</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
