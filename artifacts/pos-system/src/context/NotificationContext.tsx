import { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetNotifications, useMarkNotificationRead, Notification } from "@workspace/api-client-react";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  const { data, refetch } = useGetNotifications(
    { unreadOnly: false }, 
    { query: { enabled: isAuthenticated, refetchInterval: 30000 } }
  );
  
  const markReadMutation = useMarkNotificationRead();

  const markAsRead = async (id: number) => {
    await markReadMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: data?.data || [],
        unreadCount: data?.unreadCount || 0,
        markAsRead,
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
