"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  markNotificationsAsRead,
  getNotifications,
  clearNotifications,
  deleteNotification,
} from "@/app/api/notifications/actions";

type Notification = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

function NotificationContent({
  notification,
  isUnseen,
}: {
  notification: Notification;
  isUnseen: boolean;
}) {
  return (
    <div className="text-center sm:text-left">
      <h4
        className={`text-sm leading-snug mb-1 ${
          isUnseen ? "font-semibold text-white" : "font-medium text-slate-800"
        }`}
      >
        {notification.title}
      </h4>
      <p
        className={`text-xs leading-relaxed line-clamp-2 ${
          isUnseen ? "text-white/90" : "text-slate-500"
        }`}
      >
        {notification.message}
      </p>
      <span
        className={`text-[10px] font-medium mt-2 block ${
          isUnseen ? "text-white/75" : "text-slate-400"
        }`}
      >
        {new Date(notification.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

function SwipeableNotificationItem({
  notification,
  onDelete,
  onClickLink,
}: {
  notification: Notification;
  onDelete: (id: number) => Promise<void>;
  onClickLink?: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const isSwipingRef = useRef(false);

  const SWIPE_THRESHOLD = 85;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isSwipingRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (diff > 5) {
      isSwipingRef.current = true;
    }
    // Only allow swipe to the right
    setOffsetX(Math.max(0, diff));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX >= SWIPE_THRESHOLD) {
      triggerDelete();
    } else {
      setOffsetX(0);
    }
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 120);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    isSwipingRef.current = false;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startXRef.current;
      if (diff > 5) {
        isSwipingRef.current = true;
      }
      setOffsetX(Math.max(0, diff));
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      const finalDiff = upEvent.clientX - startXRef.current;
      if (finalDiff >= SWIPE_THRESHOLD) {
        triggerDelete();
      } else {
        setOffsetX(0);
      }
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 120);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const triggerDelete = () => {
    setIsDeleting(true);
    setOffsetX(450); // slide out right
    setTimeout(async () => {
      await onDelete(notification.id);
    }, 250);
  };

  const isUnseen = !notification.isRead;

  const handleClick = (e: React.MouseEvent) => {
    if (isSwipingRef.current || offsetX > 10) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClickLink) {
      onClickLink();
    }
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        isDeleting ? "max-h-0 opacity-0 my-0 py-0" : "max-h-48 opacity-100"
      }`}
    >
      {/* Red Background space on the left when sliding right with centered Delete Icon */}
      <div
        className="absolute inset-y-0 left-0 bg-red-600 flex items-center justify-center transition-all duration-75 overflow-hidden z-0"
        style={{
          width: `${Math.max(0, offsetX)}px`,
        }}
      >
        {offsetX > 15 && (
          <Trash2
            className={`text-white transition-all duration-150 ${
              offsetX >= SWIPE_THRESHOLD ? "scale-115" : "scale-90 opacity-90"
            }`}
            size={18}
          />
        )}
      </div>

      {/* Main Notification Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging
            ? "none"
            : "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className={`relative z-10 cursor-grab active:cursor-grabbing select-none transition-colors duration-150 ${
          isUnseen
            ? "bg-primary text-white hover:brightness-105"
            : "bg-white text-slate-900 hover:bg-slate-50"
        }`}
      >
        {notification.link ? (
          <Link
            href={notification.link}
            onClick={handleClick}
            className="block p-4"
          >
            <NotificationContent
              notification={notification}
              isUnseen={isUnseen}
            />
          </Link>
        ) : (
          <div className="p-4" onClick={handleClick}>
            <NotificationContent
              notification={notification}
              isUnseen={isUnseen}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notificationsRef = useRef<Notification[]>([]);
  notificationsRef.current = notifications;

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications sent via Web Push or service worker
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("notifications_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "NEW_NOTIFICATION") {
            fetchNotifications();
          }
        };
      } catch (err) {
        console.error("BroadcastChannel initialization error:", err);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeAndMarkRead();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  async function fetchNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }

  async function closeAndMarkRead() {
    setOpen(false);
    const current = notificationsRef.current;
    const hasUnread = current.some((n) => !n.isRead);
    if (hasUnread) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      try {
        await markNotificationsAsRead();
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  }

  function toggleOpen() {
    if (open) {
      closeAndMarkRead();
    } else {
      setOpen(true);
      fetchNotifications();
    }
  }

  async function handleClearAll(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      setClearing(true);
      await clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteOne(id: number) {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative ml-auto text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background"></span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-x-3 top-16 mx-auto w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-none sm:w-96 sm:absolute sm:top-full sm:inset-x-auto sm:right-0 sm:translate-x-0 sm:mx-0 sm:mt-3 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden origin-top animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
          {/* Notification Header / Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-100 bg-white">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white">
                <p className="text-sm font-medium text-slate-700">
                  All caught up!
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check back later for new alerts.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {notifications.map((n) => (
                  <SwipeableNotificationItem
                    key={n.id}
                    notification={n}
                    onDelete={handleDeleteOne}
                    onClickLink={closeAndMarkRead}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


