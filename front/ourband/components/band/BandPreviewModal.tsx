"use client";
// @ts-nocheck
import { X, Users, Calendar, MapPin, Music, Play, Video, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { BandProfileData, BandHistory, getBandPostsApi, BandPostData, createApplicationApi } from "@/api/band/bandService";
import { getUserInfoApi } from "@/api/account/userService";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/store/userProfileContext";
import { VideoPostModal } from "./VideoPostModal";

interface BandPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandProfile: BandProfileData | null;
}

export function BandPreviewModal({ isOpen, onClose, bandProfile }: BandPreviewModalProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<BandPostData[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({ position: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVideo, setActiveVideo] = useState<number | string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { openUserProfile } = useUserProfile();

  useEffect(() => {
    if (isOpen) {
      getUserInfoApi()
        .then(user => setCurrentUserId(user.userId))
        .catch(() => setCurrentUserId(null));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && bandProfile?.id) {
      getBandPostsApi(bandProfile.id, "REHEARSAL")
        .then(posts => {
          setVideos(posts.filter(p => p.mediaType === "VIDEO" && p.mediaUrl).slice(0, 3));
        })
        .catch(console.error);
    } else {
      setIsApplying(false);
      setApplyForm({ position: "", message: "" });
      setVideos([]);
      setActiveVideo(null);
    }
  }, [isOpen, bandProfile?.id]);

  if (!bandProfile) return null;

  const isMember = bandProfile.positions?.some((m: any) => m.userId === currentUserId) || bandProfile.isLeader;

  // 모집 중인 포지션이 하나라도 있는지 확인
  const recruitingPositions = bandProfile.positions.filter(m => m.isRecruiting);
  const isAnyPositionRecruiting = recruitingPositions.length > 0;

  let parsedHistory: BandHistory[] = [];
  if (bandProfile.history) {
    parsedHistory = bandProfile.history;
  } else if (bandProfile.historyJson) {
    try {
      parsedHistory = JSON.parse(bandProfile.historyJson);
    } catch (e) {
      console.error("Failed to parse historyJson", e);
    }
  }

  const handleApply = async () => {
    if (!applyForm.position) {
      alert("지원할 포지션을 선택해주세요.");
      return;
    }
    
    const selectedPosition = bandProfile.positions.find(p => p.role === applyForm.position && p.isRecruiting);
    if (!selectedPosition || !selectedPosition.id) {
      alert("해당 포지션은 유효하지 않거나 모집 중이 아닙니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!bandProfile.id) throw new Error("밴드 정보가 없습니다.");
      await createApplicationApi(bandProfile.id, {
        bandMemberId: Number(selectedPosition.id),
        message: applyForm.message
      });
      alert("가입 신청이 완료되었습니다.");
      setIsApplying(false);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "가입 신청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-background rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Cover */}
              <div className="relative h-48 sm:h-56 shrink-0 bg-slate-900 group">
                {bandProfile.coverImage ? (
                  <img src={bandProfile.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-10"
                >
                  <X size={20} />
                </button>

                <div className="absolute bottom-6 left-6 flex items-end gap-4 h-full pt-10">
                  <div className="w-20 h-20 rounded-2xl border-4 border-background shadow-2xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
                    {bandProfile.logoImage ? <img src={bandProfile.logoImage} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users className="text-slate-500" size={32} />}
                  </div>
                  <div className="mb-1">
                    <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md">{bandProfile.name}</h2>
                    <p className="text-sm font-medium text-slate-300 drop-shadow-md">{bandProfile.genre}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 relative">
                
                {isApplying ? (
                  <div className="bg-secondary/80 border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-black text-white mb-4">가입 신청하기</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">지원할 포지션</label>
                        <select 
                          value={applyForm.position}
                          onChange={(e) => setApplyForm({...applyForm, position: e.target.value})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                        >
                          <option value="" disabled>포지션 선택</option>
                          {recruitingPositions.map(pos => (
                            <option key={pos.id} value={pos.role}>{pos.role}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">가입 인사 / 자기 소개</label>
                        <textarea 
                          value={applyForm.message}
                          onChange={(e) => setApplyForm({...applyForm, message: e.target.value})}
                          placeholder="밴드장에게 전할 메시지를 작성해주세요."
                          className="w-full bg-background border border-border rounded-xl p-4 text-sm text-white resize-none h-32 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setIsApplying(false)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                      >
                        취소
                      </button>
                      <button 
                        onClick={handleApply}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-primary hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                      >
                        {isSubmitting ? "신청 중..." : "신청 완료"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-secondary/50 rounded-2xl border border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Calendar size={14}/> 주기</div>
                        <div className="text-sm font-bold text-white">{bandProfile.frequency || '미정'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><MapPin size={14}/> 지역</div>
                        <div className="text-sm font-bold text-white">{bandProfile.location}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Music size={14}/> 장르</div>
                        <div className="text-sm font-bold text-white truncate">{bandProfile.genre}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Users size={14}/> 멤버</div>
                        <div className="text-sm font-bold text-white">{bandProfile.positions.filter(m => !m.isRecruiting).length}명</div>
                      </div>
                    </div>

                    {/* Videos (합주 영상) */}
                    {videos.length > 0 && (
                      <div>
                        <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-primary rounded-full"></span> 합주 영상
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {videos.map(video => (
                            <div 
                              key={video.id} 
                              onClick={() => setActiveVideo(video.id!)}
                              className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-border group cursor-pointer"
                            >
                              <video src={video.mediaUrl!} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                  <Play fill="currentColor" className="text-white ml-1" size={20} />
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-sm font-bold truncate">{video.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span> 밴드 소개
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-secondary/30 p-5 rounded-2xl border border-border">
                        {bandProfile.description || "등록된 소개가 없습니다."}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 border border-border px-2.5 py-1 rounded-lg">{bandProfile.genre}</span>
                      </div>
                    </div>

                    {/* Members */}
                    <div>
                      <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span> 현재 멤버
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {bandProfile.positions.map((member, idx) => (
                          <div key={`member-${idx}`} className={cn(
                            "px-3 py-2 rounded-xl text-sm font-medium border flex items-center gap-2",
                            member.isRecruiting ? "border-primary/50 text-primary bg-primary/10" : "border-border text-slate-300 bg-secondary"
                          )}>
                            {!member.isRecruiting && (
                              <div 
                                className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-border/50 cursor-pointer"
                                onClick={() => member.userId && openUserProfile(member.userId, member.memberName, member.profileImageUrl)}
                              >
                                {member.profileImageUrl ? (
                                  <img src={member.profileImageUrl} alt={member.memberName} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={12} className="m-auto h-full text-slate-400" />
                                )}
                              </div>
                            )}
                            <span className="font-bold">{member.role}</span>
                            {member.isRecruiting ? (
                              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wider animate-pulse ml-1">급구</span>
                            ) : (
                              <span className="text-xs text-slate-400">{member.memberName}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* History */}
                    {parsedHistory.length > 0 && (
                      <div className="pb-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-primary rounded-full"></span> 연혁
                        </h3>
                        <div className="space-y-4">
                          {parsedHistory.map((hist, idx) => (
                            <div key={`history-${idx}`} className="flex gap-4 group">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-slate-700 border-2 border-background group-hover:bg-primary transition-colors z-10" />
                                {idx !== parsedHistory.length - 1 && (
                                  <div className="w-0.5 h-full bg-border -mt-1 group-hover:bg-primary/30 transition-colors" />
                                )}
                              </div>
                              <div className="bg-secondary/40 border border-border p-4 rounded-xl flex-1 -mt-3 group-hover:border-primary/50 transition-colors">
                                <div className="text-xs font-bold text-primary mb-1">{hist.date}</div>
                                <div className="text-sm font-bold text-white">{hist.title}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions / Footer */}
              {!isApplying && (
                <div className="p-5 border-t border-border bg-background flex gap-3 shrink-0">
                  <button 
                    onClick={() => setIsApplying(true)}
                    disabled={isMember || !isAnyPositionRecruiting}
                    className={cn(
                      "flex-[3] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all w-full",
                      !isMember && isAnyPositionRecruiting 
                        ? "bg-primary hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white hover:scale-[1.02]" 
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-border"
                    )}
                  >
                    {isMember ? "현재 가입된 밴드입니다" : !isAnyPositionRecruiting ? "모집 마감됨" : "가입 신청하기"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <VideoPostModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        postId={activeVideo}
        bandId={bandProfile?.id || null}
      />
    </>
  );
}
