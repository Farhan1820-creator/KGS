"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { markNotificationsAsRead, getNotifications } from "@/app/api/notifications/actions";

type Notification = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    const data = await getNotifications();
    setNotifications(data);
  }

  async function toggleOpen() {
    const newState = !open;
    setOpen(newState);
    
    if (newState) {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        await markNotificationsAsRead();
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="icon" className="relative ml-auto" onClick={toggleOpen}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 border border-background"></span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-background/80 backdrop-blur-xl text-foreground rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/30">
            <span className="text-sm font-semibold tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/70">Check back later for new alerts.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {notifications.map((n) => {
                  const content = (
                    <div className={`group relative p-4 transition-all duration-200 hover:bg-muted/50 ${n.isRead ? "opacity-75" : "bg-primary/5"}`}>
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}
                      <h4 className={`text-sm leading-none mb-1.5 ${n.isRead ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>{n.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                      <span className="text-[10px] font-medium text-muted-foreground/60 mt-2 block">
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                  
                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

