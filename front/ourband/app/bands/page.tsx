"use client";
import { BandPreviewModal } from "@/components/band/BandPreviewModal";
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { LayoutContext } from "@/components/layout/AppLayout";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Users, Filter, Heart, Menu, Radio, ArrowRight, ClipboardList, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getMyApplicationsApi, BandApplicationData, getAllBandsApi, BandListData, toggleBandFollowApi, getBandProfileApi, BandProfileData } from "@/api/band/bandService";
import { getReceivedOffersApi, RecruitmentOfferData, acceptOfferApi, rejectOfferApi } from "@/api/recruitment/recruitmentService";
import { getUserInfoApi } from "@/api/account/userService";

const KOREA_REGIONS: Record<string, string[]> = {
  "전국": [],
  "서울특별시": ["전체", "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "경기도": ["전체", "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시", "광명시", "김포시", "군포시", "광주시", "이천시", "양주시", "오산시", "구리시", "안성시", "포천시", "의왕시", "하남시", "여주시", "동두천시", "과천시"],
  "인천광역시": ["전체", "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
  "부산광역시": ["전체", "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구", "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군"],
  "대구광역시": ["전체", "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군"],
  "대전광역시": ["전체", "동구", "중구", "서구", "유성구", "대덕구"],
  "광주광역시": ["전체", "동구", "서구", "남구", "북구", "광산구"],
  "울산광역시": ["전체", "중구", "남구", "동구", "북구", "울주군"],
  "세종특별자치시": ["전체"],
  "강원특별자치도": ["전체", "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"],
  "충청북도": ["전체", "청주시", "충주시", "제천시"],
  "충청남도": ["전체", "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시"],
  "전라북도": ["전체", "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시"],
  "전라남도": ["전체", "목포시", "여수시", "순천시", "나주시", "광양시"],
  "경상북도": ["전체", "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시"],
  "경상남도": ["전체", "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시"],
  "제주특별자치도": ["전체", "제주시", "서귀포시"],
};

export default function BandsList() {
  const router = useRouter();
  const { openMenu } = useContext(LayoutContext);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"bands" | "status">("bands");

  // Band list state
  const [bands, setBands] = useState<BandListData[]>([]);
  const [isLoadingBands, setIsLoadingBands] = useState(false);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  // Filters
  const [bandFilters, setBandFilters] = useState({
    loc1: "전국", loc2: "전체", 
    recruitingOnly: false, followedOnly: false
  });

  // Preview modal state
  const [selectedBandId, setSelectedBandId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<BandProfileData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Status Tab State
  const [myApplications, setMyApplications] = useState<BandApplicationData[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<RecruitmentOfferData[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Load user info
  useEffect(() => {
    getUserInfoApi().then(setCurrentUser).catch(console.error);
  }, []);

  const loadBands = useCallback(async (pageNum: number, append: boolean = false) => {
    if (isLoadingBands) return;
    setIsLoadingBands(true);
    try {
      const locationParam = bandFilters.loc1 === "전국" ? undefined 
        : bandFilters.loc2 === "전체" ? bandFilters.loc1 
        : `${bandFilters.loc1} ${bandFilters.loc2}`;
      const genreParam = (bandFilters as any).genre === "전체 장르" ? undefined : (bandFilters as any).genre;
      
      const data = await getAllBandsApi({
        location: locationParam,
        keyword: keyword || undefined,
        recruitingOnly: bandFilters.recruitingOnly || undefined,
        followedOnly: bandFilters.followedOnly || undefined,
        page: pageNum,
        size: 12,
      });
      setBands(prev => append ? [...prev, ...data.content] : data.content);
      setIsLast(data.last);
    } catch (err) {
      console.error("밴드 목록 조회 실패:", err);
    } finally {
      setIsLoadingBands(false);
    }
  }, [bandFilters, keyword]);

  // Load bands when filters change
  useEffect(() => {
    setPage(0);
    loadBands(0, false);
  }, [bandFilters, keyword]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLast && !isLoadingBands) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadBands(nextPage, true);
      }
    }, { threshold: 0.1 });
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [isLast, isLoadingBands, page, loadBands]);

  useEffect(() => {
    if (activeTab === "status" && currentUser) {
      loadStatusData();
    }
  }, [activeTab, currentUser]);

  const loadStatusData = async () => {
    try {
      setIsLoadingStatus(true);
      const apps = await getMyApplicationsApi();
      setMyApplications(apps);

      const offers = await getReceivedOffersApi();
      setReceivedOffers(offers);
    } catch (err) {
      console.error("상태 조회 실패:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleAcceptOffer = async (e: React.MouseEvent, offerId: number) => {
    e.stopPropagation();
    try {
      await acceptOfferApi(offerId);
      alert("영입 제안을 수락했습니다.");
      loadStatusData();
    } catch (err: any) {
      alert(err.response?.data?.message || "수락 처리 실패");
    }
  };

  const handleRejectOffer = async (e: React.MouseEvent, offerId: number) => {
    e.stopPropagation();
    try {
      await rejectOfferApi(offerId);
      alert("영입 제안을 거절했습니다.");
      loadStatusData();
    } catch (err: any) {
      alert(err.response?.data?.message || "거절 처리 실패");
    }
  };

  const updateFilter = (key: keyof typeof bandFilters, value: any) => {
    setBandFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleFollow = async (e: React.MouseEvent, bandId: number) => {
    e.stopPropagation();
    try {
      const result = await toggleBandFollowApi(bandId);
      setBands(prev => prev.map(b => 
        b.id === bandId ? { ...b, followed: result.isFollowed, followerCount: result.isFollowed ? b.followerCount + 1 : b.followerCount - 1 } : b
      ));
    } catch (err) {
      console.error("팔로우 실패:", err);
    }
  };

  const handleBandClick = async (bandId: number) => {
    setSelectedBandId(bandId);
    setIsLoadingPreview(true);
    try {
      const profile = await getBandProfileApi(String(bandId));
      setPreviewData(profile);
    } catch (err) {
      console.error("밴드 프로필 조회 실패:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-20 overflow-x-hidden">
      <header className="px-6 pt-12 md:pt-8 bg-background/80 backdrop-blur-xl z-20 sticky top-0 md:px-8 border-b border-border">
        <div className="flex items-center justify-between mb-5 pr-14 md:pr-16">
          <div className="flex items-center gap-4">
            <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-white mb-0 flex items-center gap-2">
              <Radio className="text-primary hidden md:block" size={28} />
              밴드 찾기
            </h1>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="밴드 검색..."
              className="bg-secondary border border-border rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-primary/50 w-40 md:w-48 transition-all"
            />
            <button type="submit" className="w-10 h-10 border border-border bg-secondary/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
              <Search size={18} />
            </button>
          </form>
        </div>

        <div className="flex gap-6 mt-2 relative overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setActiveTab("bands")}
            className={cn("pb-3 text-sm md:text-base font-bold transition-colors relative shrink-0", activeTab === "bands" ? "text-white" : "text-slate-500 hover:text-slate-400")}
          >
            모든 밴드
            {activeTab === "bands" && <motion.div layoutId="bands-tab" className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
          </button>
          <button 
            onClick={() => setActiveTab("status")}
            className={cn("pb-3 text-sm md:text-base font-bold transition-colors relative shrink-0", activeTab === "status" ? "text-white" : "text-slate-500 hover:text-slate-400")}
          >
            지원 현황
            {activeTab === "status" && <motion.div layoutId="bands-tab" className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
          </button>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {activeTab === "bands" ? (
          <>
            <Link href="/band/create" className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-4 mb-6 hover:from-indigo-500/20 hover:to-purple-600/20 transition-all group">
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

            <div className="flex justify-start gap-2 overflow-x-auto hide-scrollbar pb-6 mt-4">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-bold text-slate-300 shrink-0 cursor-default">
                <Filter size={14} /> 필터
              </button>

              <button 
                onClick={() => updateFilter("followedOnly", !bandFilters.followedOnly)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors shrink-0",
                  bandFilters.followedOnly ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-secondary border-border text-slate-300 hover:text-white cursor-pointer"
                )}
              >
                <Heart size={14} className={cn(bandFilters.followedOnly && "fill-rose-400")} />
                관심 밴드
              </button>

              <div className="relative shrink-0">
                <select 
                  value={bandFilters.loc1} 
                  onChange={(e) => {
                    updateFilter("loc1", e.target.value);
                    updateFilter("loc2", "전체");
                  }}
                  className={cn(
                    "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                    bandFilters.loc1 !== "전국" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                  )}
                >
                  {Object.keys(KOREA_REGIONS).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
              </div>

              {bandFilters.loc1 !== "전국" && KOREA_REGIONS[bandFilters.loc1] && KOREA_REGIONS[bandFilters.loc1].length > 0 && (
                <div className="relative shrink-0">
                  <select 
                    value={bandFilters.loc2} 
                    onChange={(e) => updateFilter("loc2", e.target.value)}
                    className={cn(
                      "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                      bandFilters.loc2 !== "전체" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                    )}
                  >
                    {KOREA_REGIONS[bandFilters.loc1].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
                </div>
              )}

              {/* Genre filter removed */}
              
              <div className="relative shrink-0">
                <select 
                  value={bandFilters.recruitingOnly ? "구인 중" : "전체"} 
                  onChange={(e) => updateFilter("recruitingOnly", e.target.value === "구인 중")}
                  className={cn(
                    "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                    bandFilters.recruitingOnly ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                  )}
                >
                  <option value="전체">모든 상태</option>
                  <option value="구인 중">구인 중 밴드만</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bands.map((band) => (
                <motion.div 
                  key={band.id} 
                  className="bg-secondary rounded-[2rem] overflow-hidden shadow-xl border border-border group relative cursor-pointer hover:border-primary/50 transition-colors"
                  whileHover={{ y: -5 }}
                  onClick={() => handleBandClick(band.id)}
                >
                  <div className="relative h-48 bg-slate-800 shrink-0">
                    {band.coverImageUrl ? (
                      <img src={band.coverImageUrl} alt="Band cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary via-black/40 to-transparent" />
                    
                    <button 
                      onClick={(e) => handleToggleFollow(e, band.id)}
                      className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                      <Heart size={18} className={cn("transition-colors", band.followed ? "fill-rose-500 text-rose-500" : "text-white")} />
                    </button>

                    {band.recruiting && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs border border-border shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                        <span className="font-bold text-white tracking-wider">구인 중</span>
                      </div>
                    )}
                    
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full pr-8">
                      <div className="w-12 h-12 rounded-2xl border-2 border-background shadow-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                        {band.logoImageUrl ? <img src={band.logoImageUrl} alt="Logo" referrerPolicy="no-referrer" /> : <Users className="text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black text-white leading-tight drop-shadow-md truncate">{band.name}</h4>
                        <p className="text-xs text-slate-300 font-medium truncate">{band.genre}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex gap-2 mb-3 max-w-full overflow-hidden">
                      {band.recruitingPositions.map((pos) => (
                        <span key={pos.id} className="px-2.5 py-1 text-[11px] bg-primary/20 text-primary border border-primary/20 rounded-md font-bold uppercase shrink-0">{pos.role} 구함</span>
                      ))}
                      {band.meetingSchedule && (
                        <span className="px-2.5 py-1 text-[11px] bg-slate-800 border border-border rounded-md text-slate-300 font-medium shrink-0">{band.meetingSchedule} 합주</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 mt-2">
                      <span className="text-xs text-slate-400 font-medium ml-1">{band.memberCount}명 멤버</span>
                      <span className="text-xs text-slate-500 font-medium ml-auto">{band.followerCount} 팔로워</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin size={16} className="text-slate-500 shrink-0" />
                        <span className="truncate">{band.location}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed bg-background/50 p-3 rounded-xl border border-border/50">
                      {band.description || "등록된 소개가 없습니다."}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {!isLast && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoadingBands && <div className="text-slate-500 text-sm">로딩 중...</div>}
              </div>
            )}
            {isLast && bands.length > 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">모든 밴드를 불러왔습니다.</div>
            )}
            {!isLoadingBands && bands.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">검색 결과가 없습니다.</p>
                <p className="text-sm mt-2">다른 조건으로 검색해 보세요.</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            {!currentUser ? (
              <div className="text-center py-20 text-slate-500 font-bold">로그인이 필요합니다.</div>
            ) : isLoadingStatus ? (
              <div className="text-center py-20 text-slate-500 font-bold">로딩 중...</div>
            ) : (
              <>
                {/* 1. 내가 지원한 밴드 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <ClipboardList size={16} /> 내가 지원한 밴드
                  </h3>
                  {myApplications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-secondary/30 rounded-xl border border-border">지원 내역이 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {myApplications.map(app => (
                        <div key={`my-app-${app.id}`} className="bg-secondary border border-border rounded-xl p-4 flex flex-col">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                {app.bandLogoUrl ? <img src={app.bandLogoUrl} alt={app.bandName} className="w-full h-full object-cover" /> : <Users className="text-slate-500" size={20} />}
                            </div>
                            <div>
                              <h4 className="text-white text-sm font-bold">{app.bandName}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{app.position} 지원</p>
                            </div>
                          </div>
                          
                          <div className="mt-auto flex justify-end">
                            {app.status === "PENDING" ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><Clock size={12} /> 심사중</span>
                            ) : app.status === "ACCEPTED" ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 size={12} /> 수락됨</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"><X size={12} /> 거절됨</span>
                            )}
                          </div>
                          {app.rejectReason && app.status === "REJECTED" && (
                              <p className="text-xs text-slate-400 mt-2 bg-background p-2 rounded border border-border/50">사유: {app.rejectReason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 2. 내게 온 영입 제안 */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Heart size={16} /> 내게 온 영입 제안
                  </h3>
                  {receivedOffers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-secondary/30 rounded-xl border border-border">받은 제안이 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {receivedOffers.map(offer => (
                        <div key={`offer-${offer.id}`} className="bg-secondary border border-border rounded-xl p-4 flex flex-col hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                {offer.bandLogoUrl ? <img src={offer.bandLogoUrl} alt={offer.bandName} className="w-full h-full object-cover" /> : <Users className="text-slate-500" size={20} />}
                            </div>
                            <div>
                              <h4 className="text-white text-sm font-bold">{offer.bandName}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{offer.position} 제안</p>
                            </div>
                          </div>
                          {offer.message && (
                              <p className="text-xs text-slate-300 mb-3 bg-background p-2 rounded border border-border/50 line-clamp-2">"{offer.message}"</p>
                          )}
                          
                          <div className="mt-auto">
                            {offer.status === "PENDING" ? (
                              <div className="flex gap-2 pt-2 border-t border-border">
                                <button onClick={(e) => handleAcceptOffer(e, offer.id)} className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold py-2 rounded-lg transition-colors">수락</button>
                                <button onClick={(e) => handleRejectOffer(e, offer.id)} className="flex-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold py-2 rounded-lg transition-colors">거절</button>
                              </div>
                            ) : offer.status === "ACCEPTED" ? (
                              <div className="flex justify-end"><span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 size={12} /> 수락함</span></div>
                            ) : (
                              <div className="flex justify-end"><span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"><X size={12} /> 거절함</span></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </main>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBandId && previewData && (
          <BandPreviewModal 
            isOpen={true} 
            bandProfile={previewData}
            onClose={() => { setSelectedBandId(null); setPreviewData(null); }}
          />
        )}
        {selectedBandId && isLoadingPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-white font-bold bg-secondary/80 px-6 py-3 rounded-full shadow-2xl">로딩 중...</div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
