import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProducts, useDeleteProduct, useCreateProduct, useGetCategories, Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, PackageSearch, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const emptyForm = { name: "", description: "", price: "", cost: "", stock: "", minStock: "5", barcode: "", categoryId: "", isActive: true };

export default function Products() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useGetProducts({ search });
  const { data: categoriesData } = useGetCategories({});
  const deleteMutation = useDeleteProduct();
  const createMutation = useCreateProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      cost: String(product.cost || ""),
      stock: String(product.stock),
      minStock: String(product.minStock),
      barcode: product.barcode || "",
      categoryId: String(product.categoryId || ""),
      isActive: product.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : undefined,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      barcode: form.barcode || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      isActive: form.isActive,
    };
    try {
      await createMutation.mutateAsync({ data: payload });
      toast({ title: "تمت إضافة المنتج بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowDialog(false);
    } catch {
      toast({ title: "حدث خطأ أثناء حفظ المنتج", variant: "destructive" });
    }
  };

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
        <Button onClick={openAdd} className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
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
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
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

      {/* Add/Edit Product Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{editProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
              <button onClick={() => setShowDialog(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">اسم المنتج *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: هاتف سامسونج S24" required />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">الوصف</label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر للمنتج" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">سعر البيع (ر.س) *</label>
                  <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">سعر التكلفة (ر.س)</label>
                  <Input type="number" step="0.01" min="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الكمية في المخزن *</label>
                  <Input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">حد التنبيه (أدنى مخزون)</label>
                  <Input type="number" min="0" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="5" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الباركود</label>
                  <Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="123456789" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الفئة</label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  >
                    <option value="">بدون فئة</option>
                    {categoriesData?.data.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">المنتج نشط (يظهر في نقطة البيع)</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {createMutation.isPending ? "جاري الحفظ..." : editProduct ? "حفظ التعديلات" : "إضافة المنتج"}
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
