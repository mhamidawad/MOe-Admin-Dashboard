import { AppLayout } from "@/components/layout/AppLayout";
import { useGetUsers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const { data, isLoading } = useGetUsers({});

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">المستخدمون</h1>
        <p className="text-muted-foreground mt-1">إدارة مدراء النظام والموظفين</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-right font-bold">الاسم</TableHead>
              <TableHead className="text-right font-bold">البريد الإلكتروني</TableHead>
              <TableHead className="text-right font-bold">الدور</TableHead>
              <TableHead className="text-right font-bold">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
            ) : (
              data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold">{user.name}</TableCell>
                  <TableCell dir="ltr" className="text-end">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary' : ''}>
                      {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? <Badge className="bg-emerald-500/10 text-emerald-600">نشط</Badge> : <Badge variant="destructive">موقوف</Badge>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
