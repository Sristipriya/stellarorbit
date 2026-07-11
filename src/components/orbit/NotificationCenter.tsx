import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, XCircle, Info, AlertTriangle, X, Trash2, ExternalLink } from "lucide-react";
import { useNotifications, type Notification } from "@/lib/notifications";
import { NETWORK } from "@/lib/stellar/network";

function kindIcon(kind: Notification["kind"]) {
  switch (kind) {
    case "success": return <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--orbit-ok)]" />;
    case "error":   return <XCircle className="h-4 w-4 shrink-0 text-[var(--orbit-danger)]" />;
    case "warning": return <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--orbit-warn)]" />;
    default:        return <Info className="h-4 w-4 shrink-0 text-[var(--orbit-accent)]" />;
  }
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    setOpen((v) => {
      if (!v) markAllRead();
      return !v;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--orbit-edge)] bg-white/[0.04] text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[var(--orbit-edge)] bg-black/80 shadow-2xl backdrop-blur-xl"
            style={{ maxHeight: "70vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--orbit-edge)] px-4 py-3">
              <div className="font-display text-sm font-semibold">Notifications</div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--orbit-mute)] hover:text-[var(--orbit-danger)] transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-[var(--orbit-mute)]/30 mb-3" />
                  <div className="font-display text-sm text-[var(--orbit-mute)]">All caught up</div>
                  <p className="font-mono text-[10px] text-[var(--orbit-mute)]/60 mt-1">
                    Deposits, withdrawals, and alerts will appear here.
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--orbit-edge)] bg-white/[0.03] px-3 py-2.5 group"
                    >
                      {kindIcon(n.kind)}
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-xs font-semibold text-[var(--orbit-ink)]">
                          {n.title}
                        </div>
                        {n.message && (
                          <div className="font-mono text-[10px] text-[var(--orbit-mute)] mt-0.5 break-all">
                            {n.message}
                          </div>
                        )}
                        {n.txHash && (
                          <a
                            href={NETWORK.explorerTx(n.txHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 flex items-center gap-1 font-mono text-[9px] text-[var(--orbit-accent)] hover:underline"
                          >
                            {n.txHash.slice(0, 8)}… <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        <div className="font-mono text-[9px] text-[var(--orbit-mute)]/50 mt-1">
                          {timeAgo(n.at)}
                        </div>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="h-5 w-5 shrink-0 flex items-center justify-center rounded text-[var(--orbit-mute)] opacity-0 group-hover:opacity-100 hover:text-[var(--orbit-ink)] transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
