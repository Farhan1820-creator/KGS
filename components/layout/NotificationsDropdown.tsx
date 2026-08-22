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
        <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => {
                  const content = (
                    <div className={`p-4 border-b last:border-0 hover:bg-muted transition-colors ${n.isRead ? "opacity-70" : ""}`}>
                      <h4 className="text-sm font-medium leading-none mb-1">{n.title}</h4>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        {new Date(n.createdAt).toLocaleDateString()}
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

