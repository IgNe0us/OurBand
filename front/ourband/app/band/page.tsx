"use client";
import { useContext, useEffect, useState, useRef } from "react";
import { LayoutContext } from "@/components/layout/AppLayout";
import { useRouter } from 'next/navigation';
import { Search, MapPin, Plus, Star, Filter, Menu, X, Edit3, Image as ImageIcon, Trash2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getSeekingPostsApi, 
  createSeekingPostApi, 
  updateSeekingPostApi,
  deleteSeekingPostApi,
  sendOfferApi, 
  MemberSeekingPostData 
} from "@/api/recruitment/recruitmentService";
import { uploadToCloudflare } from "@/lib/cloudflare";
import { getUserInfoApi, toggleFavoriteMemberApi, getFavoriteMembersApi } from "@/api/account/userService";
import { getMyBandsApi, getBandProfileApi, MyBandData } from "@/api/band/bandService";
import { UserProfileModal } from "@/components/common/UserProfileModal";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

const KOREA_REGIONS: Record<string, string[]> = {
  "전국": [],
  "서울특별시": ["전체", "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "경기도": ["전체", "수원시", "고양시", "용인시", "성남시", "부천시", "안산시", "화성시", "남양주시", "안양시", "평택시", "의정부시", "파주시", "시흥시", "김포시", "광명시", "광주시", "군포시", "이천시", "오산시", "하남시", "양주시", "구리시", "안성시", "포천시", "의왕시", "여주시", "양평군", "동두천시", "과천시", "가평군", "연천군"],
  "인천광역시": ["전체", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "중구", "강화군", "옹진군"],
  "강원특별자치도": ["전체", "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"],
  "충청남도": ["전체", "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"],
  "충청북도": ["전체", "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
  "대전광역시": ["전체", "대덕구", "동구", "서구", "유성구", "중구"],
  "경상북도": ["전체", "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "군위군", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"],
  "경상남도": ["전체", "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군"],
  "대구광역시": ["전체", "남구", "달서구", "동구", "북구", "서구", "수성구", "중구", "달성군"],
  "부산광역시": ["전체", "강서구", "금정구", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구", "기장군"],
  "울산광역시": ["전체", "남구", "동구", "북구", "중구", "울주군"],
  "전라북도": ["전체", "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
  "전라남도": ["전체", "목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"],
  "광주광역시": ["전체", "광산구", "남구", "동구", "북구", "서구"],
  "세종특별자치시": ["전체"],
  "제주특별자치도": ["전체", "제주시", "서귀포시"]
};

export default function MemberSeekingPage() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { openMenu } = useContext(LayoutContext);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myBands, setMyBands] = useState<MyBandData[]>([]);
  const [posts, setPosts] = useState<MemberSeekingPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for filtering & modals
  const [filters, setFilters] = useState({ loc1: "전국", loc2: "전체", pos: "전체 포지션", favoriteOnly: false });
  const [favoriteMembers, setFavoriteMembers] = useState<number[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MemberSeekingPostData | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  
  // Offer Modal States
  const [offerModalTarget, setOfferModalTarget] = useState<MemberSeekingPostData | null>(null);
  const [offerForm, setOfferForm] = useState({
    bandId: "",
    position: "",
    message: ""
  });
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isTargetAlreadyMember, setIsTargetAlreadyMember] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!offerForm.bandId) {
        setAvailablePositions([]);
        setIsTargetAlreadyMember(false);
        return;
      }
      try {
        setIsLoadingPositions(true);
        const profile = await getBandProfileApi(offerForm.bandId);
        
        const isMember = profile.positions.some(p => p.userId === offerModalTarget?.userId);
        setIsTargetAlreadyMember(isMember);

        if (isMember) {
          setAvailablePositions([]);
        } else {
          // userId가 없는 포지션만 필터링 (구인 중)
          const recruiting = profile.positions
            .filter(p => !p.userId)
            .map(p => p.role);
          setAvailablePositions(recruiting);
        }
      } catch (err) {
        console.error("Failed to fetch band profile for positions:", err);
      } finally {
        setIsLoadingPositions(false);
      }
    };
    fetchPositions();
  }, [offerForm.bandId, offerModalTarget]);
  
  // Write Form States
  const [writeForm, setWriteForm] = useState({
    title: "",
    content: "",
    position: "",
    loc1: "전국",
    loc2: "전체",
    genreStyle: ""
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const user = await getUserInfoApi();
      setCurrentUser(user);
      
      const bands = await getMyBandsApi();
      setMyBands(bands);

      const seekingPosts = await getSeekingPostsApi();
      setPosts(seekingPosts);

      const favMembers = await getFavoriteMembersApi();
      setFavoriteMembers(favMembers);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredPosts = posts.filter(post => {
    let matchLoc = true;
    if (filters.loc1 !== "전국") {
      if (filters.loc2 === "전체") {
        matchLoc = post.location?.includes(filters.loc1) || false;
      } else {
        matchLoc = post.location?.includes(`${filters.loc1} ${filters.loc2}`) || false;
      }
    }
    const matchPos = filters.pos === "전체 포지션" || post.position?.includes(filters.pos);
    const matchFav = filters.favoriteOnly ? favoriteMembers.includes(post.userId) : true;
    return matchLoc && matchPos && matchFav;
  });

  const updateFilter = (key: "loc1" | "loc2" | "pos" | "favoriteOnly", value: string | boolean) => {
    if (key === "loc1") {
      setFilters(prev => ({ ...prev, loc1: value as string, loc2: "전체" }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeForm.position || !writeForm.title || !writeForm.content) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      let mediaUrl = editingPost && !removeExistingMedia ? editingPost.mediaUrl : null;
      let mediaType = editingPost && !removeExistingMedia ? editingPost.mediaType : null;
      
      if (mediaFile) {
        mediaUrl = await uploadToCloudflare(mediaFile);
        mediaType = mediaFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      }

      const finalLocation = writeForm.loc1 === "전국" 
        ? "전국" 
        : writeForm.loc2 === "전체" 
          ? writeForm.loc1 
          : `${writeForm.loc1} ${writeForm.loc2}`;

      const payload = {
        title: writeForm.title,
        content: writeForm.content,
        position: writeForm.position,
        location: finalLocation,
        genreStyle: writeForm.genreStyle || "장르 무관",
        mediaUrl,
        mediaType,
        status: "OPEN"
      };

      if (editingPost) {
        await updateSeekingPostApi(editingPost.id, payload);
        toast.success("구직글이 수정되었습니다!");
      } else {
        await createSeekingPostApi(payload);
        toast.success("구직글이 등록되었습니다!");
      }

      setIsWriteModalOpen(false);
      setEditingPost(null);
      setWriteForm({ title: "", content: "", position: "", loc1: "전국", loc2: "전체", genreStyle: "" });
      setMediaFile(null);
      setRemoveExistingMedia(false);
      loadInitialData(); // Reload posts
    } catch (err) {
      console.error(err);
      toast.error("구직글 등록/수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (post: MemberSeekingPostData) => {
    let loc1 = "전국";
    let loc2 = "전체";
    
    if (post.location && post.location !== "전국") {
      const parts = post.location.split(" ");
      loc1 = parts[0];
      loc2 = parts.length > 1 ? parts[1] : "전체";
    }

    setWriteForm({
      title: post.title,
      content: post.content,
      position: post.position,
      loc1,
      loc2,
      genreStyle: post.genreStyle
    });
    setEditingPost(post);
    setRemoveExistingMedia(false);
    setMediaFile(null);
    setIsWriteModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!await confirm({ message: "정말 이 구직글을 삭제하시겠습니까?", isDestructive: true })) return;
    try {
      await deleteSeekingPostApi(id);
      toast.success("구직글이 삭제되었습니다.");
      loadInitialData();
    } catch (err) {
      console.error(err);
      toast.error("구직글 삭제에 실패했습니다.");
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
        bandId: parseInt(offerForm.bandId),
        targetUserId: offerModalTarget.userId,
        seekingPostId: offerModalTarget.id,
        position: offerForm.position,
        message: offerForm.message
      });

      toast.success("영입 제안이 전송되었습니다.");
      setOfferModalTarget(null);
      setOfferForm({ bandId: "", position: "", message: "" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "영입 제안에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-20 overflow-x-hidden">
      
      <header className="px-6 pt-12 md:pt-8 bg-background/80 backdrop-blur-xl z-20 sticky top-0 md:px-8 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <h1 className="text-3xl font-black tracking-tight text-white mb-0">멤버 찾기</h1>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        
        {/* Filters */}
        <div className="flex justify-start gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-bold text-slate-300 shrink-0 cursor-default">
            <Filter size={14} /> 필터
            </button>

            <button 
              onClick={() => updateFilter("favoriteOnly", !filters.favoriteOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors shrink-0",
                filters.favoriteOnly 
                  ? "bg-rose-500/10 border-rose-500/50 text-rose-400" 
                  : "bg-secondary border-border text-slate-300 hover:text-white"
              )}
            >
              <Heart size={14} className={cn(filters.favoriteOnly && "fill-rose-400")} />
              관심 멤버
            </button>
            
            <div className="relative shrink-0">
            <select 
                value={filters.loc1} 
                onChange={(e) => updateFilter("loc1", e.target.value)}
                className={cn(
                "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                filters.loc1 !== "전국" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                )}
            >
                {Object.keys(KOREA_REGIONS).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
            </div>

            {filters.loc1 !== "전국" && KOREA_REGIONS[filters.loc1]?.length > 0 && (
              <div className="relative shrink-0">
              <select 
                  value={filters.loc2} 
                  onChange={(e) => updateFilter("loc2", e.target.value)}
                  className={cn(
                  "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                  filters.loc2 !== "전체" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
                  )}
              >
                  {KOREA_REGIONS[filters.loc1].map(subLoc => (
                    <option key={subLoc} value={subLoc}>{subLoc}</option>
                  ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
              </div>
            )}

            <div className="relative shrink-0">
            <select 
                value={filters.pos} 
                onChange={(e) => updateFilter("pos", e.target.value)}
                className={cn(
                "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                filters.pos !== "전체 포지션" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
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

        {/* Content Grid */}
        {isLoading ? (
            <div className="text-center py-20 text-slate-500 font-bold">로딩 중...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredPosts.length > 0 ? filteredPosts.map(post => (
                <div key={post.id} className="bg-secondary/40 border border-border rounded-[1.5rem] p-5 flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedProfileId(post.userId)}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                        {post.authorProfileImageUrl ? (
                            <img src={post.authorProfileImageUrl} alt={post.authorName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">{post.authorName.charAt(0)}</div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-base md:text-lg hover:text-primary transition-colors">{post.authorName} <span className="text-primary text-xs ml-1 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">{post.position}</span></h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {post.location} • {post.genreStyle}</p>
                    </div>
                    </div>
                    
                    {currentUser?.userId === post.userId ? (
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleEditClick(post); }} className="text-slate-400 hover:text-white transition-colors" title="수정">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(post.id); }} className="text-slate-400 hover:text-red-400 transition-colors" title="삭제">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await toggleFavoriteMemberApi(post.userId);
                              if (res.isFavorite) {
                                setFavoriteMembers(prev => [...prev, post.userId]);
                                toast.success("관심 멤버로 등록되었습니다.");
                              } else {
                                setFavoriteMembers(prev => prev.filter(id => id !== post.userId));
                                toast.success("관심 멤버에서 해제되었습니다.");
                              }
                            } catch (err) {
                              toast.error("관심 멤버 설정에 실패했습니다.");
                            }
                          }}
                          className="text-slate-400 hover:text-rose-400 transition-colors shrink-0" 
                          title="관심 멤버 찜하기"
                        >
                          <Heart size={18} className={cn(favoriteMembers.includes(post.userId) && "fill-rose-400 text-rose-400")} />
                        </button>
                      )}
                </div>
                
                <h5 className="text-white font-bold text-sm mb-2">{post.title}</h5>
                <p className="text-sm text-slate-300 mb-4 bg-background/50 p-3 rounded-xl border border-border/50 line-clamp-3">{post.content}</p>

                {post.mediaUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden bg-black/50 border border-border/50 aspect-video flex items-center justify-center">
                        {post.mediaType === 'VIDEO' ? (
                            <video src={post.mediaUrl} controls className="max-w-full max-h-full" />
                        ) : (
                            <img src={post.mediaUrl} alt="media" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-auto">
                    <button 
                    onClick={() => {
                        if (!currentUser) {
                            toast.error("로그인이 필요합니다.");
                            return;
                        }
                        if (currentUser.userId === post.userId) {
                            toast.error("본인의 게시글에는 제안할 수 없습니다.");
                            return;
                        }
                        const isLeader = myBands.some(b => b.isLeader);
                        if (!isLeader) {
                            toast.error("밴드의 리더만 영입 제안을 보낼 수 있습니다.");
                            return;
                        }
                        setOfferModalTarget(post);
                    }} 
                    disabled={currentUser?.userId === post.userId}
                    className={cn(
                      "flex-1 text-sm font-bold py-2.5 rounded-xl transition-all",
                      currentUser?.userId === post.userId 
                        ? "bg-slate-700 text-slate-500 cursor-not-allowed" 
                        : "bg-white text-black hover:scale-[1.02]"
                    )}
                    >
                    {currentUser?.userId === post.userId ? "내 구직글" : "영입 제안"}
                    </button>
                </div>
                </div>
            )) : (
                <div className="text-center py-10 text-slate-500 col-span-full">
                조건에 맞는 멤버가 없습니다.
                </div>
            )}
            </div>
        )}
      </main>

      {/* Write Post FAB */}
      <button 
        onClick={() => {
            if (!currentUser) {
                toast.error("로그인이 필요합니다.");
                return;
            }
            setIsWriteModalOpen(true);
        }}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
      >
        <Edit3 size={24} />
      </button>

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
                onClick={() => {
                  setIsWriteModalOpen(false);
                  setEditingPost(null);
                  setWriteForm({ title: "", content: "", position: "", loc1: "전국", loc2: "전체", genreStyle: "" });
                  setMediaFile(null);
                  setRemoveExistingMedia(false);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-black text-white mb-6">{editingPost ? '구직글 수정' : '구직글 작성'}</h2>
              
              <form onSubmit={handleWriteSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">포지션</label>
                  <div className="relative">
                    <select 
                      value={writeForm.position}
                      onChange={(e) => setWriteForm({...writeForm, position: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer" 
                      required
                    >
                      <option value="" disabled>포지션을 선택하세요</option>
                      <option value="보컬">보컬</option>
                      <option value="기타">기타</option>
                      <option value="베이스">베이스</option>
                      <option value="드럼">드럼</option>
                      <option value="건반">건반</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">지역 및 선호 장르</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <select 
                        value={writeForm.loc1}
                        onChange={(e) => setWriteForm({...writeForm, loc1: e.target.value, loc2: "전체"})}
                        className="w-full bg-background border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer" 
                      >
                        {Object.keys(KOREA_REGIONS).map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                    </div>

                    <div className="relative">
                      <select 
                        value={writeForm.loc2}
                        onChange={(e) => setWriteForm({...writeForm, loc2: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer" 
                        disabled={writeForm.loc1 === "전국" || !KOREA_REGIONS[writeForm.loc1]?.length}
                      >
                        {writeForm.loc1 === "전국" || !KOREA_REGIONS[writeForm.loc1]?.length ? (
                          <option value="전체">해당 없음</option>
                        ) : (
                          KOREA_REGIONS[writeForm.loc1].map(subLoc => (
                            <option key={subLoc} value={subLoc}>{subLoc}</option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                    </div>

                    <input type="text" placeholder="선호 장르 (예: 팝, 락)" value={writeForm.genreStyle} onChange={(e) => setWriteForm({...writeForm, genreStyle: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">제목 / 한 줄 소개</label>
                  <input type="text" placeholder="예: [보컬] 주말 합주 가능한 펑크 밴드 모집합니다" value={writeForm.title} onChange={(e) => setWriteForm({...writeForm, title: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">상세 내용 (경력, 원하는 팀 성향 등)</label>
                  <textarea rows={4} placeholder="자세히 적어주세요!" value={writeForm.content} onChange={(e) => setWriteForm({...writeForm, content: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">연주 영상 또는 사진 (선택)</label>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-colors flex-1"
                    >
                      <ImageIcon size={18} /> {(mediaFile || (editingPost?.mediaUrl && !removeExistingMedia)) ? '파일 변경' : '미디어 첨부'}
                    </button>
                    {(mediaFile || (editingPost?.mediaUrl && !removeExistingMedia)) && (
                        <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl">
                          <span className="text-xs text-primary truncate max-w-[120px]">
                            {mediaFile ? mediaFile.name : '기존 파일 첨부됨'}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setMediaFile(null);
                              if (editingPost) setRemoveExistingMedia(true);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-slate-500 hover:text-red-400 flex items-center justify-center bg-slate-800 rounded-full w-5 h-5 shrink-0"
                            title="파일 삭제"
                          >
                            <X size={12} />
                          </button>
                        </div>
                    )}
                  </div>
                  <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                          setMediaFile(e.target.files[0]);
                          setRemoveExistingMedia(false);
                      }
                  }} />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl py-4 mt-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "처리 중..." : editingPost ? "수정하기" : "등록하기"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <UserProfileModal 
        isOpen={selectedProfileId !== null} 
        onClose={() => setSelectedProfileId(null)} 
        userId={selectedProfileId!} 
      />
    </div>
  );
}
