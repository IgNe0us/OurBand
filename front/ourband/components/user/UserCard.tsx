"use client";

import { UserPlus, UserCheck, MessageCircle, MapPin, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowApi, type UserSearchResult } from "@/api/account/userService";
import { createOrGetRoomApi } from "@/api/chat/chatService";
import { UserProfileModal } from "@/components/common/UserProfileModal";
import { cn, translateInstrument } from "@/lib/utils";
import toast from "react-hot-toast";

interface UserCardProps {
  user: UserSearchResult;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await toggleFollowApi(user.userId);
      setIsFollowing(response.isFollowing);
      toast.success(response.isFollowing ? "팔로우 했습니다." : "언팔로우 했습니다.");
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("팔로우 요청에 실패했습니다.");
    }
  };

  const handleChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const roomId = await createOrGetRoomApi(user.userId);
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error("Failed to create/get chat room:", error);
      toast.error("채팅방을 열 수 없습니다.");
    }
  };

  return (
    <>
      <div 
        className="bg-secondary/40 border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden shadow-lg"
        onClick={() => setIsProfileModalOpen(true)}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-transparent group-hover:border-primary/50 transition-colors shrink-0">
            {user.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon size={32} className="text-slate-500" />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">
              {user.nickname}
            </h3>
            {user.instrument ? (
              <p className="text-sm text-primary font-medium truncate">{translateInstrument(user.instrument)}</p>
            ) : (
              <p className="text-sm text-slate-500 font-medium truncate">포지션 미설정</p>
            )}
            {user.location && (
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                <MapPin size={12} /> {user.location}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button 
            onClick={handleToggleFollow}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-1.5",
              isFollowing
                ? "bg-secondary border border-border text-white hover:bg-slate-800 shadow-none"
                : "bg-primary text-white hover:bg-indigo-600 shadow-primary/20"
            )}
          >
            {isFollowing ? (
              <><UserCheck size={16} /> 언팔로우</>
            ) : (
              <><UserPlus size={16} /> 팔로우</>
            )}
          </button>
          <button 
            onClick={handleChat}
            className="bg-secondary border border-border hover:bg-slate-800 text-white p-2 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        userId={user.userId} 
        userName={user.nickname} 
        userImage={user.profilePictureUrl || undefined}
      />
    </>
  );
}
