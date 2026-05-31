"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Users, ChevronRight, User, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInfoApi, getFollowingsApi } from "@/api/account/userService";
import { getMyBandsApi, getBandProfileApi } from "@/api/band/bandService";
import { getMyChatRoomsApi, createOrGetRoomApi, ChatRoomResponseDTO } from "@/api/chat/chatService";
import { useChatStore } from "@/store/chatStore";
import toast from "react-hot-toast";

export default function ChatMainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"LIST" | "NEW">("LIST");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [mergedUsers, setMergedUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomResponseDTO[]>([]);
  const lastMessageTick = useChatStore(state => state.lastMessageTick);
  const latestMessage = useChatStore(state => state.latestMessage);

  // 실데이터 로딩: 팔로잉 목록 + 가입된 밴드 멤버 합치기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const me = await getUserInfoApi();
        setCurrentUserId(me.userId);

        const followings = await getFollowingsApi().catch(() => []);
        const myBands = await getMyBandsApi().catch(() => []);
        
        const bandProfiles = await Promise.all(
          myBands.map(b => getBandProfileApi(b.id).catch(() => null))
        );
        
        const usersMap = new Map();

        // 1. 팔로잉 유저 추가
        followings.forEach(f => {
          if (f.userId !== me.userId) {
            usersMap.set(f.userId, {
              id: f.userId,
              name: f.nickname,
              handle: `user_${f.userId}`, 
              profileImage: f.profilePictureUrl,
              tags: ["팔로잉"]
            });
          }
        });

        // 2. 밴드 멤버 추가
        bandProfiles.forEach((bp, index) => {
          if (!bp || !bp.positions) return;
          const bandName = myBands[index].name;
          bp.positions.forEach(pos => {
            if (pos.userId && pos.userId !== me.userId) {
              if (usersMap.has(pos.userId)) {
                const u = usersMap.get(pos.userId);
                if (!u.tags.includes(bandName)) u.tags.push(bandName);
              } else {
                usersMap.set(pos.userId, {
                  id: pos.userId,
                  name: pos.memberName,
                  handle: `user_${pos.userId}`,
                  profileImage: pos.profileImageUrl,
                  tags: [bandName]
                });
              }
            }
          });
        });

        setMergedUsers(Array.from(usersMap.values()));

        // 3. 내 채팅방 목록 가져오기
        let rooms = await getMyChatRoomsApi().catch(() => []);
        setChatRooms(rooms);
      } catch (err) {
        console.error("Failed to load users or chat rooms", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 새 메시지가 오면 DB를 다시 조회 (이제 백엔드에서 Redis 큐를 알아서 병합해주므로 정상 동작함)
  useEffect(() => {
    if (!currentUserId) return;
    getMyChatRoomsApi()
      .then(rooms => setChatRooms(rooms))
      .catch(err => console.error(err));
  }, [lastMessageTick, currentUserId]);

  // 검색 필터링 로직
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return mergedUsers;
    const q = searchQuery.toLowerCase();
    return mergedUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.handle && u.handle.toLowerCase().includes(q))
    );
  }, [mergedUsers, searchQuery]);

  const filteredChatRooms = useMemo(() => {
    if (!searchQuery.trim()) return chatRooms;
    const q = searchQuery.toLowerCase();
    return chatRooms.filter(r => 
      r.targetUserName.toLowerCase().includes(q) || 
      (r.lastMessage && r.lastMessage.toLowerCase().includes(q))
    );
  }, [chatRooms, searchQuery]);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background border-x border-border max-w-3xl mx-auto">
      {/* Header */}
      <header className="shrink-0 px-6 py-5 bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="text-primary" /> 
          메시지
        </h1>
      </header>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-border/50 bg-secondary/80 backdrop-blur-xl">
        <button 
          onClick={() => setActiveTab("LIST")}
          className={cn("flex-1 py-4 font-bold text-sm transition-colors relative", activeTab === "LIST" ? "text-white" : "text-slate-400 hover:text-slate-200")}
        >
          대화 목록
          {activeTab === "LIST" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
        </button>
        <button 
          onClick={() => setActiveTab("NEW")}
          className={cn("flex-1 py-4 font-bold text-sm transition-colors relative flex items-center justify-center gap-2", activeTab === "NEW" ? "text-white" : "text-slate-400 hover:text-slate-200")}
        >
          <Users size={16} /> 새로운 대화
          {activeTab === "NEW" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="shrink-0 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === "LIST" ? "대화방 또는 메시지 검색..." : "유저 검색..."}
            className="w-full bg-secondary border border-border rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "LIST" && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <p>대화방을 불러오는 중...</p>
              </div>
            ) : filteredChatRooms.length > 0 ? filteredChatRooms.map(room => (
              <Link href={`/chat/${room.roomId}`} key={room.roomId} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-border group">
                <div className="relative w-14 h-14 shrink-0 rounded-full bg-slate-800 border border-border flex items-center justify-center overflow-hidden shadow-lg group-hover:border-primary/50 transition-colors">
                  {room.targetUserProfileUrl ? (
                    <img src={room.targetUserProfileUrl} alt={room.targetUserName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-base truncate group-hover:text-primary transition-colors">{room.targetUserName}</h3>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">{room.lastMessageTime || ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-sm truncate pr-4">{room.lastMessage || '새로운 채팅방이 생성되었습니다.'}</p>
                    {room.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Search size={48} className="mb-4 opacity-50" />
                <p>대화방이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "NEW" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider">팔로잉 및 밴드 멤버</p>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <p>유저 정보를 불러오는 중...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <button 
                    onClick={async () => {
                      try {
                        const roomId = await createOrGetRoomApi(user.id);
                        router.push(`/chat/${roomId}`);
                      } catch (err) {
                        toast.error("채팅방을 생성할 수 없습니다.");
                      }
                    }}
                    key={user.id} 
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-border group text-left w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-slate-500" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors truncate">{user.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-slate-500 shrink-0">@{user.handle}</p>
                          {user.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 shrink-0 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors group-hover:text-white text-slate-400 border border-border group-hover:border-primary">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Users size={48} className="mb-4 opacity-50" />
                <p>대화할 유저가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
