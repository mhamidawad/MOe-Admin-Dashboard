import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProducts, useCreateSale, useGetCustomers, Product, Customer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Trash2, Plus, Minus, UserCircle, CreditCard, Banknote, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type CartItem = { product: Product; quantity: number };

export default function POS() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: productsData } = useGetProducts({ search: searchTerm, limit: 20 });
  const { data: customersData } = useGetCustomers({ limit: 100 });
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0); // Representing percentage or flat amount. Let's assume flat for simplicity
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createSaleMutation = useCreateSale();

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
  const total = useMemo(() => subtotal - discount + tax, [subtotal, discount, tax]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", variant: "destructive" });
      return;
    }
    try {
      const res = await createSaleMutation.mutateAsync({
        data: {
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          customerId,
          discount,
          tax,
          paymentMethod
        }
      });
      toast({ title: "تم إتمام البيع بنجاح", description: `رقم الفاتورة: ${res.invoiceNumber}` });
      setLocation(`/invoices/${res.id}`);
    } catch (err) {
      toast({ title: "حدث خطأ أثناء إتمام البيع", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Products Grid (Right Side) */}
      <div className="flex-1 flex flex-col bg-muted/10 h-full">
        <div className="p-4 border-b border-border bg-card flex gap-4 items-center h-16 shrink-0">
          <Button variant="ghost" onClick={() => setLocation('/dashboard')}>العودة للوحة</Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="البحث عن منتج (الاسم، الباركود)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ps-10 h-10 rounded-xl"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsData?.data.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-card border border-border/60 rounded-2xl p-4 cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group flex flex-col justify-between aspect-square"
              >
                <div className="w-full aspect-video bg-muted rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                   {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm line-clamp-2">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">{product.price} SDG</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{product.stock} متبقي</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar (Left Side) */}
      <div className="w-[400px] bg-card border-s border-border flex flex-col h-full shadow-2xl z-10 shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between h-16 shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary"/> سلة المشتريات</h2>
          <Badge variant="secondary" className="font-mono text-base">{cart.length} منتج</Badge>
        </div>

        <div className="p-4 border-b border-border/50 shrink-0">
           <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><UserCircle className="h-4 w-4"/> العميل</div>
           <select 
             className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
             value={customerId || ""}
             onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
           >
             <option value="">عميل نقدي (بدون اسم)</option>
             {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <ShoppingCart className="h-16 w-16 mb-4" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="bg-muted/30 p-3 rounded-xl flex gap-3 items-center border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.product.name}</p>
                    <p className="text-primary font-bold text-sm mt-1">{item.product.price} SDG</p>
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-muted rounded-md"><Plus className="h-3 w-3"/></button>
                    <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-muted rounded-md"><Minus className="h-3 w-3"/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="font-semibold">{subtotal.toFixed(2)} SDG</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">خصم</span>
              <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-24 h-8 text-left" dir="ltr" placeholder="0" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">ضريبة</span>
              <Input type="number" value={tax || ''} onChange={e => setTax(Number(e.target.value))} className="w-24 h-8 text-left" dir="ltr" placeholder="0" />
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between items-end">
              <span className="font-bold text-lg">الإجمالي النهائي</span>
              <span className="text-3xl font-black font-display text-primary">{total.toFixed(2)} <span className="text-base font-bold text-muted-foreground">SDG</span></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['cash', 'card', 'bank_transfer'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${paymentMethod === method ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted hover:bg-muted/80 text-muted-foreground'}`}
              >
                {method === 'cash' && <Banknote className="h-5 w-5"/>}
                {method === 'card' && <CreditCard className="h-5 w-5"/>}
                {method === 'bank_transfer' && <Receipt className="h-5 w-5"/>}
                <span className="text-[10px] font-bold">
                  {method === 'cash' ? 'نقدي' : method === 'card' ? 'بطاقة' : 'تحويل'}
                </span>
              </button>
            ))}
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleCheckout}
            disabled={cart.length === 0 || createSaleMutation.isPending}
          >
            {createSaleMutation.isPending ? "جاري الدفع..." : "دفع وإصدار الفاتورة"}
          </Button>
        </div>
      </div>
    </div>
  );
}
