"use client";
import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, X, Check, MapPin, Play, Pause, Volume2, VolumeX, Maximize, Zap, Menu, Edit3, Video, Send, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useUserProfile } from "@/store/userProfileContext";
import { LayoutContext } from "@/components/layout/AppLayout";
import toast from "react-hot-toast";

import { getUserInfoApi } from "@/api/account/userService";
import { getSeekingPostsApi, MemberSeekingPostData, sendOfferApi } from "@/api/recruitment/recruitmentService";
import { getAllBandsApi, BandListData, getMyBandsApi, BandProfileData, getBandProfileApi } from "@/api/band/bandService";
import { BandPreviewModal } from "@/components/band/BandPreviewModal";

const SwipeVideoPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  return (
    <>
      <video 
        ref={videoRef}
        src={src} 
        autoPlay 
        muted={isMuted} 
        loop 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
      />
      <div 
        className="absolute bottom-32 right-5 flex flex-col gap-4 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 z-20 shadow-xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button onClick={toggleMute} className="text-white hover:text-primary transition" title="음소거/해제">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button onClick={togglePlay} className="text-white hover:text-primary transition" title="재생/일시정지">
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition" title="전체화면">
          <Maximize size={20} />
        </button>
      </div>
    </>
  );
};

export default function MatchPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { openUserProfile } = useUserProfile();
  const { openMenu } = useContext(LayoutContext);
  
  const [activeTab, setActiveTab] = useState<"musicians" | "bands">("musicians");
  const [leaveDirection, setLeaveDirection] = useState<"left" | "right">("right");

  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data for cards
  const [musicianCards, setMusicianCards] = useState<MemberSeekingPostData[]>([]);
  const [bandCards, setBandCards] = useState<BandListData[]>([]);

  // My bands for offer modal
  const [myBands, setMyBands] = useState<MyBandData[]>([]);

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [postType, setPostType] = useState<"session" | "band">("session");
  const [postText, setPostText] = useState("");
  const [postTags, setPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Offer Modal State (for musicians tab)
  const [offerModalTarget, setOfferModalTarget] = useState<MemberSeekingPostData | null>(null);
  const [offerForm, setOfferForm] = useState({ bandId: "", position: "", message: "" });
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isTargetAlreadyMember, setIsTargetAlreadyMember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Application Modal State (for bands tab)
  const [selectedPreviewBand, setSelectedPreviewBand] = useState<BandProfileData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getUserInfoApi();
      setCurrentUser(user);
      
      const myBandsRes = await getMyBandsApi();
      setMyBands(myBandsRes.filter(b => b.isLeader));

      let userCity = "";
      if (user.location) {
        userCity = user.location.split(" ")[0]; // e.g., "서울 강남구" -> "서울"
      }

      // Fetch Musicians (Seeking Posts)
      const postsRes = await getSeekingPostsApi();
      // Find my own post to get my seeking location
      const myPost = postsRes.find(p => p.userId === user.userId);
      const mySeekingCity = myPost ? myPost.location.split(" ")[0] : userCity;

      const filteredPosts = postsRes.filter(p => p.userId !== user.userId && (mySeekingCity === "" || p.location.startsWith(mySeekingCity)));
      setMusicianCards(filteredPosts);

      // Fetch Bands
      const bandsRes = await getAllBandsApi({ recruitingOnly: true });
      const filteredBands = bandsRes.content.filter(b => 
        (userCity === "" || b.location.startsWith(userCity)) && 
        !myBandsRes.some(myb => myb.id === b.id)
      );
      setBandCards(filteredBands);

    } catch (error) {
      console.error("Failed to load match data", error);
    }
  };

  useEffect(() => {
    if (offerForm.bandId && offerModalTarget) {
      const fetchPositions = async () => {
        try {
          setIsLoadingPositions(true);
          const profile = await getBandProfileApi(offerForm.bandId);
          const isMember = profile.positions.some(p => p.userId === offerModalTarget.userId);
          setIsTargetAlreadyMember(isMember);
          setAvailablePositions(profile.positions.filter(p => p.isRecruiting).map(p => p.role));
        } catch (err) {
          console.error("Failed to load band positions for offer", err);
          setAvailablePositions([]);
        } finally {
          setIsLoadingPositions(false);
        }
      };
      fetchPositions();
    } else {
      setAvailablePositions([]);
      setIsTargetAlreadyMember(false);
    }
  }, [offerForm.bandId, offerModalTarget]);

  const handleSwipe = (direction: "left" | "right", id: number) => {
    setLeaveDirection(direction);
    setTimeout(() => {
      if (activeTab === "musicians") {
        setMusicianCards(prev => prev.filter(c => c.id !== id));
      } else {
        setBandCards(prev => prev.filter(c => c.id !== id));
      }
    }, 50);
  };

  const handleMatchClick = () => {
    if (activeTab === "musicians" && musicianCards.length > 0) {
      const topCard = musicianCards[musicianCards.length - 1];
      setOfferModalTarget(topCard);
      // Wait for modal to handle the swipe after success/close
    } else if (activeTab === "bands" && bandCards.length > 0) {
      const topCard = bandCards[bandCards.length - 1];
      const fetchPreview = async () => {
        setIsPreviewLoading(true);
        try {
          const profile = await getBandProfileApi(String(topCard.id));
          setSelectedPreviewBand(profile);
        } catch (err) {
          console.error("밴드 프로필 조회 실패:", err);
        } finally {
          setIsPreviewLoading(false);
        }
      };
      fetchPreview();
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalTarget) return;
    if (!offerForm.bandId || !offerForm.position) {
      toast.error("밴드와 제안할 포지션을 선택해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendOfferApi({
        bandId: Number(offerForm.bandId),
        targetUserId: offerModalTarget.userId,
        seekingPostId: offerModalTarget.id,
        position: offerForm.position,
        message: offerForm.message
      });
      toast.success("영입 제안이 전송되었습니다.");
      handleSwipe("right", offerModalTarget.id);
      setOfferModalTarget(null);
      setOfferForm({ bandId: "", position: "", message: "" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "영입 제안에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
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
            onClick={() => toast.error("필터 모달이 열립니다.")}
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
            onClick={() => setActiveTab("bands")}
            className={cn("flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300", activeTab === "bands" ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
          >
            밴드 찾기
          </button>
        </div>
      </header>

      {/* Swipe Area */}
      <div className="flex-1 relative flex flex-col justify-center items-center mt-10">
        <AnimatePresence>
          {activeTab === "musicians" && musicianCards.map((profile, index) => {
            const isTop = index === musicianCards.length - 1;
            const bgImage = profile.mediaUrl || profile.authorProfileImageUrl;
            return (
              <motion.div
                key={profile.id}
                className="absolute w-[90%] max-w-sm lg:max-w-md aspect-[3/4.2] bg-secondary rounded-[2rem] overflow-hidden shadow-2xl origin-bottom border border-border"
                style={{ zIndex: index }}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95 - (musicianCards.length - 1 - index) * 0.05,
                  y: isTop ? 0 : (musicianCards.length - 1 - index) * -20,
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
                {profile.mediaType === "VIDEO" && profile.mediaUrl ? (
                  <SwipeVideoPlayer src={profile.mediaUrl} />
                ) : bgImage ? (
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800 pointer-events-none">
                    <User size={80} className="text-slate-500" />
                  </div>
                )}
                
                {/* Granular Gradients for sleek look */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />
                
                {/* Top Tags */}
                <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-[11px] font-semibold text-white/90">{profile.location}</span>
                </div>

                <div className="absolute top-5 right-5 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-500/20">
                  <Zap size={12} className="text-white fill-white" />
                  <span className="text-[11px] font-bold text-white">음악력 {profile.potential || 0}</span>
                </div>

                {/* Info Block */}
                <div className="absolute bottom-0 w-full p-6 lg:p-8 text-white pointer-events-none">
                  <div className="mb-2 flex items-center gap-2">
                     <span className="bg-primary/90 text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">{profile.position}</span>
                     <span className="bg-slate-800/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-md text-[10px] font-bold">{profile.genreStyle}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Profile Image (Click to open modal) */}
                    <div 
                      className="w-10 h-10 shrink-0 z-20 cursor-pointer pointer-events-auto rounded-full border-2 border-white shadow-xl bg-slate-800 flex items-center justify-center overflow-hidden"
                      onClick={(e) => { e.stopPropagation(); openUserProfile(profile.userId); }}
                    >
                      {profile.authorProfileImageUrl ? (
                        <img src={profile.authorProfileImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-slate-500" />
                      )}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                      {profile.authorName}
                    </h2>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">{profile.title}</h3>
                  <p className="text-sm lg:text-base text-slate-300 line-clamp-2 leading-relaxed font-light">{profile.content}</p>
                </div>
              </motion.div>
            );
          })}

          {activeTab === "bands" && bandCards.map((band, index) => {
            const isTop = index === bandCards.length - 1;
            const bgVideo = band.latestVideoUrl;
            const bgImage = band.coverImageUrl || band.logoImageUrl;
            return (
              <motion.div
                key={band.id}
                className="absolute w-[90%] max-w-sm lg:max-w-md aspect-[3/4.2] bg-secondary rounded-[2rem] overflow-hidden shadow-2xl origin-bottom border border-border"
                style={{ zIndex: index }}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ 
                  scale: isTop ? 1 : 0.95 - (bandCards.length - 1 - index) * 0.05,
                  y: isTop ? 0 : (bandCards.length - 1 - index) * -20,
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
                  if (info.offset.x > 100) handleSwipe("right", band.id);
                  if (info.offset.x < -100) handleSwipe("left", band.id);
                }}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
              >
                {bgVideo ? (
                  <SwipeVideoPlayer src={bgVideo} />
                ) : bgImage ? (
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800 pointer-events-none">
                    <User size={80} className="text-slate-500" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />
                
                <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-[11px] font-semibold text-white/90">{band.location}</span>
                </div>

                <div className="absolute bottom-0 w-full p-6 lg:p-8 text-white pointer-events-none">
                  <div className="mb-2 flex items-center gap-2">
                     <span className="bg-primary/90 text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">{band.genre}</span>
                     <span className="bg-slate-800/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-md text-[10px] font-bold">멤버 {band.memberCount}명</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Band Leader Profile Image */}
                    <div 
                      className="w-10 h-10 shrink-0 z-20 cursor-pointer pointer-events-auto rounded-full border-2 border-white shadow-xl bg-slate-800 flex items-center justify-center overflow-hidden"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (band.leaderId) openUserProfile(band.leaderId); 
                      }}
                    >
                      {band.leaderProfileImageUrl ? (
                        <img src={band.leaderProfileImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-slate-500" />
                      )}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">
                      {band.name}
                    </h2>
                  </div>
                  <p className="text-sm lg:text-base text-slate-300 line-clamp-2 leading-relaxed font-light">{band.description}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {((activeTab === "musicians" && musicianCards.length === 0) || (activeTab === "bands" && bandCards.length === 0)) && (
          <div className="text-center text-slate-500 flex flex-col items-center">
            <Filter size={48} className="mb-4 opacity-50" />
            <p className="mb-4">주변의 매칭 데이터를 모두 확인했습니다.</p>
            <button 
              onClick={() => loadData()}
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
          onClick={() => { 
            const currentList = activeTab === "musicians" ? musicianCards : bandCards;
            if (currentList.length > 0) handleSwipe("left", currentList[currentList.length - 1].id) 
          }}
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

      {/* Offer Modal */}
      <AnimatePresence>
        {offerModalTarget !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-secondary w-full max-w-md rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button onClick={() => setOfferModalTarget(null)} type="button" className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-2">영입 제안 보내기</h2>
              <p className="text-sm text-slate-400 mb-6"><strong className="text-white">{offerModalTarget.authorName}</strong>님에게 영입을 제안합니다.</p>
              
              <form onSubmit={handleOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">어느 밴드로 제안할까요?</label>
                  <div className="relative">
                    <select 
                      value={offerForm.bandId}
                      onChange={(e) => setOfferForm({...offerForm, bandId: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer" 
                      required
                    >
                      <option value="" disabled>밴드를 선택하세요</option>
                      {myBands.filter(band => band.isLeader).map(band => (
                          <option key={band.id} value={band.id}>{band.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">제안 포지션</label>
                  <div className="relative">
                    <select 
                      value={offerForm.position}
                      onChange={(e) => setOfferForm({...offerForm, position: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer disabled:opacity-50" 
                      required
                      disabled={isLoadingPositions || !offerForm.bandId || isTargetAlreadyMember || availablePositions.length === 0}
                    >
                      <option value="" disabled>
                        {isLoadingPositions ? "포지션 불러오는 중..." : 
                         !offerForm.bandId ? "밴드를 먼저 선택하세요" : 
                           isTargetAlreadyMember ? "이미 이 밴드에 가입된 유저입니다" : 
                         availablePositions.length === 0 ? "구인 중인 포지션이 없습니다" : "포지션을 선택하세요"}
                      </option>
                      {availablePositions.map((pos, idx) => (
                        <option key={`${pos}-${idx}`} value={pos}>{pos}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">메시지 (선택)</label>
                  <textarea 
                    rows={3}
                    placeholder="환영 인사 등 메시지를 남겨보세요."
                    value={offerForm.message}
                    onChange={(e) => setOfferForm({...offerForm, message: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl py-4 mt-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? "전송 중..." : "제안 보내기"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Band Preview Modal */}
      <AnimatePresence>
        {selectedPreviewBand && (
          <BandPreviewModal 
            isOpen={true} 
            bandProfile={selectedPreviewBand}
            onClose={() => {
              setSelectedPreviewBand(null);
            }}
          />
        )}
        {isPreviewLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-white font-bold bg-secondary/80 px-6 py-3 rounded-full shadow-2xl">로딩 중...</div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
