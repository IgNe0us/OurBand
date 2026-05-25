"use client";
import { useContext } from "react";

// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Users, Plus, Star, Filter, Heart, Menu, ArrowRight, Edit3, X, Bell, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";;
import type { LayoutContextType } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "motion/react";

const BANDS_RECRUITING = [
  { id: 1, name: "시티팝 밴드 네온사인", loc: "서울 마포구", genre: "시티팝, R&B", seeking: ["보컬", "베이스"], date: "2시간 전" },
  { id: 2, name: "메탈리카 헌정밴드", loc: "서울 강남구", genre: "헤비메탈", seeking: ["기타", "드럼"], date: "1일 전" },
  { id: 3, name: "어쿠스틱 감성 잼", loc: "경기 성남시", genre: "어쿠스틱, 포크", seeking: ["건반"], date: "방금 전" }
];

const MEMBERS_SEEKING = [
  { id: 1, name: "김기타 (28/남)", loc: "서울 관악구", inst: "기타", style: "블루스, 펑크", desc: "주말 합주 가능한 팀 찾습니다.", date: "1시간 전" },
  { id: 2, name: "박드럼 (32/여)", loc: "서울 강남구", inst: "드럼", style: "모든 장르", desc: "10년차 드러머입니다. 즉시 투입 가능", date: "3시간 전" }
];

// Mock API Data for Status
const MY_APPLICATIONS = [
  { id: 1, type: "apply", targetName: "시티팝 밴드 네온사인", role: "베이스 지원", status: "pending", time: "어제" },
  { id: 2, type: "offer", targetName: "김기타 (28/남)", role: "기타 영입 제안", status: "accepted", time: "3일 전" }
];

const RECEIVED_APPLICATIONS = [
  { id: 3, type: "received_apply", targetName: "박보컬 (24/남)", role: "보컬 지원", status: "pending", time: "2시간 전" }
];

export default function BandPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const [activeTab, setActiveTab] = useState<"bands" | "members" | "status">("bands");
  const { openMenu } = useContext(LayoutContext);
  
  // States for filtering & modals
  const [bandFilters, setBandFilters] = useState({ loc: "전체 지역", pos: "전체 포지션", liked: false });
  const [memberFilters, setMemberFilters] = useState({ loc: "전체 지역", pos: "전체 포지션", liked: false });
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  
  // Interaction Tracking States
  const [appliedBands, setAppliedBands] = useState<number[]>([]);
  const [offeredMembers, setOfferedMembers] = useState<number[]>([]);
  const [likedBands, setLikedBands] = useState<number[]>([]);
  const [likedMembers, setLikedMembers] = useState<number[]>([]);
  
  // Mock Notification State
  const [mockNotification, setMockNotification] = useState<{ isOpen: boolean; type: "apply" | "offer"; id: number } | null>(null);

  // Application Status State
  const [receivedApps, setReceivedApps] = useState(RECEIVED_APPLICATIONS);
  const [rejectModalTarget, setRejectModalTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleAcceptApp = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setReceivedApps(prev => prev.map(app => 
      app.id === id ? { ...app, status: "accepted" } : app
    ));
    alert("요청을 수락했습니다.");
  };

  const openRejectApp = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRejectModalTarget(id);
    setRejectReason("");
  };

  const handleRejectAppSubmit = () => {
    if (rejectModalTarget !== null) {
      setReceivedApps(prev => prev.map(app => 
        app.id === rejectModalTarget ? { ...app, status: "rejected" } : app
      ));
      setRejectModalTarget(null);
      setRejectReason("");
      alert("요청을 거절했습니다.");
    }
  };

  // Filter Logic
  const filteredBands = BANDS_RECRUITING.filter(band => {
    const matchLoc = bandFilters.loc === "전체 지역" || band.loc.includes(bandFilters.loc);
    const matchPos = bandFilters.pos === "전체 포지션" || band.seeking.includes(bandFilters.pos);
    const matchLiked = !bandFilters.liked || likedBands.includes(band.id);
    return matchLoc && matchPos && matchLiked;
  });

  const filteredMembers = MEMBERS_SEEKING.filter(member => {
    const matchLoc = memberFilters.loc === "전체 지역" || member.loc.includes(memberFilters.loc);
    const matchPos = memberFilters.pos === "전체 포지션" || member.inst.includes(memberFilters.pos);
    const matchLiked = !memberFilters.liked || likedMembers.includes(member.id);
    return matchLoc && matchPos && matchLiked;
  });

  const currentFilters = activeTab === "bands" ? bandFilters : memberFilters;
  const updateFilter = (key: "loc" | "pos" | "liked", value: string | boolean) => {
    if (activeTab === "bands") setBandFilters(prev => ({ ...prev, [key]: value }));
    else if (activeTab === "members") setMemberFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleLikeBand = (id: number) => {
    setLikedBands(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
  };

  const toggleLikeMember = (id: number) => {
    setLikedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const handleApply = (bandId: number) => {
    if (appliedBands.includes(bandId)) return;
    alert("지원서가 전송되었습니다.");
    setAppliedBands(prev => [...prev, bandId]);
    setMockNotification({ isOpen: true, type: "apply", id: bandId });
    setTimeout(() => setMockNotification(null), 5000);
  };

  const handleOffer = (memberId: number) => {
    if (offeredMembers.includes(memberId)) return;
    alert("영입 제안이 전송되었습니다.");
    setOfferedMembers(prev => [...prev, memberId]);
    setMockNotification({ isOpen: true, type: "offer", id: memberId });
    setTimeout(() => setMockNotification(null), 5000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-20 overflow-x-hidden">
      
      {/* MOCK PUSH NOTIFICATION (Simulating the receiver's perspective) */}
      <AnimatePresence>
        {mockNotification?.isOpen && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
          >
            <div 
              onClick={() => navigate(`/chat/${mockNotification.id}?type=${mockNotification.type}&targetId=${mockNotification.id}`)}
              className="bg-secondary border border-primary/50 shadow-[0_10px_40px_rgba(99,102,241,0.3)] rounded-2xl p-4 w-full max-w-md cursor-pointer hover:bg-slate-800 transition-colors flex gap-4"
            >
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Bell className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-primary mb-1">[테스트 알림: 상대방 시점]</p>
                <h4 className="text-sm font-bold text-white mb-1">
                  {mockNotification.type === "apply" 
                    ? "새로운 밴드 지원자가 있습니다!" 
                    : "새로운 밴드 영입 제안이 왔습니다!"}
                </h4>
                <p className="text-xs text-slate-400">클릭하여 채팅방을 열고 수락/거절을 선택하세요.</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setMockNotification(null); }}
                className="text-slate-500 hover:text-white self-start"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 pt-12 md:pt-8 bg-background/80 backdrop-blur-xl z-20 sticky top-0 md:px-8 border-b border-border">
        <div className="flex items-center justify-between mb-5 pr-14 md:pr-16">
          <div className="flex items-center gap-4">
            <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-white mb-0">Discover</h1>
          </div>
          <button className="w-10 h-10 border border-border bg-secondary/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
            <Search size={18} />
          </button>
        </div>

        {/* Create Band Banner Call to Action */}
        <Link href="/band/create" 
           className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-4 mb-6 hover:from-indigo-500/20 hover:to-purple-600/20 transition-all group"
         >
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
               <Users size={20} className="text-white" />
             </div>
             <div>
               <h3 className="text-white font-bold text-sm md:text-base">나만의 밴드를 만들고 싶나요?</h3>
               <p className="text-slate-400 text-xs mt-1">지금 바로 밴드를 결성하고 멤버를 모아보세요.</p>
             </div>
           </div>
           <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <div className="flex gap-6 mt-2 relative overflow-x-auto hide-scrollbar whitespace-nowrap">
          {[
            { id: "bands", label: "구인 (합류)" }, 
            { id: "members", label: "구직 (영입)" }, 
            { id: "status", label: "지원 현황" }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm md:text-base font-bold transition-colors relative shrink-0",
                activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-400"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="band-tab" className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        
        {/* Filters (Hidden on Status Tab) */}
        {activeTab !== "status" && (
          <div className="flex justify-start gap-2 overflow-x-auto hide-scrollbar pb-2">
             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-bold text-slate-300 shrink-0 cursor-default">
               <Filter size={14} /> 필터
             </button>

             <button 
               onClick={() => updateFilter("liked", !currentFilters.liked)}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors shrink-0",
                 currentFilters.liked ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300 hover:text-white cursor-pointer"
               )}
             >
               찜한 목록
             </button>
             
             <div className="relative shrink-0">
               <select 
                 value={currentFilters.loc} 
                 onChange={(e) => updateFilter("loc", e.target.value)}
                 className={cn(
                   "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                   currentFilters.loc !== "전체 지역" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                 )}
               >
                 <option value="전체 지역">전체 지역</option>
                 <option value="서울">서울</option>
                 <option value="경기">경기</option>
               </select>
               <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
             </div>

             <div className="relative shrink-0">
               <select 
                 value={currentFilters.pos} 
                 onChange={(e) => updateFilter("pos", e.target.value)}
                 className={cn(
                   "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                   currentFilters.pos !== "전체 포지션" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                 )}
               >
                 <option value="전체 포지션">전체 포지션</option>
                 <option value="보컬">보컬</option>
                 <option value="기타">기타</option>
                 <option value="베이스">베이스</option>
                 <option value="드럼">드럼</option>
                 <option value="건반">건반</option>
               </select>
               <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
             </div>
          </div>
        )}

        {/* Content Tabs */}
        {activeTab === "bands" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBands.length > 0 ? filteredBands.map(band => (
              <div key={band.id} className="bg-secondary/40 border border-border rounded-[1.5rem] p-5 flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                      <img src={`https://picsum.photos/seed/band${band.id}/100/100`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base md:text-lg">{band.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {band.loc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{band.date}</span>
                </div>
                
                <div className="bg-background/50 rounded-xl p-3 mb-4 border border-border/50">
                  <p className="text-xs text-slate-400 mb-1">모집 파트</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {band.seeking.map(inst => (
                      <span key={inst} className="bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-bold px-2 py-1 rounded-md">{inst} 구함</span>
                    ))}
                    <span className="bg-secondary text-slate-300 border border-border text-[11px] font-bold px-2 py-1 rounded-md">{band.genre}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => handleApply(band.id)} 
                    disabled={appliedBands.includes(band.id)}
                    className={cn(
                      "flex-1 text-sm font-bold py-2.5 rounded-xl transition-all",
                      appliedBands.includes(band.id)
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-primary text-white hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    )}
                  >
                    {appliedBands.includes(band.id) ? "지원 완료" : "지원하기"}
                  </button>
                  <button 
                    onClick={() => toggleLikeBand(band.id)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center border rounded-xl transition-colors shrink-0",
                      likedBands.includes(band.id) 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                        : "border-border text-slate-400 hover:text-rose-500 hover:border-rose-500/30 bg-secondary"
                    )}
                  >
                    <Heart size={18} className={cn(likedBands.includes(band.id) && "fill-rose-500")} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-500">
                조건에 맞는 밴드가 없습니다.
              </div>
            )}
          </div>
        ) : activeTab === "members" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredMembers.length > 0 ? filteredMembers.map(member => (
              <div key={member.id} className="bg-secondary/40 border border-border rounded-[1.5rem] p-5 flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                      <img src={`https://picsum.photos/seed/member${member.id}/100/100`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base md:text-lg">{member.name}  <span className="text-primary text-xs ml-1 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">{member.inst}</span></h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {member.loc} • {member.style}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{member.date}</span>
                </div>
                
                <p className="text-sm text-slate-300 mb-4 bg-background/50 p-3 rounded-xl border border-border/50">"{member.desc}"</p>

                <div className="flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => handleOffer(member.id)} 
                    disabled={offeredMembers.includes(member.id)}
                    className={cn(
                      "flex-1 text-sm font-bold py-2.5 rounded-xl transition-all",
                      offeredMembers.includes(member.id)
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-white text-black hover:scale-[1.02]"
                    )}
                  >
                    {offeredMembers.includes(member.id) ? "제안 완료" : "영입 제안"}
                  </button>
                  <button 
                    onClick={() => toggleLikeMember(member.id)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center border rounded-xl transition-colors shrink-0",
                      likedMembers.includes(member.id) 
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                        : "border-border text-slate-400 hover:text-yellow-500 hover:border-yellow-500/30 bg-secondary"
                    )}
                  >
                    <Star size={18} className={cn(likedMembers.includes(member.id) && "fill-yellow-500")} />
                  </button>
                </div>
              </div>
            )) : (
               <div className="text-center py-10 text-slate-500">
                 조건에 맞는 멤버가 없습니다.
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Tab Design */}
            
            <section>
              <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <ClipboardList size={16} /> 받은 요청 (내 공고)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {receivedApps.map(req => (
                  <div key={`recv-${req.id}`} onClick={() => navigate(`/chat/${req.id}?type=apply&targetId=${req.id}`)} className="bg-secondary border border-border rounded-xl p-4 flex flex-col cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                          <img src={`https://picsum.photos/seed/user${req.id}/50/50`} />
                        </div>
                        <div>
                          <h4 className="text-white text-sm font-bold">{req.targetName}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{req.role} • {req.time}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {req.status === "pending" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><Clock size={12} /> 응답 대기</span>
                        ) : req.status === "accepted" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 size={12} /> 수락완료</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"><X size={12} /> 거절됨</span>
                        )}
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2 mt-2 pt-3 border-t border-border">
                        <button onClick={(e) => handleAcceptApp(e, req.id)} className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold py-2 rounded-lg transition-colors">수락하기</button>
                        <button onClick={(e) => openRejectApp(e, req.id)} className="flex-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold py-2 rounded-lg transition-colors">거절하기</button>
                      </div>
                    )}
                    {req.status !== "pending" && (
                       <div className="mt-2 text-right">
                         <span className="text-[10px] text-primary">채팅방 이동 &rarr;</span>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <ClipboardList size={16} /> 내가 보낸 요청
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {MY_APPLICATIONS.map(req => (
                  <div key={`my-${req.id}`} onClick={() => navigate(`/chat/${req.id}?type=${req.type}&targetId=${req.id}`)} className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {req.type === "apply" ? <img src={`https://picsum.photos/seed/b${req.id}/50/50`} /> : <img src={`https://picsum.photos/seed/user${req.id}/50/50`} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold border", req.type === "apply" ? "text-indigo-400 border-indigo-400/30 bg-indigo-400/10" : "text-rose-400 border-rose-400/30 bg-rose-400/10")}>
                            {req.type === "apply" ? "지원" : "제안"}
                          </span>
                          <h4 className="text-white text-sm font-bold">{req.targetName}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{req.role} • {req.time}</p>
                      </div>
                    </div>
                    <div>
                      {req.status === "pending" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><Clock size={12} /> 심사중</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 size={12} /> 수락됨</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
          </div>
        )}
      </main>

      {/* Write Post FAB */}
      {activeTab !== "status" && (
        <button 
          onClick={() => setIsWriteModalOpen(true)}
          className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
        >
          <Edit3 size={24} />
        </button>
      )}

      {/* Write Post Modal */}
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
              
              <h2 className="text-2xl font-black text-white mb-6">구인구직 작성</h2>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("성공적으로 글이 등록되었습니다!");
                  setIsWriteModalOpen(false);
                }} 
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">게시 유형</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-center gap-2 bg-background border border-border rounded-xl p-3.5 cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <input type="radio" name="postType" value="recruit" defaultChecked className="hidden" />
                      <span className="text-white text-sm font-bold">밴드 구인 (멤버 구함)</span>
                    </label>
                    <label className="flex items-center justify-center gap-2 bg-background border border-border rounded-xl p-3.5 cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <input type="radio" name="postType" value="seek" className="hidden" />
                      <span className="text-white text-sm font-bold">개인 구직 (밴드 구함)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">대상 포지션</label>
                  <div className="relative">
                    <select defaultValue="" className="w-full bg-background border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer" required>
                      <option value="" disabled>포지션을 선택하세요</option>
                      <option value="보컬">보컬</option>
                      <option value="기타">기타</option>
                      <option value="베이스">베이스</option>
                      <option value="드럼">드럼</option>
                      <option value="건반">건반/피아노</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">제목 / 한 줄 소개</label>
                  <input type="text" placeholder="예: [보컬] 주말 합주 펑크 밴드 모집합니다" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">상세 내용 (조건, 스타일 등)</label>
                  <textarea rows={4} placeholder="경력, 장르, 합주 가능 시간, 기타 조건 등을 자세히 적어주세요!" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" required />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl py-4 mt-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                >
                  등록하기
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {rejectModalTarget !== null && (
          <motion.div 
            key="reject-app-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button onClick={() => setRejectModalTarget(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-2">요청 거절</h2>
              <p className="text-sm text-slate-400 mb-6">거절 사유를 작성해 주세요. (선택사항)</p>
              
              <div className="space-y-4">
                <textarea 
                  rows={4}
                  placeholder="예: 현재 모집 포지션과 맞지 않아 거절합니다."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
                
                <button 
                  onClick={handleRejectAppSubmit}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl py-4 mt-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  거절하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
