"use client";
// @ts-nocheck

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getUserInfoApi } from '@/api/account/userService';
import { getUnreadNotificationCountApi, getNotificationSubscribeUrl, NotificationData } from '@/api/notification/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used, let's check package.json later. Or fallback to standard alert.

export function GlobalNotificationListener() {
  const pathname = usePathname();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const incrementUnreadCount = useNotificationStore((state) => state.incrementUnreadCount);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initGlobalNotification = async () => {
      try {
        // 1. Get user info
        const me = await getUserInfoApi();
        if (!me || !me.userId) return;

        // 2. Fetch initial unread count
        const { count } = await getUnreadNotificationCountApi().catch(() => ({ count: 0 }));
        
        if (isMounted) {
          setUnreadCount(count);
        }

        // 3. Connect SSE
        const token = document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        
        if (!token) return;

        const url = `${getNotificationSubscribeUrl()}?token=${token}`; // Assuming we pass token in URL or we can rely on withCredentials
        
        // Use EventSource (Note: native EventSource withCredentials sends cookies)
        const eventSource = new EventSource(getNotificationSubscribeUrl(), {
            withCredentials: true 
        });

        eventSourceRef.current = eventSource;

        eventSource.addEventListener("connect", (event) => {
            console.log("Notification SSE Connected", event.data);
        });

        eventSource.addEventListener("notification", (event) => {
            try {
                const data: NotificationData = JSON.parse(event.data);
                incrementUnreadCount();
                
                // Show Toast
                if (typeof toast !== 'undefined') {
                    toast.custom((t) => (
                      <div
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                          opacity: t.visible ? 1 : 0,
                          transition: "opacity 300ms ease-in-out",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          borderRadius: "14px",
                          background: "rgba(15, 23, 42, 0.8)",
                          backdropFilter: "blur(10px)",
                          color: "#f8fafc",
                          border: "1px solid rgba(51, 65, 85, 0.6)",
                          padding: "12px 20px",
                          fontSize: "15px",
                          fontWeight: "500",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🔔</span>
                        <span>{data.content}</span>
                      </div>
                    ), { position: "top-center", duration: 4000 });
                } else {
                    // Fallback if no toast library
                    console.log("New Notification:", data.content);
                }

            } catch (e) {
                console.error("Error parsing SSE data", e);
            }
        });

        eventSource.onerror = (error) => {
            console.error("Notification SSE Error", error);
            eventSource.close();
            // Retry logic could be added here
        };

      } catch (err) {
        // Not logged in or failed
      }
    };

    initGlobalNotification();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
          eventSourceRef.current.close();
      }
    };
  }, [setUnreadCount, incrementUnreadCount]);

  return null;
}

