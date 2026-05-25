"use client";
import { useContext, useState, useEffect } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { WritePostModal } from "@/components/post/WritePostModal";
// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { MessageCircle, HeartHandshake, PenTool, Search, MessageSquare, ThumbsUp, MoreHorizontal, Menu, Flag } from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import type { LayoutContextType } from "@/components/layout/AppLayout";
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

const POSTS = [
  { id: 1, title: "펜더 스트라토캐스터 픽업 교체 질문이요", author: "기타초보", time: "10분 전", likes: 12, comments: 5, type: "free", tag: "질문", part: "기타" },
  { id: 2, title: "합주때마다 베이스분이 자꾸 늦는데 어떻게 말하죠ㅠㅠ", author: "멘붕리더", time: "1시간 전", likes: 45, comments: 23, type: "counseling", tag: "밴드생활", part: "" },
  { id: 3, title: "드디어 PRS 커스텀 24 샀습니다!! 영롱하네요✨", author: "톤성애자", time: "3시간 전", likes: 120, comments: 18, type: "flex", tag: "자랑", img: "prs", part: "" },
  { id: 4, title: "요즘 유행하는 이펙터 보드 세팅 공유합니다", author: "보드장인", time: "5시간 전", likes: 88, comments: 32, type: "free", tag: "장비", part: "기타" },
  { id: 5, title: "오디오인터페이스 추천좀 부탁드립니다 (예산 50)", author: "홈레코딩입문", time: "8시간 전", likes: 5, comments: 12, type: "free", tag: "정보", part: "작곡/미디" },
  { id: 6, title: "보컬 발성 연습 팁 공유합니다", author: "득음수련생", time: "1일 전", likes: 67, comments: 9, type: "free", tag: "정보", part: "보컬" },
];

export default function CommunityCategoryPage() {
  const pathname = usePathname();
  const location = { pathname };
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const currentTabId = pathname.split("/").pop() || "free";
  const { openMenu } = useContext(LayoutContext);
  
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedPart, setSelectedPart] = useState("전체");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Reset category and part when tab changes
  useEffect(() => {
    setSelectedCategory("전체");
    setSelectedPart("전체");
  }, [currentTabId]);

  const currentTabInfo = TABS.find(t => t.id === currentTabId) || TABS[0];
  const Icon = currentTabInfo.icon;
  const currentCategories = CATEGORIES[currentTabId] || ["전체"];

  let filteredPosts = POSTS.filter(p => p.type === currentTabId);
  
  if (selectedCategory !== "전체") {
    filteredPosts = filteredPosts.filter(p => p.tag === selectedCategory);
  }

  if (selectedPart !== "전체") {
    filteredPosts = filteredPosts.filter(p => p.part === selectedPart);
  }

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
        <div className="relative group max-w-2xl mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="글 제목, 내용, 태그 검색" 
            className="w-full bg-secondary border border-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder-slate-500 shadow-inner"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-6 px-6 md:mx-0 md:px-0 mb-3">
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
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/post/${post.id}`)}
              className="bg-secondary border border-border rounded-2xl p-5 hover:border-slate-600 transition-colors cursor-pointer group text-left flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  {post.part && post.part !== "전체" && (
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-border px-2 py-1 rounded-md">{post.part}</span>
                  )}
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{post.tag}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                  className="text-slate-600 hover:text-rose-500 transition-colors p-1 shrink-0"
                  title="신고하기"
                >
                  <Flag size={14} />
                </button>
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h3>
              
              {post.img && (
                <div className="w-full h-48 bg-slate-800 rounded-xl mb-4 overflow-hidden border border-border/50 shrink-0">
                  <img src={`https://picsum.photos/seed/${post.img}/600/400`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Post attachment" referrerPolicy="no-referrer" />
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-300">{post.author}</span>
                  <span>{post.time}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <ThumbsUp size={14} /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <MessageSquare size={14} /> {post.comments}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
           <div className="text-center py-20 text-slate-500 md:col-span-2">
             <MessageCircle className="mx-auto mb-4 opacity-50" size={48} />
             <p>해당 파트에 아직 등록된 게시글이 없습니다.</p>
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
      <WritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        defaultBoard={currentTabInfo.label}
        isLeader={false} // 커뮤니티는 방장 권한이 없으므로 항상 false
      />

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetName="게시글"
      />
    </div>
  );
}
