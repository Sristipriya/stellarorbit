/**
 * In-app notification system — React context + hook.
 * Tracks deposit/withdraw successes, errors, and milestones.
 * Session-scoped (lives in memory, reset on page refresh).
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type NotifKind = "success" | "error" | "info" | "warning";

export type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  message?: string;
  txHash?: string;
  at: number;
  read: boolean;
};

type NotifCtx = {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
};

const Ctx = createContext<NotifCtx | null>(null);

let seq = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((n: Omit<Notification, "id" | "at" | "read">) => {
    const notif: Notification = {
      ...n,
      id: `n-${++seq}`,
      at: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Ctx.Provider value={{ notifications, unreadCount, add, markAllRead, dismiss, clearAll }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications(): NotifCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be inside <NotificationProvider>");
  return ctx;
}
