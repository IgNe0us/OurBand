"use client";
import { BandPreviewModal } from "@/components/band/BandPreviewModal";
import { type BandProfileData } from "@/api/band/bandService";
import { useContext } from "react";
import { AudioJamModal } from "@/components/jam/AudioJamModal";
// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { Play, TrendingUp, Star, MapPin, Search, Menu, Video, Heart, ChevronLeft, ChevronRight, User, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import React, { useState, useRef, useEffect } from "react";
import { type VideoPost } from "@/components/band/VideoPostModal";
import { cn } from "@/lib/utils";

// MOCK data removed to ensure it is not used as fallback.
import toast from "react-hot-toast";

import { getTrendingBandsApi, getTrendingJamsApi } from "@/api/trend/trendApi";
import { getBandProfileApi, toggleBandFollowApi } from "@/api/band/bandService";

type PopularJamVideo = VideoPost & { likes: number; author: string; inst?: string; style?: string };

export default function HomePage() {
  const { openMenu } = useContext(LayoutContext);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [location, setLocation] = useState("서울 마포구 상수동");
  
  const [selectedBand, setSelectedBand] = useState<BandProfileData | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<PopularJamVideo | null>(null);
  const [followedBands, setFollowedBands] = useState<number[]>([]);
  const [trendingBands, setTrendingBands] = useState<any[]>([]);
  const [popularVideos, setPopularVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const bands = await getTrendingBandsApi();
        if (bands && bands.length > 0) {
          const mappedBands = bands.map((band: any) => ({
            id: band.id,
            name: band.name,
            coverImage: band.coverImageUrl || "",
            logoImage: band.logoImageUrl || "",
            genre: band.genre,
            frequency: band.meetingSchedule || "주 1회",
            location: band.location,
            description: band.description,
            memberCount: band.memberCount,
            memberProfileUrls: (band.memberProfileUrls && band.memberProfileUrls.length > 0) 
              ? band.memberProfileUrls 
              : (band.leaderProfileImageUrl ? [band.leaderProfileImageUrl] : []),
            recruitingPositions: (band.recruitingPositions || []).map((pos: any) => ({ isRecruiting: true, role: pos.role })),
            isFollowed: band.followed === true,
          }));
          setTrendingBands(mappedBands);
          // 서버에서 받은 팔로우 상태로 초기화
          const followedIds = mappedBands.filter((b: any) => b.isFollowed).map((b: any) => b.id);
          if (followedIds.length > 0) {
            setFollowedBands(prev => [...new Set([...prev, ...followedIds])]);
          }
        } else {
          setTrendingBands([]);
        }
      } catch (e) {
        console.error(e);
        setTrendingBands([]);
      }
      
      try {
        const jams = await getTrendingJamsApi();
        if (jams && jams.length > 0) {
          const mappedJams = jams.map((jam: any) => ({
            id: String(jam.id),
            title: jam.title,
            date: new Date(jam.createdAt).toLocaleDateString(),
            author: jam.authorName,
            thumbnail: jam.mediaUrl || "",
            description: jam.description,
            likes: jam.likeCount,
            inst: jam.instrument,
            style: jam.genre,
            mediaUrl: jam.mediaUrl,
            parentId: jam.parentId,
            originalAuthorName: jam.originalAuthorName,
            userId: jam.userId,
            authorId: jam.userId,
            authorAvatar: jam.authorProfileImageUrl,
            likedByMe: jam.isLiked === true || jam.liked === true,
            viewCount: jam.viewCount,
            commentsCount: jam.commentCount,
            sharesCount: jam.shareCount,
            type: "video"
          }));
          setPopularVideos(mappedJams);
        } else {
          setPopularVideos([]);
        }
      } catch (e) {
        console.error(e);
        setPopularVideos([]);
      }
    };
    fetchTrends();
  }, []);

  const handleBandClick = async (band: any) => {
    try {
      if (typeof band.id === 'number') {
        const fullProfile = await getBandProfileApi(band.id);
        setSelectedBand(fullProfile);
      } else {
        setSelectedBand(band as any);
      }
    } catch (error) {
      console.error(error);
      toast.error("밴드 정보를 불러올 수 없습니다.");
      setSelectedBand(band as any);
    }
  };

  const handleToggleFollow = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await toggleBandFollowApi(id);
      setFollowedBands(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
    } catch (error) {
      console.error(error);
      toast.error("팔로우 요청에 실패했습니다. 로그인 상태를 확인해주세요.");
    }
  };

  const trendingRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const applyWheelScroll = (el: HTMLDivElement) => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const isAtStart = el.scrollLeft <= 0;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

        if ((isAtStart && e.deltaY < 0) || (isAtEnd && e.deltaY > 0)) {
          return;
        }

        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  };

  useEffect(() => {
    let removeTrending = () => {};
    let removeVideo = () => {};

    if (trendingRef.current) {
      removeTrending = applyWheelScroll(trendingRef.current);
    }
    if (videoRef.current) {
      removeVideo = applyWheelScroll(videoRef.current);
    }

    return () => {
      removeTrending();
      removeVideo();
    };
  }, []);

  const smoothScroll = (el: HTMLDivElement, direction: 'left' | 'right') => {
    el.style.scrollBehavior = 'auto';

    const scrollAmount = el.clientWidth * 0.7; // 한 번에 넘어가는 양 (너비의 70%)
    const targetLeft = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    const startLeft = el.scrollLeft;
    const distance = targetLeft - startLeft;
    
    let startTime: number | null = null;
    const duration = 600;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      el.scrollLeft = startLeft + distance * easeOutQuart(progress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingRef.current) smoothScroll(trendingRef.current, direction);
  };

  const scrollVideos = (direction: 'left' | 'right') => {
    if (videoRef.current) smoothScroll(videoRef.current, direction);
  };

  const locations = ["서울 마포구 상수동", "서울 마포구 연남동", "서울 강남구 역삼동", "경기 성남시 판교동"];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-background/80 backdrop-blur-xl top-0 sticky z-20 border-b border-border md:pt-8 md:px-8">
        <div className="flex items-center justify-between pr-14 md:pr-16">
          <div className="flex items-center gap-4">
            <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <div>
              <div 
                className="flex items-center gap-1.5 mb-1.5 cursor-pointer relative"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                {/* <MapPin size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">{location} <span className="text-xs ml-1">▼</span></h2> */}
                
                {/* Location Dropdown Mock */}
                {/* <AnimatePresence>
                  {showLocationDropdown && (
                    <motion.div 
                      className="absolute top-6 left-0 bg-secondary border border-border rounded-xl shadow-2xl py-2 w-48 z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {locations.map((loc) => (
                        <div 
                          key={loc} 
                          className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setLocation(loc); setShowLocationDropdown(false); }}
                        >
                          {loc}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence> */}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">트렌드</h1>
            </div>
          </div>
          {/* <button 
            onClick={() => toast.error("통합 검색 모달이 열립니다.")}
            className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center border border-border text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <Search size={18} />
          </button> */}
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-12 pb-24">
        {/* Trending Bands */}
        {trendingBands.length > 0 && (
        <section className="relative group/section">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
              <TrendingUp className="text-primary" size={24} />
              가장 뜨거운 밴드
            </h3>
          </div>
          
          <div className="relative">
            {/* Left Button */}
            <button 
              onClick={() => scrollTrending('left')}
              className="absolute -left-4 md:-left-6 top-[calc(50%-12px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white shadow-xl hover:bg-black/80 hover:scale-110 transition-all md:opacity-0 md:group-hover/section:opacity-100 hidden md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div 
              ref={trendingRef}
              className="flex overflow-x-auto gap-6 hide-scrollbar pb-6 -mx-6 px-6 md:mx-0 md:px-0"
            >
              {trendingBands.map((band: any) => (
                <motion.div 
                  key={band.id} 
                  className="w-[85vw] max-w-[320px] sm:max-w-[350px] md:w-[320px] md:max-w-none bg-secondary rounded-[2rem] overflow-hidden shadow-2xl border border-border shrink-0 group relative cursor-pointer"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => handleBandClick(band)}
                >
                  <div className="relative h-48 bg-slate-800">
                    {band.coverImage ? (
                      <img src={band.coverImage} alt="Band cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary via-black/40 to-transparent" />
                    
                    {/* Live / Status Badge */}
                    {band.recruitingPositions?.length > 0 && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs border border-border shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                        <span className="font-bold text-white tracking-wider">구인 중</span>
                      </div>
                    )}
                    
                    {/* Band Name in Cover */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full pr-8">
                      <div className="w-12 h-12 rounded-2xl border-2 border-background shadow-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                        {band.logoImage ? (
                          <img src={band.logoImage} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users className="text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black text-white leading-tight drop-shadow-md truncate">{band.name}</h4>
                        <p className="text-xs text-slate-300 font-medium truncate">{band.genre}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex gap-2 mb-3 max-w-full overflow-hidden">
                      {band.recruitingPositions?.map((m: any, i: number) => (
                        <span key={`${m.role}-${i}`} className="px-2.5 py-1 text-[11px] bg-primary/20 text-primary border border-primary/20 rounded-md font-bold uppercase shrink-0">{m.role} 구함</span>
                      ))}
                      <span className="px-2.5 py-1 text-[11px] bg-slate-800 border border-border rounded-md text-slate-300 font-medium shrink-0">{band.frequency} 합주</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 mt-2">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(band.memberCount || 1, 4) }).map((_, i) => {
                          const url = band.memberProfileUrls?.[i];
                          return (
                            <div key={`${band.id}-member-${i}`} className="w-8 h-8 rounded-full border-2 border-secondary bg-slate-800 overflow-hidden relative group-hover:z-10 group-hover:ring-2 group-hover:ring-primary transition-all flex items-center justify-center">
                              {url ? (
                                <img src={url} alt="Member" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={14} className="text-slate-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs text-slate-400 font-medium ml-1">{band.memberCount || 0}명 멤버</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin size={16} className="text-slate-500 shrink-0" />
                        <span className="truncate">{band.location}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed font-light mb-4">"{band.description?.split('\n')[0] || ""}"</p>
                    
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                      <div className="text-xs text-slate-500 font-medium">소통을 시작해보세요!</div>
                      <button 
                        onClick={(e) => handleToggleFollow(e, band.id)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0",
                          followedBands.includes(band.id) 
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                            : "bg-secondary border border-border text-slate-400 hover:text-rose-500 hover:border-rose-500/30"
                        )}
                      >
                        <Heart size={18} className={cn(followedBands.includes(band.id) && "fill-rose-500")} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Button */}
            <button 
              onClick={() => scrollTrending('right')}
              className="absolute -right-4 md:-right-6 top-[calc(50%-12px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white shadow-xl hover:bg-black/80 hover:scale-110 transition-all md:opacity-0 md:group-hover/section:opacity-100 hidden md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>
        )}

        {/* Popular Jam Videos */}
        {popularVideos.length > 0 && (
        <section className="relative group/section">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
              <Video className="text-primary" size={24} />
              실시간 인기 잼 영상
            </h3>
          </div>
          
          <div className="relative">
            {/* Left Button */}
            <button 
              onClick={() => scrollVideos('left')}
              className="absolute -left-4 md:-left-6 top-[calc(50%-12px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white shadow-xl hover:bg-black/80 hover:scale-110 transition-all md:opacity-0 md:group-hover/section:opacity-100 hidden md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div 
              ref={videoRef}
              className="flex overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-6 -mx-6 px-6 md:mx-0 md:px-0"
            >
              {popularVideos.map((video: any) => (
                <motion.div 
                  key={video.id} 
                  className="w-[60vw] max-w-[240px] md:w-[240px] md:max-w-none shrink-0 bg-secondary/40 border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col"
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-800 shrink-0">
                    <video 
                      src={`${video.thumbnail}#t=0.001`} 
                      className="w-full h-full object-cover opacity-80" 
                      muted 
                      playsInline 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:bg-black/40 transition-colors" />
                    
                    {/* Hearts Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg">
                      <Heart size={14} className="text-rose-500" fill="currentColor" />
                      <span className="text-xs font-bold text-white">{video.likes.toLocaleString()}</span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all shadow-lg">
                        <Play size={20} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 md:p-5 text-left flex flex-col flex-1 bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 shrink-0 border border-border flex items-center justify-center overflow-hidden">
                        {video.authorAvatar ? (
                          <img src={video.authorAvatar} alt="Author" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={12} className="text-slate-500" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-primary truncate">{video.author}</div>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{video.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{video.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Button */}
            <button 
              onClick={() => scrollVideos('right')}
              className="absolute -right-4 md:-right-6 top-[calc(50%-12px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white shadow-xl hover:bg-black/80 hover:scale-110 transition-all md:opacity-0 md:group-hover/section:opacity-100 hidden md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>
        )}
      </div>

      {/* Band Preview Modal */}
      <BandPreviewModal 
        isOpen={!!selectedBand} 
        onClose={() => setSelectedBand(null)} 
        bandProfile={selectedBand} 
      />

      {/* Audio Jam Short-form Modal */}
      <AudioJamModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        post={selectedVideo}
        isJam={true}
      />
    </div>
  );
}
