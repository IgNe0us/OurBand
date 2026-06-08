"use client";

// @ts-nocheck
import { EditBandProfileModal } from "@/components/band/EditBandProfileModal";
import { type BandProfileData } from "@/api/band/bandService";
import { VideoPostModal } from "@/components/band/VideoPostModal";
import { useContext, useEffect, useState } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { WritePostModal } from "@/components/post/WritePostModal";
import { LayoutContext } from "@/components/layout/AppLayout";
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useUserProfile } from '@/store/userProfileContext';
import { MessageSquare, Calendar, Menu, Edit3, Flag, Settings, Play, Heart, Trash2, Users, Loader2, ThumbsUp, BarChart2, LogOut, User, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { getBandProfileApi, updateBandProfileApi, getBandPostsApi, getBandPostApi, createBandPostApi, updateBandPostApi, deleteBandPostApi, type BandPostData, getBandApplicationsApi, acceptApplicationApi, rejectApplicationApi, type BandApplicationData, leaveBandApi } from "@/api/band/bandService";
import { uploadToCloudflare } from "@/lib/cloudflare";
import { sanitizeHtml } from "@/lib/sanitize";
import { Clock, CheckCircle2, XCircle, X } from "lucide-react";

const getFirstImageFromHtml = (htmlString: string) => {
  const match = htmlString.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};
import { getUserInfoApi } from "@/api/account/userService";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffInMinutes < 1) return "방금 전";
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}일 전`;
  return date.toLocaleDateString();
};

const BASE_TABS = ["전체", "공지사항", "자유게시판", "합주 일정", "합주", "멤버"];

export default function BandIdDynamicBoardPage() {
  const { confirm } = useConfirm();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigate = (path: string) => router.push(path);
  const { openUserProfile } = useUserProfile();
  const { openMenu } = useContext(LayoutContext);
  
  // URL에 tab 파라미터가 있으면 해당 탭을 기본으로 선택
  const defaultTab = searchParams.get('tab') || "전체";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<BandPostData | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: string, id: string | number, name: string } | null>(null);
  const [selectedVideoPostId, setSelectedVideoPostId] = useState<string | number | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 실시간 데이터 States
  const [bandProfile, setBandProfile] = useState<BandProfileData | null>(null);
  const [posts, setPosts] = useState<BandPostData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // 가입 신청 관리 State
  const [bandApplications, setBandApplications] = useState<BandApplicationData[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // 1. 유저 정보 로드 (삭제 권한용)
  useEffect(() => {
    getUserInfoApi()
      .then(user => setCurrentUserId(user.userId))
      .catch(err => console.error("Failed to load user info:", err));
  }, []);

  // 2. 밴드 상세 데이터 로드
  const fetchBandData = async (userId: number | null) => {
    try {
      setLoadingProfile(true);
      const profile = await getBandProfileApi(id);
      
      // 연혁 JSON 파싱
      let historyList = [];
      if (profile.historyJson) {
        try {
          historyList = JSON.parse(profile.historyJson);
        } catch (e) {
          console.error("Failed to parse history JSON:", e);
        }
      }

      setBandProfile({
        ...profile,
        positions: profile.positions || [],
        history: historyList
      });

      // 게시판 접근 권한 체크 (멤버만 허용)
      if (userId !== null && !profile.isLeader) {
        const isMember = profile.positions?.some((p: any) => p.userId === userId);
        if (!isMember) {
          toast.error("해당 밴드의 멤버만 게시판에 접근할 수 있습니다.");
          router.push('/bands');
          return;
        }
      }
    } catch (error) {
      console.error("Failed to fetch band details:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 3. 밴드 게시글 데이터 로드
  const fetchPostsData = async () => {
    try {
      setLoadingPosts(true);
      let boardTypeParam = "전체";
      if (activeTab === "공지사항") boardTypeParam = "NOTICE";
      else if (activeTab === "자유게시판") boardTypeParam = "FREE";
      else if (activeTab === "합주 일정") boardTypeParam = "SCHEDULE";
      else if (activeTab === "합주") boardTypeParam = "REHEARSAL";

      const postsList = await getBandPostsApi(id, boardTypeParam);
      setPosts(postsList);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (currentUserId !== null) {
      fetchBandData(currentUserId);
    }
  }, [id, currentUserId]);

  useEffect(() => {
    fetchPostsData();
  }, [id, activeTab]);

  // 방장일 경우 가입 신청 탭 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab === "가입 신청" && bandProfile?.isLeader) {
      loadBandApplications();
    }
  }, [activeTab, bandProfile?.isLeader]);

  const loadBandApplications = async () => {
    try {
      setLoadingApps(true);
      const apps = await getBandApplicationsApi(id);
      setBandApplications(apps);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAcceptApp = async (appId: number) => {
    try {
      await acceptApplicationApi(appId);
      toast.success("수락 완료");
      loadBandApplications();
      fetchBandData(currentUserId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "오류가 발생했습니다.");
    }
  };

  const handleRejectApp = (id: number) => {
    setRejectModalTarget(id);
    setRejectReason("");
  };

  const submitRejectApp = async () => {
    if (rejectModalTarget !== null) {
      try {
        await rejectApplicationApi(rejectModalTarget, rejectReason);
        setBandApplications(prev => prev.map(app => 
          app.id === rejectModalTarget ? { ...app, status: "REJECTED", rejectReason: rejectReason } : app
        ));
        setRejectModalTarget(null);
        setRejectReason("");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "거절 처리 실패");
      }
    }
  };

  const handleLeaveBand = async () => {
    if (await confirm({ message: "정말 밴드에서 탈퇴하시겠습니까? 탈퇴 후에는 게시판을 볼 수 없습니다.", isDestructive: true })) {
      try {
        await leaveBandApi(id);
        toast.success("성공적으로 탈퇴되었습니다.");
        navigate('/bands');
      } catch (err: any) {
        toast.error(err.response?.data?.message || "탈퇴에 실패했습니다.");
      }
    }
  };

  // 방장 여부 체크
  const isLeader = bandProfile?.isLeader || false;
  
  const displayTabs = isLeader ? [...BASE_TABS, "가입 신청"] : BASE_TABS;

  // 4. 프로필 관리 저장 핸들러
  const handleSaveProfile = async (updatedData: BandProfileData) => {
    try {
      const payload = {
        ...updatedData,
        historyJson: JSON.stringify(updatedData.history || []),
        positions: (updatedData.positions || []).map(p => ({
          ...p,
          id: typeof p.id === 'string' ? undefined : p.id
        }))
      };
      await updateBandProfileApi(id, payload);
      toast.success("밴드 프로필이 변경되었습니다! 🎸");
      fetchBandData(currentUserId);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("프로필 수정 권한이 없거나 저장에 실패했습니다.");
    }
  };

  // 5. 게시글 생성 및 수정 핸들러 (공지, 자유, 일정, 합주)
  const handleCreatePost = async (postData: { id?: string | number; boardType: string; category: string; title: string; content: string; files?: File[]; poll?: any }) => {
    try {
      let mediaUrl = "";
      let mediaType = "";
      
      if (postData.files && postData.files.length > 0) {
        const file = postData.files[0];
        mediaUrl = await uploadToCloudflare(file);
        mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      }

      let boardType = "FREE";
      if (postData.boardType === "공지사항") boardType = "NOTICE";
      else if (postData.boardType === "합주 일정") boardType = "SCHEDULE";
      else if (postData.boardType === "합주") boardType = "REHEARSAL";

      let scheduleDate = "";
      if (boardType === "SCHEDULE") {
        scheduleDate = new Date(Date.now() + 86400000 * 3).toLocaleDateString('ko-KR');
      }

      if (postData.id) {
        await updateBandPostApi(id, postData.id, {
          boardType,
          category: postData.category,
          title: postData.title,
          content: postData.content,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
          scheduleDate,
          poll: postData.poll
        });
        toast.success("게시글이 성공적으로 수정되었습니다! 📝");
      } else {
        const newPost = await createBandPostApi(id, {
          boardType,
          category: postData.category,
          title: postData.title,
          content: postData.content,
          mediaUrl,
          mediaType,
          scheduleDate,
          poll: postData.poll
        });
        if (boardType === "REHEARSAL") {
          setIsWriteModalOpen(false);
          if (newPost.id) setSelectedVideoPostId(newPost.id);
          fetchPostsData();
        } else {
          navigate(`/post/${newPost.id}`);
        }
        return;
      }

      setPostToEdit(null);
      fetchPostsData();
    } catch (error) {
      console.error("Failed to create/update post:", error);
      toast.error("게시글 저장 실패");
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    if (!await confirm({ message: "정말 이 게시글을 삭제하시겠습니까?", isDestructive: true })) return;
    try {
      await deleteBandPostApi(id, postId);
      toast.success("게시글이 삭제되었습니다.");
      fetchPostsData();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("게시글 삭제 실패");
    }
  };

  if (loadingProfile && !bandProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin text-primary mb-3" size={36} />
        <span className="text-sm font-bold">밴드 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (!bandProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <span className="text-sm font-bold">밴드를 찾을 수 없습니다.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background pb-20 overflow-x-hidden">
      <div className="relative h-56 md:h-72 w-full bg-slate-900 shrink-0">
        {bandProfile.coverImage ? (
          <img src={bandProfile.coverImage} className="w-full h-full object-cover opacity-60" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute top-0 left-0 w-full p-6 pt-12 md:pt-8 flex justify-between items-start z-10">
          <button onClick={openMenu} className="md:hidden text-white drop-shadow-md">
            <Menu size={28} />
          </button>
          
          {isLeader ? (
            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="ml-auto bg-black/50 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              밴드 관리
            </button>
          ) : (
            <button 
              onClick={handleLeaveBand}
              className="ml-auto bg-black/30 hover:bg-rose-500/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-rose-500 border border-white/5 hover:border-rose-500/30 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              밴드 탈퇴
            </button>
          )}
        </div>

        <div className="absolute bottom-6 left-6 md:left-8 flex items-end gap-5 w-[calc(100%-3rem)] pr-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background shadow-2xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
            {bandProfile.logoImage ? (
              <img src={bandProfile.logoImage} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
            ) : (
              <Users size={32} className="text-slate-400" />
            )}
          </div>
          <div className="mb-1 text-left">
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">{bandProfile.name}</h1>
            <p className="text-sm md:text-base font-medium text-slate-300 drop-shadow-md mt-1">{bandProfile.genre} • {bandProfile.location}</p>
          </div>
        </div>
      </div>

      <div className="bg-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-border pt-4 px-6 md:px-8">
        <div className="flex gap-6 relative overflow-x-auto hide-scrollbar whitespace-nowrap pb-3">
          {displayTabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-sm md:text-base font-bold relative transition-colors",
                activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-400"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="board-tab" className="absolute -bottom-3 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
        {activeTab === "멤버" && (
          <div className="space-y-8 w-full">
            <div>
              <h2 className="text-xl font-black text-white mb-4 text-left">가입된 멤버</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bandProfile.positions && bandProfile.positions.filter(p => !p.isRecruiting).length > 0 ? (
                  bandProfile.positions.filter(p => !p.isRecruiting).map((member, index) => (
                    <div key={member.id} className="bg-secondary/40 border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                      <div 
                        className="relative shrink-0 cursor-pointer"
                        onClick={() => member.userId && openUserProfile(member.userId, member.memberName, member.profileImageUrl)}
                      >
                        {member.profileImageUrl ? (
                          <img src={member.profileImageUrl} alt={member.memberName} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                        ) : (
                          <div className="w-14 h-14 rounded-full border-2 border-border bg-slate-800 flex items-center justify-center">
                            <User size={20} className="text-slate-500" />
                          </div>
                        )}
                        {index === 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-secondary shadow-sm">
                            방장
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-bold text-primary mb-1 truncate">{member.role}</div>
                        <div className="text-base font-bold text-white leading-tight truncate">{member.memberName || "이름 없음"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-sm font-bold text-slate-500 bg-secondary/20 rounded-2xl border border-dashed border-border">
                    가입된 멤버가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white mb-4 text-left flex items-center gap-2">
                모집 중인 포지션
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30 leading-none">
                  {bandProfile.positions?.filter(p => p.isRecruiting).length || 0}
                </span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {bandProfile.positions && bandProfile.positions.filter(p => p.isRecruiting).length > 0 ? (
                  bandProfile.positions.filter(p => p.isRecruiting).map((pos) => (
                    <div key={pos.id} className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="text-sm font-bold text-white">{pos.role}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-bold text-slate-500">
                    현재 모집 중인 포지션이 없습니다.
                  </div>
                )}
              </div>
            </div>
            
            {bandProfile.history && bandProfile.history.length > 0 && (
              <div className="pt-4 text-left">
                <h2 className="text-xl font-black text-white mb-4">밴드 연혁</h2>
                <div className="space-y-4 relative border-l border-border pl-6 ml-2">
                  {bandProfile.history.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-primary border-4 border-background box-content" />
                      <span className="text-xs font-bold text-primary">{h.date}</span>
                      <p className="text-sm font-medium text-slate-200 mt-0.5">{h.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "합주" && (
          <div className="col-span-full w-full">
            <h2 className="text-xl font-black text-white mb-4 text-left">합주 영상 및 기록</h2>
            {loadingPosts ? (
              <div className="py-12 text-slate-500 text-center font-bold">로딩 중...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-sm font-bold text-slate-500 bg-secondary/10 rounded-2xl border border-dashed border-border">
                등록된 합주 영상이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedVideoPostId(post.id!)}
                    className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer group flex flex-col shadow-lg"
                  >
                    <div className="aspect-video relative overflow-hidden bg-slate-800 shrink-0">
                      {post.mediaUrl ? (
                        post.mediaType === "VIDEO" ? (
                          <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                        ) : (
                          <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <Music size={32} className="text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary transition-colors">
                          <Play size={20} className="ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5 text-left flex flex-col flex-1">
                      <div className="text-xs font-bold text-primary mb-2">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                      <div className="mt-auto pt-4 flex items-center justify-between text-xs font-bold text-slate-500 border-t border-border/50">
                        <span>{post.authorName} ({post.authorRole})</span>
                        {(isLeader || post.authorId === currentUserId) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id!); }}
                            className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                            title="삭제하기"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "가입 신청" && (
          <div className="w-full space-y-4">
            <h2 className="text-xl font-black text-white mb-4 text-left">가입 신청 관리</h2>
            {loadingApps ? (
              <div className="py-12 text-slate-500 text-center font-bold">로딩 중...</div>
            ) : bandApplications.length === 0 ? (
              <div className="text-center py-16 text-sm font-bold text-slate-500 bg-secondary/10 rounded-2xl border border-dashed border-border">
                들어온 가입 신청이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bandApplications.map(app => (
                  <div key={app.id} className="bg-secondary/40 border border-border rounded-2xl p-5 text-left flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-12 h-12 bg-slate-800 rounded-full overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => openUserProfile(app.applicantUserId, app.applicantName, app.applicantProfileImageUrl || undefined)}
                      >
                        {app.applicantProfileImageUrl ? (
                          <img src={app.applicantProfileImageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <Users size={24} className="m-3 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{app.applicantName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{app.position} 지원 • {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="ml-auto">
                        {app.status === "PENDING" && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><Clock size={12} /> 심사중</span>}
                        {app.status === "ACCEPTED" && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><CheckCircle2 size={12} /> 수락완료</span>}
                        {app.status === "REJECTED" && <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"><XCircle size={12} /> 거절됨</span>}
                      </div>
                    </div>
                    
                    <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-sm text-slate-300 mb-4 whitespace-pre-wrap">
                      {app.message || "메시지가 없습니다."}
                    </div>

                    {app.status === "PENDING" && (
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleAcceptApp(app.id)} className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold py-2.5 rounded-lg transition-colors">수락하기</button>
                        <button onClick={() => handleRejectApp(app.id)} className="flex-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold py-2.5 rounded-lg transition-colors">거절하기</button>
                      </div>
                    )}
                    {app.rejectReason && app.status === "REJECTED" && (
                      <p className="text-xs text-slate-400 mt-2">사유: {app.rejectReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab !== "멤버" && activeTab !== "합주" && activeTab !== "가입 신청" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {loadingPosts ? (
              <div className="col-span-full py-12 text-slate-500 text-center font-bold">로딩 중...</div>
            ) : posts.length === 0 ? (
              <div className="col-span-full text-center py-16 text-sm font-bold text-slate-500 bg-secondary/10 rounded-2xl border border-dashed border-border">
                등록된 게시글이 없습니다.
              </div>
            ) : (
              posts.map((post) => {
                const isNotice = post.boardType === "NOTICE" || post.boardType === "공지사항";
                const isFree = post.boardType === "FREE" || post.boardType === "자유게시판";
                const isSchedule = post.boardType === "SCHEDULE" || post.boardType === "합주 일정" || post.boardType === "합주";
                
                if (isNotice && (activeTab === "전체" || activeTab === "공지사항")) {
                  return (
                    <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-secondary/40 border border-border rounded-2xl p-5 hover:border-primary/50 cursor-pointer transition-all duration-300 flex flex-col h-full text-left relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded">{post.category || "필독"}</span>
                          <span className="text-xs text-slate-500">{post.authorName} ({post.authorRole}) • {getRelativeTime(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {post.authorId === currentUserId && (
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                try {
                                  const fullPost = await getBandPostApi(post.id!);
                                  setPostToEdit({
                                    ...post,
                                    content: fullPost.content,
                                    poll: fullPost.poll,
                                    mediaUrl: fullPost.mediaUrl,
                                    mediaType: fullPost.mediaType
                                  });
                                  setIsWriteModalOpen(true);
                                } catch (err) {
                                  toast.error("게시글 정보를 불러오는 데 실패했습니다.");
                                }
                              }}
                              className="text-slate-600 hover:text-primary transition-colors p-1"
                              title="수정하기"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {(isLeader || post.authorId === currentUserId) ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id!); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="삭제하기"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setReportTarget({ type: 'BAND_POST', id: post.id!, name: '게시물' }); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="신고하기"
                            >
                              <Flag size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">{post.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                      
                      {(() => {
                        const previewImage = post.mediaUrl || getFirstImageFromHtml(post.content);
                        if (previewImage) {
                          return (
                            <div className="mb-4 rounded-xl overflow-hidden border border-border bg-slate-800 shrink-0 aspect-video max-h-36">
                              {post.mediaType === "VIDEO" && post.mediaUrl ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={previewImage} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {post.poll && (
                        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                          <BarChart2 className="text-primary shrink-0" size={20} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-white truncate">{post.poll.title}</span>
                            <span className="text-xs text-slate-400">투표 참여하기</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <ThumbsUp size={14} /> {post.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <MessageSquare size={14} /> {post.commentCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isFree && (activeTab === "전체" || activeTab === "자유게시판")) {
                  return (
                    <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-secondary/40 border border-border rounded-2xl p-5 hover:border-primary/50 cursor-pointer transition-all duration-300 flex flex-col h-full text-left relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded">{post.category || "일반"}</span>
                          <span className="text-xs text-slate-500">{post.authorName} ({post.authorRole}) • {getRelativeTime(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {post.authorId === currentUserId && (
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                try {
                                  const fullPost = await getBandPostApi(post.id!);
                                  setPostToEdit({
                                    ...post,
                                    content: fullPost.content,
                                    poll: fullPost.poll,
                                    mediaUrl: fullPost.mediaUrl,
                                    mediaType: fullPost.mediaType
                                  });
                                  setIsWriteModalOpen(true);
                                } catch (err) {
                                  toast.error("게시글 정보를 불러오는 데 실패했습니다.");
                                }
                              }}
                              className="text-slate-600 hover:text-primary transition-colors p-1"
                              title="수정하기"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {(isLeader || post.authorId === currentUserId) ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id!); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="삭제하기"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setReportTarget({ type: 'BAND_POST', id: post.id!, name: '게시물' }); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="신고하기"
                            >
                              <Flag size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">{post.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
                      
                      {(() => {
                        const previewImage = post.mediaUrl || getFirstImageFromHtml(post.content);
                        if (previewImage) {
                          return (
                            <div className="mb-4 rounded-xl overflow-hidden border border-border bg-slate-800 shrink-0 aspect-video max-h-36">
                              {post.mediaType === "VIDEO" && post.mediaUrl ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={previewImage} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {post.poll && (
                        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                          <BarChart2 className="text-primary shrink-0" size={20} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-white truncate">{post.poll.title}</span>
                            <span className="text-xs text-slate-400">투표 참여하기</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <ThumbsUp size={14} /> {post.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <MessageSquare size={14} /> {post.commentCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isSchedule && (activeTab === "전체" || activeTab === "합주 일정")) {
                  return (
                    <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-primary/5 border border-primary/20 rounded-2xl p-5 hover:border-primary/50 cursor-pointer transition-all duration-300 flex flex-col h-full text-left relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Calendar size={10} />일정</span>
                          <span className="text-xs text-slate-500">{post.authorName} ({post.authorRole}) • {getRelativeTime(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {post.authorId === currentUserId && (
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                try {
                                  const fullPost = await getBandPostApi(post.id!);
                                  setPostToEdit({
                                    ...post,
                                    content: fullPost.content,
                                    poll: fullPost.poll,
                                    mediaUrl: fullPost.mediaUrl,
                                    mediaType: fullPost.mediaType
                                  });
                                  setIsWriteModalOpen(true);
                                } catch (err) {
                                  toast.error("게시글 정보를 불러오는 데 실패했습니다.");
                                }
                              }}
                              className="text-slate-600 hover:text-primary transition-colors p-1"
                              title="수정하기"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {(isLeader || post.authorId === currentUserId) ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id!); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="삭제하기"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setReportTarget({ type: 'BAND_POST', id: post.id!, name: '게시물' }); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="신고하기"
                            >
                              <Flag size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">{post.title}</h3>
                      <p className="text-sm text-slate-400 mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                      
                      {(() => {
                        const previewImage = post.mediaUrl || getFirstImageFromHtml(post.content);
                        if (previewImage) {
                          return (
                            <div className="mb-4 rounded-xl overflow-hidden border border-border bg-slate-800 shrink-0 aspect-video max-h-36">
                              {post.mediaType === "VIDEO" && post.mediaUrl ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={previewImage} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {post.poll && (
                        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                          <BarChart2 className="text-primary shrink-0" size={20} />
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-bold text-white truncate">{post.poll.title}</span>
                            <span className="text-xs text-slate-400">투표 참여하기</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <ThumbsUp size={14} /> {post.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <MessageSquare size={14} /> {post.commentCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        )}
      </main>

      <button 
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
      >
        <Edit3 size={24} />
      </button>

      <WritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => { setIsWriteModalOpen(false); setPostToEdit(null); }} 
        defaultBoard={activeTab === "전체" ? "자유게시판" : activeTab}
        isLeader={isLeader}
        initialData={postToEdit || undefined}
        onSubmit={handleCreatePost}
      />

      {reportTarget && (
        <ReportModal 
          isOpen={true} 
          onClose={() => setReportTarget(null)} 
          targetName={reportTarget.name}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      <VideoPostModal
        isOpen={!!selectedVideoPostId}
        onClose={() => setSelectedVideoPostId(null)}
        postId={selectedVideoPostId}
        bandId={id}
      />

      <EditBandProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={bandProfile}
        onSave={handleSaveProfile}
      />

      {rejectModalTarget !== null && (
        <motion.div 
          key="reject-app-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative"
          >
            <button onClick={() => setRejectModalTarget(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-black text-white mb-2">가입 신청 거절</h2>
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
                onClick={submitRejectApp}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl py-4 mt-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                거절하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
