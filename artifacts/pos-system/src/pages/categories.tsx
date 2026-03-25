import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetCategories, useCreateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Categories() {
  const { data, isLoading } = useGetCategories({});
  const deleteMutation = useDeleteCategory();
  const createMutation = useCreateCategory();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCatName, setNewCatName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createMutation.mutateAsync({ data: { name: newCatName } });
      setNewCatName("");
      toast({ title: "تمت الإضافة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "تم الحذف بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    } catch {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">الفئات</h1>
        <p className="text-muted-foreground mt-1">إدارة تصنيفات المنتجات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4">إضافة فئة جديدة</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">اسم الفئة</label>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required placeholder="أدخل اسم الفئة" />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {createMutation.isPending ? "جاري الحفظ..." : <><Plus className="h-4 w-4 me-2"/> إضافة</>}
            </Button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-right font-bold">الاسم</TableHead>
                <TableHead className="text-right font-bold">عدد المنتجات</TableHead>
                <TableHead className="text-left font-bold w-[100px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    <Tags className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    لا توجد فئات
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.productCount || 0}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
