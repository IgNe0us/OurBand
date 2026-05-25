"use client";
import { useContext } from "react";

// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, X, Check, MapPin, Play, Zap, Menu, Edit3, Video, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";;
import { useRouter } from 'next/navigation';
import type { LayoutContextType } from "@/components/layout/AppLayout";

const MOCK_PROFILES = [
  {
    id: 1,
    name: "Kim John",
    age: 28,
    inst: "Guitar",
    exp: "10년차",
    temp: 38.5,
    dist: "1.2km",
    loc: "홍대입구역",
    bio: "RHCP, John Mayer 류의 훵크/블루스 좋아합니다. 합주 지각 절대 안합니다.",
    tags: ["#Funk", "#Blues", "#오디오잼충만"],
    img: "guitarist"
  },
  {
    id: 2,
    name: "Sarah Lee",
    age: 24,
    inst: "Vocal",
    exp: "5년차",
    temp: 42.1,
    dist: "2.5km",
    loc: "합정역",
    bio: "팝/알앤비 주로 부릅니다. 톤이 독특하다는 이야기 많이 들어요. 매주 1회 합주 원해요!",
    tags: ["#R&B", "#Pop", "#코러스가능"],
    img: "singer"
  },
  {
    id: 3,
    name: "Park Drum",
    age: 31,
    inst: "Drum",
    exp: "15년차 (프로)",
    temp: 65.0,
    dist: "0.8km",
    loc: "상수역",
    bio: "칼박 보장. 메트로놈 없이도 텐션 유지 가능합니다. 메탈 빼고 다 칩니다.",
    tags: ["#칼박장인", "#Rock", "#장비보유"],
    img: "drummer"
  }
];

export default function MatchPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const { openMenu } = useContext(LayoutContext);
  const [activeTab, setActiveTab] = useState<"musicians" | "bands">("musicians");
  const [cards, setCards] = useState(MOCK_PROFILES);
  const [leaveDirection, setLeaveDirection] = useState<"left" | "right">("right");

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<typeof MOCK_PROFILES[0] | null>(null);
  const [postType, setPostType] = useState<"session" | "band">("session");
  const [postText, setPostText] = useState("");
  const [postVideo, setPostVideo] = useState<string | null>(null);
  const [postTags, setPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSwipe = (direction: "left" | "right", id: number) => {
    setLeaveDirection(direction);
    setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }, 50);
  };

  const handleMatchClick = () => {
    if (cards.length > 0) {
      const topCard = cards[cards.length - 1];
      setMatchedProfile(topCard);
      handleSwipe("right", topCard.id);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== "" && postTags.length < 5) {
      const newTag = tagInput.trim().startsWith("#") ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!postTags.includes(newTag)) {
        setPostTags([...postTags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostTags(postTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 z-20 absolute top-0 w-full bg-gradient-to-b from-background via-background/80 to-transparent md:pt-8 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">디스커버</h1>
          </div>
          <button 
            onClick={() => alert("필터 모달이 열립니다.")}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-border text-white hover:bg-white/20 transition-all"
          >
            <Filter size={18} />
          </button>
        </div>
        
        {/* Sleek Tabs */}
        <div className="flex bg-secondary/80 backdrop-blur-md p-1 rounded-2xl border border-border max-w-sm mx-auto">
          <button 
            onClick={() => setActiveTab("musicians")}
            className={cn("flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300", activeTab === "musicians" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
          >
            세션 찾기
          </button>
          <button 
            onClick={() => { setActiveTab("bands"); setCards([]); }} // empty cards just to show it handles state
            className={cn("flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300", activeTab === "bands" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
          >
            밴드 찾기
          </button>
        </div>
      </header>

      {/* Swipe Area */}
      <div className="flex-1 relative flex flex-col justify-center items-center mt-10">
        <AnimatePresence>
          {cards.map((profile, index) => {
            const isTop = index === cards.length - 1;
            return (
              <motion.div
                key={profile.id}
                className="absolute w-[90%] max-w-sm lg:max-w-md aspect-[3/4.2] bg-secondary rounded-[2rem] overflow-hidden shadow-2xl origin-bottom border border-border"
                style={{ zIndex: index }}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95 - (cards.length - 1 - index) * 0.05,
                  y: isTop ? 0 : (cards.length - 1 - index) * -20,
                  opacity: 1
                }}
                exit={{ 
                  x: leaveDirection === "left" ? -400 : 400, 
                  opacity: 0, 
                  rotate: leaveDirection === "left" ? -15 : 15,
                  transition: { duration: 0.3 } 
                }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handleSwipe("right", profile.id);
                  if (info.offset.x < -100) handleSwipe("left", profile.id);
                }}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
              >
                <img src={`https://picsum.photos/seed/${profile.img}/400/600`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Profile" referrerPolicy="no-referrer" />
                
                {/* Granular Gradients for sleek look */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />
                
                {/* Top Tags */}
                <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-[11px] font-semibold text-white/90">{profile.dist} • {profile.loc}</span>
                </div>

                <div className="absolute top-5 right-5 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-500/20">
                  <Zap size={12} className="text-white fill-white" />
                  <span className="text-[11px] font-bold text-white">음악력 {profile.temp}</span>
                </div>
                
                {/* Play Button */}
                <button 
                  onPointerDown={(e) => e.stopPropagation()} 
                  onClick={() => alert("자기소개 오디오가 재생됩니다.")}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center group hover:bg-white/20 transition-all z-10"
                >
                  <Play fill="currentColor" size={24} className="text-white ml-1.5 drop-shadow-lg group-hover:scale-110 transition-transform" />
                </button>

                {/* Info Block */}
                <div className="absolute bottom-0 w-full p-6 lg:p-8 text-white pointer-events-none">
                  <div className="mb-2 flex items-center gap-2">
                     <span className="bg-primary/90 text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">{profile.inst}</span>
                     <span className="bg-slate-800/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-md text-[10px] font-bold">{profile.exp}</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight flex items-end gap-2 drop-shadow-md">
                    {profile.name} <span className="text-lg font-medium text-white/70 mb-0.5">{profile.age}</span>
                  </h2>
                  <p className="text-sm lg:text-base text-slate-300 line-clamp-2 leading-relaxed font-light">{profile.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-medium border border-white/10 text-white/80">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="text-center text-slate-500 flex flex-col items-center">
            <Filter size={48} className="mb-4 opacity-50" />
            <p className="mb-4">주변의 모든 추천 프로필을 확인했습니다.</p>
            <button 
              onClick={() => setCards(MOCK_PROFILES)}
              className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold hover:bg-primary transition-colors text-sm"
            >
              다시 보기
            </button>
          </div>
        )}
      </div>

      {/* Controller Buttons */}
      <div className="absolute bottom-24 lg:bottom-12 w-full flex justify-center items-center gap-8 z-20">
        <button 
          onClick={() => { if (cards.length > 0) handleSwipe("left", cards[cards.length - 1].id) }}
          className="w-16 h-16 bg-secondary border border-border rounded-full flex items-center justify-center text-red-500 hover:bg-slate-800 hover:scale-110 transition-all shadow-xl"
        >
          <X size={28} strokeWidth={3} />
        </button>
        <button 
          onClick={handleMatchClick}
          className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-110 transition-all"
        >
          <Check size={36} strokeWidth={3.5} />
        </button>
      </div>

      {/* Write Post FAB */}
      <button 
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
      >
        <Edit3 size={24} />
      </button>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-secondary w-full max-w-lg rounded-[2rem] p-6 md:p-8 border border-border shadow-2xl relative my-auto mt-20"
            >
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-white mb-6">프로필 작성</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">어떤 목적으로 올리시나요?</label>
                  <div className="flex bg-background border border-border p-1 rounded-xl">
                    <button 
                      onClick={() => setPostType("session")}
                      className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors", postType === "session" ? "bg-primary text-white" : "text-slate-400 hover:text-white")}
                    >
                      세션 찾기 (내 어필)
                    </button>
                    <button 
                      onClick={() => setPostType("band")}
                      className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-colors", postType === "band" ? "bg-primary text-white" : "text-slate-400 hover:text-white")}
                    >
                      밴드 찾기 (팀원 구함)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">연주 영상 (필수)</label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center bg-background/50 text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                    <Video size={36} className="mb-3 opacity-50" />
                    <p className="font-bold text-sm text-center">터치하여 영상 업로드</p>
                    <p className="text-xs mt-1 text-slate-500">최대 1분 스와이프용 세로 영상 권장</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">한 줄 소개</label>
                  <textarea 
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="스와이프 피드에 보여질 짧고 강렬한 소개글을 작성해 주세요. (예: 10년차 베이시스트, 주말 합주 원해요)"
                    className="w-full bg-background border border-border rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-none placeholder-slate-600 mb-6"
                  />

                  <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-300 mb-3">태그 (선택, 최대 5개)</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleKeyDownTag}
                          placeholder="태그 입력 후 엔터 (예: #오디오잼충만)"
                          className="flex-1 bg-background border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-slate-600"
                        />
                        <button 
                          onClick={handleAddTag}
                          className="bg-secondary border border-border text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                        >
                          추가
                        </button>
                      </div>
                      {postTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {postTags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded-full text-[11px] font-bold">
                              {tag}
                              <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors flex items-center justify-center bg-black/20 rounded-full w-4 h-4">
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    alert("성공적으로 등록되었습니다! 주변 매칭 피드에 내 프로필이 노출됩니다.");
                    setIsWriteModalOpen(false);
                    setPostText("");
                    setPostTags([]);
                  }}
                  className="w-full bg-primary hover:bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Send size={18} />
                  피드에 올리기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matched Profile Modal */}
      <AnimatePresence>
        {matchedProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", scale: 0.9 }}
              className="bg-secondary w-full max-w-md rounded-[2rem] border border-border shadow-2xl relative my-auto mt-10 overflow-hidden flex flex-col"
            >
              <button 
                onClick={() => setMatchedProfile(null)}
                className="absolute top-4 right-4 text-white hover:text-white bg-black/40 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10 border border-white/10"
                type="button"
              >
                <X size={20} />
              </button>

              {/* Profile Image Banner */}
              <div className="relative w-full h-64 md:h-80 bg-slate-800">
                <img src={`https://picsum.photos/seed/${matchedProfile.img}/600/600`} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-black/30 pointer-events-none" />
                
                <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                       <span className="bg-primary text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">{matchedProfile.inst}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white flex items-end gap-2 drop-shadow-md">
                      {matchedProfile.name} <span className="text-lg font-medium text-white/70 mb-0.5">{matchedProfile.age}</span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-6 pb-8 flex flex-col gap-6">
                
                <div className="flex gap-4">
                  <div className="flex-1 bg-background/50 border border-border p-4 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-xs mb-1 font-bold">거리/지역</span>
                    <span className="text-white text-sm font-bold flex items-center gap-1"><MapPin size={12} className="text-primary"/> {matchedProfile.dist}</span>
                    <span className="text-slate-400 text-xs mt-0.5">{matchedProfile.loc}</span>
                  </div>
                  <div className="flex-1 bg-background/50 border border-border p-4 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-xs mb-1 font-bold">음악력</span>
                    <span className="text-white text-sm font-bold flex items-center gap-1"><Zap size={12} className="text-red-500 fill-red-500"/> {matchedProfile.temp}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-300 mb-2">자기 소개</h3>
                  <div className="bg-background/50 p-4 rounded-xl border border-border">
                    <p className="text-sm text-slate-300 leading-relaxed font-light">{matchedProfile.bio}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-300 mb-2">선호 스타일 및 태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchedProfile.tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-secondary border border-border rounded-full text-xs font-medium text-slate-300">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Message CTA Action */}
                <button 
                  onClick={() => {
                    navigate(`/chat/${matchedProfile.id}?type=offer&targetId=${matchedProfile.id}`);
                    setMatchedProfile(null);
                  }}
                  className="mt-4 w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-4 text-base rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle size={20} />
                  채팅 보내기
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
