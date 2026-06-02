"use client";
// @ts-nocheck

import { X, UserPlus, UserCheck, MessageCircle, MapPin, Music2, Users2, Guitar, History, Disc, Play, ThumbsUp, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AudioJamModal, type PopularJamVideo } from "../jam/AudioJamModal";
import { cn, translateInstrument } from "@/lib/utils";
import { getUserProfileApi, toggleFollowApi, getUserInfoApi } from "@/api/account/userService";
import { createOrGetRoomApi } from "@/api/chat/chatService";
import toast from "react-hot-toast";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | number;
  userName?: string;
  userImage?: string;
}

export function UserProfileModal({ isOpen, onClose, userId = 1, userName, userImage }: UserProfileModalProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          try {
            const loggedInUser = await getUserInfoApi();
            setLoggedInUserId(loggedInUser.userId);
          } catch (e) {
            // not logged in
          }

          const data = await getUserProfileApi(Number(userId));
          setProfileData(data);
          // 💡 Ensure isFollowing state reflects the API response if it exists in the DTO
          // Jackson serializes boolean 'isFollowing' as 'following'
          if (data.isFollowing !== undefined) {
             setIsFollowing(data.isFollowing);
          } else if (data.following !== undefined) {
             setIsFollowing(data.following);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          toast.error("프로필 정보를 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, userId]);

  const handleToggleFollow = async () => {
    try {
      const response = await toggleFollowApi(Number(userId));
      setIsFollowing(response.isFollowing);
      toast.success(response.isFollowing ? "팔로우 했습니다." : "언팔로우 했습니다.");
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("팔로우 요청에 실패했습니다.");
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto hide-scrollbar bg-background border border-border rounded-3xl shadow-2xl relative flex flex-col"
          >
            {/* Cover */}
            <div 
              className={cn(
                "h-28 border-b border-border/50 shrink-0 relative bg-cover bg-center",
                !profileData?.coverImageUrl && "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
              )}
              style={profileData?.coverImageUrl ? { backgroundImage: `url(${profileData.coverImageUrl})` } : undefined}
            >
              {profileData?.coverImageUrl && (
                <div className="absolute inset-0 bg-black/20" />
              )}
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors z-10">
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="px-6 pb-6 relative pt-12 text-left shrink-0">
              <div 
                className="absolute -top-14 left-6 w-24 h-24 rounded-full border-4 border-background bg-slate-800 overflow-hidden shadow-lg cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${userId}`);
                }}
              >
                {userImage || profileData?.profilePictureUrl ? (
                  <img src={userImage || profileData?.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <User size={48} className="text-slate-500" />
                  </div>
                )}
              </div>
              
              {Number(userId) !== loggedInUserId && (
                <div className="flex justify-end gap-2 w-full mb-6 relative z-10 -mt-8">
                  <button 
                    onClick={handleToggleFollow}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-1.5",
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
                    onClick={async () => {
                      try {
                        const roomId = await createOrGetRoomApi(Number(userId));
                        onClose();
                        navigate(`/chat/${roomId}`);
                      } catch (e) {
                        toast.error("채팅방을 열 수 없습니다.");
                      }
                    }}
                    className="bg-secondary border border-border hover:bg-slate-800 text-white p-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              )}

              <h3 
                className="text-2xl font-black text-white mb-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-2 w-fit"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${userId}`);
                }}
              >
                {userName || profileData?.nickname || "유저 이름"}
              </h3>
              
              {profileData?.instrument ? (
                <p className="text-sm text-primary font-bold mb-3">{translateInstrument(profileData.instrument)}</p>
              ) : (
                <p className="text-sm text-slate-500 font-medium mb-3">포지션 미설정</p>
              )}
              
              {profileData?.location ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 border border-border/50 bg-secondary/50 rounded-xl py-1.5 px-3 inline-flex">
                  <MapPin size={14} /> {profileData.location}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 border border-border/50 bg-secondary/30 rounded-xl py-1.5 px-3 inline-flex">
                  <MapPin size={14} /> 지역 미설정
                </div>
              )}
              
              {profileData?.bio ? (
                <p className="text-sm text-slate-300 leading-relaxed mb-8 font-light whitespace-pre-wrap">
                  {profileData.bio}
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed mb-8 italic">
                  작성된 자기소개가 없습니다.
                </p>
              )}
              
              <div className="space-y-8 border-t border-border/50 pt-8">
                {/* Posts & Videos */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <History size={16} className="text-primary"/> 히스토리
                  </h4>
                  {profileData?.histories && profileData.histories.length > 0 ? (
                    <div className="flex flex-row overflow-x-auto gap-3 pb-2 hide-scrollbar">
                      {profileData.histories.slice(0, 3).map((history: any) => (
                          <div 
                            key={history.id}
                            onClick={() => setSelectedActivity(history)}
                            className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col relative shrink-0 w-32 md:w-36 cursor-pointer" 
                          >
                            <div className="relative overflow-hidden bg-slate-800 shrink-0 aspect-[3/4]">
                              {history.mediaUrl ? (
                                history.mediaType?.toUpperCase() === "VIDEO" ? (
                                  <video src={history.mediaUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" preload="metadata" muted playsInline />
                                ) : (
                                  <img src={history.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100" alt="history" referrerPolicy="no-referrer" />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 opacity-50">
                                  <History size={32} className="text-slate-500" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:bg-black/40 transition-colors" />
                              {history.mediaType?.toUpperCase() === "VIDEO" && (
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                  <div className="w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all shadow-lg">
                                    <Play size={12} className="ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-3 text-left flex flex-col flex-1 bg-secondary/20">
                              <h4 className="text-xs font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors leading-snug">{history.title}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{history.content}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 bg-secondary/30 p-4 rounded-xl border border-border/50 text-center">
                      최근 히스토리 내역이 없습니다.
                    </div>
                  )}
                </section>

                {/* 소속 밴드 */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Users2 size={16} className="text-primary"/> 소속 밴드
                  </h4>
                  {profileData?.bands && profileData.bands.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {profileData.bands.map((band: any) => (
                        <div key={band.bandId} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                              {band.logoImageUrl ? (
                                <img src={band.logoImageUrl} className="w-full h-full object-cover" alt="band"/>
                              ) : (
                                <Users2 className="w-full h-full p-2 text-slate-500"/>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white leading-tight">{band.bandName}</div>
                              {band.genre && <div className="text-xs text-slate-400">{band.genre}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 bg-secondary/30 p-4 rounded-xl border border-border/50 text-center">
                      소속된 밴드가 없습니다.
                    </div>
                  )}
                </section>

                {/* 사용 장비 */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Guitar size={16} className="text-primary"/> 사용 장비 (Gear)
                  </h4>
                  {profileData?.gears && profileData.gears.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-300 bg-secondary/30 p-4 rounded-xl border border-border/50">
                      {profileData.gears.map((gear: any) => (
                        <li key={gear.id} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary/50 flex-shrink-0 mt-1.5 rounded-full" />
                          {gear.gearName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500 bg-secondary/30 p-4 rounded-xl border border-border/50 text-center">
                      등록된 장비가 없습니다.
                    </div>
                  )}
                </section>

                {/* Favorite Music */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Disc size={16} className="text-primary"/> 좋아하는 곡
                  </h4>
                  {profileData?.favoriteMusics && profileData.favoriteMusics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.favoriteMusics.map((music: any) => (
                        <span key={music.id} className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">
                          {music.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 bg-secondary/30 p-4 rounded-xl border border-border/50 text-center">
                      등록된 선호 곡이 없습니다.
                    </div>
                  )}
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AudioJamModal 
      isOpen={!!selectedActivity} 
      onClose={() => setSelectedActivity(null)} 
      post={selectedActivity ? {
        id: String(selectedActivity.id),
        title: selectedActivity.title,
        thumbnail: selectedActivity.mediaUrl || "https://picsum.photos/seed/default/600/800", 
        description: selectedActivity.content, 
        likes: selectedActivity.likeCount,
        date: "방금 전",
        likedByMe: selectedActivity.likedByMe, 
        sharesCount: selectedActivity.shareCount,
        author: userName || profileData?.nickname || "유저 이름",
        authorAvatar: userImage || profileData?.profilePictureUrl,
        type: selectedActivity.mediaType?.toUpperCase() === "VIDEO" ? "video" : "post"
      } : null as any} 
      isHistory={true}
    />
    </>
  );
}
