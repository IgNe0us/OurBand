"use client";
// @ts-nocheck
import { X, Send, Users, Calendar, MapPin, Music, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";;
import { useState } from "react";
import { VideoPostModal, type VideoPost } from "./VideoPostModal";

export interface BandPreviewData {
  id: number;
  name: string;
  genre: string;
  coverImage: string;
  logoImage: string;
  location: string;
  frequency: string;
  tags: string[];
  description: string;
  members: { role: string; name: string; isRecruiting: boolean }[];
  history: { id?: string; date: string; title: string }[];
  videos?: VideoPost[];
}

interface BandPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: BandPreviewData | null;
}

export function BandPreviewModal({ isOpen, onClose, band }: BandPreviewModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoPost | null>(null);

  if (!band) return null;

  // 모의 데이터: 현재 사용자의 포지션
  const myPosition = "건반"; 
  
  // 사용자의 포지션을 해당 밴드가 모집 중인지 확인
  const isMyPositionRecruiting = band.members.some(
    m => m.isRecruiting && m.role.includes(myPosition)
  );

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
                <img src={band.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-10"
                >
                  <X size={20} />
                </button>

                <div className="absolute bottom-6 left-6 flex items-end gap-4 h-full pt-10">
                  <div className="w-20 h-20 rounded-2xl border-4 border-background shadow-2xl overflow-hidden bg-slate-800 shrink-0">
                    <img src={band.logoImage} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="mb-1">
                    <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md">{band.name}</h2>
                    <p className="text-sm font-medium text-slate-300 drop-shadow-md">{band.genre}</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8">
                
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-secondary/50 rounded-2xl border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Calendar size={14}/> 주기</div>
                    <div className="text-sm font-bold text-white">{band.frequency}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><MapPin size={14}/> 지역</div>
                    <div className="text-sm font-bold text-white">{band.location}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Music size={14}/> 장르</div>
                    <div className="text-sm font-bold text-white truncate">{band.genre}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><Users size={14}/> 멤버</div>
                    <div className="text-sm font-bold text-white">{band.members.filter(m => !m.isRecruiting).length}명</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span> 밴드 소개
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-secondary/30 p-5 rounded-2xl border border-border">
                    {band.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {band.tags.map(tag => (
                      <span key={tag} className="text-xs font-bold text-slate-400 bg-slate-800 border border-border px-2.5 py-1 rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Videos */}
                {band.videos && band.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-black text-white mb-3">합주 영상</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {band.videos.map((video) => (
                        <div 
                          key={video.id} 
                          onClick={() => setSelectedVideo(video)}
                          className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col"
                        >
                          <div className="aspect-video relative overflow-hidden bg-slate-800 shrink-0">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <div className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary transition-colors">
                                <Play size={16} className="ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 text-left flex flex-col flex-1">
                            <div className="text-xs font-bold text-primary mb-1">{video.date}</div>
                            <h3 className="text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{video.title}</h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{video.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                <div>
                  <h3 className="text-lg font-black text-white mb-3">현재 멤버</h3>
                  <div className="flex flex-wrap gap-2">
                    {band.members.map((member, idx) => (
                      <div key={`${band.id || 'band'}-member-${idx}`} className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-medium border flex items-center gap-2",
                        member.isRecruiting ? "border-primary/50 text-primary bg-primary/10" : "border-border text-slate-300 bg-secondary"
                      )}>
                        <span>{member.role}</span>
                        {member.isRecruiting ? (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wider animate-pulse">급구</span>
                        ) : (
                          <span className="text-xs text-slate-400">{member.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* History */}
                <div className="pb-4">
                  <h3 className="text-lg font-black text-white mb-4">히스토리</h3>
                  <div className="space-y-4">
                    {band.history.map((hist, idx) => (
                      <div key={`${band.id || 'band'}-history-${idx}`} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-slate-700 border-2 border-background group-hover:bg-primary transition-colors z-10" />
                          {idx !== band.history.length - 1 && (
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

              </div>

              {/* Actions / Footer */}
              <div className="p-5 border-t border-border bg-background flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => {
                    alert("가입 신청이 완료되었습니다.");
                    onClose();
                  }}
                  disabled={!isMyPositionRecruiting}
                  className={cn(
                    "flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors",
                    isMyPositionRecruiting 
                      ? "bg-primary hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white" 
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-border"
                  )}
                >
                  {!isMyPositionRecruiting ? "내 포지션 모집이 마감되었습니다" : "가입 신청하기"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <VideoPostModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        post={selectedVideo}
      />
    </>
  );
}
