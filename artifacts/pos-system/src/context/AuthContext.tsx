import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, LoginRequest } from "@workspace/api-client-react";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

setAuthTokenGetter(() => localStorage.getItem("auth-token"));

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth-token"));
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const loginMutation = useLogin();

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      setToken(response.token);
      localStorage.setItem("auth-token", response.token);
      toast({ title: "تم تسجيل الدخول بنجاح", variant: "default" });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ 
        title: "خطأ في تسجيل الدخول", 
        description: err.message || "تأكد من البريد الإلكتروني وكلمة المرور", 
        variant: "destructive" 
      });
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("auth-token");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isAuthenticated: !!user,
        isLoading: isUserLoading && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
