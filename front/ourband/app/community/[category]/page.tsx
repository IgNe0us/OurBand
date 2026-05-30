"use client";
import { useContext, useState, useEffect } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { CommunityWritePostModal } from "@/components/post/CommunityWritePostModal";
import { LayoutContext } from "@/components/layout/AppLayout";
import { getCommunityPostsApi, getCommunityPostApi, createCommunityPostApi, updateCommunityPostApi, deleteCommunityPostApi, type CommunityPostData } from "@/api/community/communityService";
import { MessageCircle, HeartHandshake, PenTool, Search, MessageSquare, ThumbsUp, MoreHorizontal, Menu, Flag, Edit3, Trash2 } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import { getUserInfoApi } from '@/api/account/userService';
import { cn } from "@/lib/utils";

const TABS = [
  { id: "free", label: "자유게시판", icon: MessageCircle, path: "/community/free" },
  { id: "counseling", label: "고민상담", icon: HeartHandshake, path: "/community/counseling" },
  { id: "flex", label: "악기자랑", icon: PenTool, path: "/community/flex" },
];

const CATEGORIES: Record<string, string[]> = {
  "free": ["전체", "일반", "잡담", "질문", "정보", "장비"],
  "counseling": ["전체", "일반", "밴드생활", "진로", "기타"],
  "flex": ["전체", "일반", "자랑", "언박싱"]
};

const PARTS = ["전체", "보컬", "기타", "베이스", "드럼", "건반", "작곡/미디", "그외"];

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "최근";
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

export default function CommunityCategoryPage() {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const currentTabId = pathname.split("/").pop() || "free";
  const { openMenu } = useContext(LayoutContext);
  
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedPart, setSelectedPart] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPostData | null>(null);
  const [isPopular, setIsPopular] = useState(false);
  
  const currentTabInfo = TABS.find(t => t.id === currentTabId) || TABS[0];
  const Icon = currentTabInfo.icon;
  const currentCategories = CATEGORIES[currentTabId] || ["전체"];

  useEffect(() => {
    getUserInfoApi()
      .then((user: any) => setCurrentUserId(user.userId))
      .catch((err: any) => console.error('Failed to load user info:', err));
  }, []);

  // Reset category and part when tab changes
  useEffect(() => {
    setSelectedCategory("전체");
    setSelectedPart("전체");
    setKeyword("");
    setSearchInput("");
    setIsPopular(false);
  }, [currentTabId]);

  const fetchPosts = async () => {
    try {
      const boardType = currentTabInfo.label;
      const cat = selectedCategory === "전체" ? undefined : selectedCategory;
      const pt = selectedPart === "전체" ? undefined : selectedPart;
      const kw = keyword.trim() === "" ? undefined : keyword.trim();
      
      const data = await getCommunityPostsApi(boardType, cat, pt, kw, 0, isPopular);
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to fetch community posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentTabId, selectedCategory, selectedPart, keyword, isPopular]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const handleCreatePost = async (data: any) => {
    let mediaUrl = undefined;
    let mediaType = undefined;
    
    if (data.files && data.files.length > 0) {
      try {
        const { uploadToCloudflare } = require('@/lib/cloudflare');
        mediaUrl = await uploadToCloudflare(data.files[0]); // upload first file for now
        mediaType = data.files[0].type.startsWith("video/") ? "VIDEO" : "IMAGE";
      } catch (err) {
        console.error("Failed to upload file:", err);
        alert("파일 업로드에 실패했습니다.");
        return;
      }
    }

    const newPost = await createCommunityPostApi({
      boardType: data.boardType,
      category: data.category,
      part: data.part,
      title: data.title,
      content: data.content,
      mediaUrl,
      mediaType,
      poll: data.poll
    });
    router.push(`/community/post/${newPost.id}`);
  };

  const handleUpdatePost = async (data: any) => {
    if (!editingPost) return;
    try {
      let mediaUrl = editingPost.mediaUrl;
      let mediaType = editingPost.mediaType;

      if (data.files && data.files.length > 0) {
        const { uploadToCloudflare } = require('@/lib/cloudflare');
        mediaUrl = await uploadToCloudflare(data.files[0]);
        mediaType = data.files[0].type.startsWith("video/") ? "VIDEO" : "IMAGE";
      } else if (data.removeMedia) {
        mediaUrl = undefined;
        mediaType = undefined;
      }

      await updateCommunityPostApi(editingPost.id!, {
        ...data,
        mediaUrl,
        mediaType
      });
      fetchPosts();
      setIsEditModalOpen(false);
      setEditingPost(null);
    } catch (e) {
      console.error("Failed to update post", e);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  const handleDeletePost = async (postId: number | string) => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteCommunityPostApi(postId);
      fetchPosts();
    } catch (e) {
      console.error("Failed to delete post", e);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-background/80 backdrop-blur-xl top-0 sticky z-20 border-b border-border md:pt-8 md:px-8">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <Menu size={28} />
          </button>
          <div className="flex items-center gap-2">
            <Icon className="text-primary" size={24} />
            <h1 className="text-3xl font-black tracking-tight text-white">{currentTabInfo.label}</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-5 ml-12 md:ml-10">뮤지션들과 자유롭게 소통해보세요.</p>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="relative group max-w-2xl mb-4">
          <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </button>
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="글 제목, 내용, 태그 검색" 
            className="w-full bg-secondary border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder-slate-500 shadow-inner"
          />
        </form>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-6 px-6 md:mx-0 md:px-0 mb-3 items-center">
          <button
            onClick={() => setIsPopular(!isPopular)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-1",
              isPopular
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-secondary text-slate-400 border-border hover:bg-slate-800 hover:text-rose-400"
            )}
          >
            🔥 인기
          </button>
          
          <div className="w-px h-6 bg-border mx-1 shrink-0"></div>

          {currentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                selectedCategory === cat
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-secondary text-slate-400 border-border hover:bg-slate-800 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Part Filter (Only if not category that doesn't use it, but generally useful) */}
        {currentTabId === "free" && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-6 px-6 md:mx-0 md:px-0">
            {PARTS.map((part) => (
              <button
                key={part}
                onClick={() => setSelectedPart(part)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  selectedPart === part
                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                    : "bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300"
                )}
              >
                {part === "전체" ? "전체 포지션" : part}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[1600px] mx-auto w-full text-left">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/community/post/${post.id}`)}
              className="bg-secondary border border-border rounded-2xl p-5 hover:border-slate-600 transition-colors cursor-pointer group text-left flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  {post.part && post.part !== "전체" && (
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-border px-2 py-1 rounded-md">{post.part}</span>
                  )}
                  {post.category && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{post.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {currentUserId === post.userId && (
                    <>
                      <button 
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          try {
                            const fullPost = await getCommunityPostApi(post.id!);
                            setEditingPost({
                              ...post,
                              content: fullPost.content,
                              poll: fullPost.poll
                            });
                            setIsEditModalOpen(true);
                          } catch (err) {
                            alert("게시글 정보를 불러오는 데 실패했습니다.");
                          }
                        }}
                        className="text-slate-500 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-white/5"
                        title="수정"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id!); }}
                        className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {currentUserId !== post.userId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                      className="text-slate-600 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5 shrink-0"
                      title="신고하기"
                    >
                      <Flag size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h3>
              
              {post.mediaUrl && post.mediaType === "IMAGE" && (
                <div className="w-full h-48 bg-slate-800 rounded-xl mb-4 overflow-hidden border border-border/50 shrink-0">
                  <img src={post.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Post attachment" referrerPolicy="no-referrer" />
                </div>
              )}
              
              {post.mediaUrl && post.mediaType === "VIDEO" && (
                <div className="w-full h-48 bg-black rounded-xl mb-4 overflow-hidden border border-border/50 shrink-0 relative">
                  <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/20 text-white">
                      ▶
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-300">{post.authorName}</span>
                  <span>{getRelativeTime(post.createdAt)}</span>
                </div>
                
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
          ))
        ) : (
           <div className="text-center py-20 text-slate-500 md:col-span-2">
             <MessageCircle className="mx-auto mb-4 opacity-50" size={48} />
             <p>등록된 게시글이 없습니다.</p>
           </div>
        )}
      </div>

      {/* Write Button (Floating) */}
      <button 
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 md:right-12 bg-primary hover:bg-indigo-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center z-30"
      >
        <PenTool size={24} />
      </button>

      {/* Write Post Modal Instance */}
      <CommunityWritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        defaultBoard={currentTabInfo.label}
        isLeader={false}
        onSubmit={handleCreatePost}
      />

      {editingPost && (
        <CommunityWritePostModal 
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingPost(null); }}
          defaultBoard={editingPost.boardType || ""}
          initialData={{
            id: editingPost.id,
            boardType: editingPost.boardType || "",
            category: editingPost.category || "",
            part: editingPost.part || "",
            title: editingPost.title || "",
            content: editingPost.content || "",
            mediaUrl: editingPost.mediaUrl,
            mediaType: editingPost.mediaType,
            poll: editingPost.poll
          }}
          onSubmit={handleUpdatePost}
        />
      )}

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetName="게시글"
      />
    </div>
  );
}
