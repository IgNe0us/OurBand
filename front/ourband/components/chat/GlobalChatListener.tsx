"use client";
// @ts-nocheck

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getUserInfoApi } from '@/api/account/userService';
import { getMyChatRoomsApi } from '@/api/chat/chatService';
import { webSocketService } from '@/api/chat/webSocketService';
import { useChatStore } from '@/store/chatStore';

export function GlobalChatListener() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const setTotalUnreadCount = useChatStore((state) => state.setTotalUnreadCount);
  const incrementUnreadCount = useChatStore((state) => state.incrementUnreadCount);
  const tickLastMessage = useChatStore((state) => state.tickLastMessage);

  // Keep track of current pathname in a ref to use inside WebSocket callback
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const initGlobalChat = async () => {
      try {
        // 1. Get user info
        const me = await getUserInfoApi();
        if (!me || !me.userId) return;

        // 2. Fetch initial total unread count
        const rooms = await getMyChatRoomsApi().catch(() => []);
        const totalUnread = rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
        
        if (isMounted) {
          setTotalUnreadCount(totalUnread);
        }

        // 3. Connect global WebSocket
        webSocketService.connectGlobal(me.userId, (msg) => {
          // If the user is currently in that exact chat room, they are reading it right now.
          // In that case, we don't increment the global unread count.
          const inChatRoom = pathnameRef.current === `/chat/${msg.roomId}`;
          
          if (!inChatRoom && msg.senderId !== me.userId) {
            incrementUnreadCount();
          }
          
          tickLastMessage(msg);
        });
      } catch (err) {
        // Not logged in or failed
        // console.error("Global Chat Listener init failed:", err);
      }
    };

    initGlobalChat();

    return () => {
      isMounted = false;
      webSocketService.disconnect();
    };
  }, [setTotalUnreadCount, incrementUnreadCount]);

  return null; // This component doesn't render anything
}
