"use client";

// @ts-nocheck
import { EditBandProfileModal } from "@/components/band/EditBandProfileModal";
import { type BandProfileData } from "@/api/band/bandService";
import { VideoPostModal } from "@/components/band/VideoPostModal";
import { useContext, useEffect, useState } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { WritePostModal } from "@/components/post/WritePostModal";
import { LayoutContext } from "@/components/layout/AppLayout";
import { useRouter, useParams } from 'next/navigation';
import { MessageSquare, Calendar, Menu, Edit3, Flag, Settings, Play, Heart, Trash2, Users, Loader2, ThumbsUp, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { getBandProfileApi, updateBandProfileApi, getBandPostsApi, getBandPostApi, createBandPostApi, updateBandPostApi, deleteBandPostApi, type BandPostData } from "@/api/band/bandService";
import { uploadToCloudflare } from "@/lib/cloudflare";

const getFirstImageFromHtml = (htmlString: string) => {
  const match = htmlString.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
};
import { getUserInfoApi } from "@/api/account/userService";

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

const TABS = ["전체", "공지사항", "자유게시판", "합주 일정", "합주", "멤버"];

export default function BandIdDynamicBoardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { openMenu } = useContext(LayoutContext);
  const [activeTab, setActiveTab] = useState("전체");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<BandPostData | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedVideoPostId, setSelectedVideoPostId] = useState<string | number | null>(null);

  // 실시간 데이터 States
  const [bandProfile, setBandProfile] = useState<BandProfileData | null>(null);
  const [posts, setPosts] = useState<BandPostData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 1. 유저 정보 로드 (삭제 권한용)
  useEffect(() => {
    getUserInfoApi()
      .then(user => setCurrentUserId(user.userId))
      .catch(err => console.error("Failed to load user info:", err));
  }, []);

  // 2. 밴드 상세 데이터 로드
  const fetchBandData = async () => {
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
    fetchBandData();
  }, [id]);

  useEffect(() => {
    fetchPostsData();
  }, [id, activeTab]);

  // 방장 여부 체크
  const isLeader = bandProfile?.isLeader || false;

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
      alert("밴드 프로필이 변경되었습니다! 🎸");
      fetchBandData();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("프로필 수정 권한이 없거나 저장에 실패했습니다.");
    }
  };

  // 5. 게시글 생성 및 수정 핸들러 (공지, 자유, 일정, 합주)
  const handleCreatePost = async (postData: { id?: string | number; boardType: string; category: string; title: string; content: string; files?: File[]; poll?: any }) => {
    try {
      let mediaUrl = "";
      let mediaType = "";
      
      // 파일 첨부 시 Cloudflare R2에 업로드
      if (postData.files && postData.files.length > 0) {
        const file = postData.files[0];
        mediaUrl = await uploadToCloudflare(file);
        mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      }

      let boardType = "FREE";
      if (postData.boardType === "공지사항") boardType = "NOTICE";
      else if (postData.boardType === "합주 일정") boardType = "SCHEDULE";
      else if (postData.boardType === "합주") boardType = "REHEARSAL";

      // 합주 일정일 경우 오늘 혹은 임의 날짜 세팅
      let scheduleDate = "";
      if (boardType === "SCHEDULE") {
        scheduleDate = new Date(Date.now() + 86400000 * 3).toLocaleDateString('ko-KR'); // 3일 후 자동매핑 예시
      }

      if (postData.id) {
        // 게시글 수정
        await updateBandPostApi(id, postData.id, {
          boardType,
          category: postData.category,
          title: postData.title,
          content: postData.content,
          mediaUrl: mediaUrl || undefined, // 새 파일이 없으면 덮어쓰지 않게 처리가 필요하나, 임시로 이렇게 둠
          mediaType: mediaType || undefined,
          scheduleDate,
          poll: postData.poll
        });
        alert("게시글이 성공적으로 수정되었습니다! 📝");
      } else {
        // 게시글 생성
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
      alert("게시글 저장 실패");
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteBandPostApi(id, postId);
      alert("게시글이 삭제되었습니다.");
      fetchPostsData();
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("게시글 삭제 실패");
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
      {/* Cover Banner Header */}
      <div className="relative h-56 md:h-72 w-full bg-slate-900 shrink-0">
        <img src={bandProfile.coverImage || "https://picsum.photos/seed/band1/800/400"} className="w-full h-full object-cover opacity-60" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-0 left-0 w-full p-6 pt-12 md:pt-8 flex justify-between items-start z-10">
          <button onClick={openMenu} className="md:hidden text-white drop-shadow-md">
            <Menu size={28} />
          </button>
          
          {isLeader && (
            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="ml-auto bg-black/50 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              프로필 관리
            </button>
          )}
        </div>

        {/* Profile Info in Cover */}
        <div className="absolute bottom-6 left-6 md:left-8 flex items-end gap-5 w-[calc(100%-3rem)] pr-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background shadow-2xl overflow-hidden bg-slate-800 shrink-0">
            <img src={bandProfile.logoImage || "https://picsum.photos/seed/logo1/150/150"} className="w-full h-full object-cover" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <div className="mb-1 text-left">
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">{bandProfile.name}</h1>
            <p className="text-sm md:text-base font-medium text-slate-300 drop-shadow-md mt-1">{bandProfile.genre} • {bandProfile.location}</p>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="bg-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-border pt-4 px-6 md:px-8">
        <div className="flex gap-6 relative overflow-x-auto hide-scrollbar whitespace-nowrap pb-3">
          {TABS.map((tab) => (
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
        {/* Members Section */}
        {activeTab === "멤버" && (
          <div className="space-y-8 w-full">
            <div>
              <h2 className="text-xl font-black text-white mb-4 text-left">가입된 멤버</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bandProfile.positions && bandProfile.positions.filter(p => !p.isRecruiting).length > 0 ? (
                  bandProfile.positions.filter(p => !p.isRecruiting).map((member, index) => (
                    <div key={member.id} className="bg-secondary/40 border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                      <div className="relative shrink-0">
                        <img src={member.profileImageUrl || `https://picsum.photos/seed/user${member.userId || member.id}/100/100`} alt={member.memberName} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
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
            
            {/* History Section (멤버 탭 하단 연혁 렌더링) */}
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

        {/* Video Posts Section ("합주" 탭) */}
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
                        <img src="https://picsum.photos/seed/oasis1/800/450" className="w-full h-full object-cover opacity-80" alt="Placeholder" />
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
                      <p className="text-sm text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
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

        {/* Regular Posts (Notice, Free, Schedule) */}
        {activeTab !== "멤버" && activeTab !== "합주" && (
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
                                  alert("게시글 정보를 불러오는 데 실패했습니다.");
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
                              onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
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
                                  alert("게시글 정보를 불러오는 데 실패했습니다.");
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
                              onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
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
                                  alert("게시글 정보를 불러오는 데 실패했습니다.");
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
                              onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="신고하기"
                            >
                              <Flag size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">{post.title}</h3>
                      <p className="text-sm text-slate-400 mb-4" dangerouslySetInnerHTML={{ __html: post.content }} />
                      
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

      {/* Write Post FAB */}
      <button 
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
      >
        <Edit3 size={24} />
      </button>

      {/* Write Post Modal Instance */}
      <WritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => { setIsWriteModalOpen(false); setPostToEdit(null); }} 
        defaultBoard={activeTab === "전체" ? "자유게시판" : activeTab}
        isLeader={isLeader}
        initialData={postToEdit || undefined}
        onSubmit={handleCreatePost}
      />

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetName="게시글"
      />

      {/* Video Post Modal */}
      <VideoPostModal
        isOpen={!!selectedVideoPostId}
        onClose={() => setSelectedVideoPostId(null)}
        postId={selectedVideoPostId}
        bandId={id}
      />

      {/* Edit Profile Modal */}
      <EditBandProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={bandProfile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
