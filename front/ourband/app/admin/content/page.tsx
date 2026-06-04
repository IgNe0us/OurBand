"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EyeOff, Eye, Loader2, Trash2, Search, Music, MessageSquare, BookOpen, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminContentsApi, deleteAdminContentApi, toggleAdminContentVisibilityApi, AdminContent } from "@/api/admin/adminService";
import toast from "react-hot-toast";

const TABS = [
  { id: "jam", label: "오디오잼 콘텐츠", icon: Music },
  { id: "community", label: "커뮤니티", icon: MessageSquare },
  { id: "history", label: "히스토리", icon: BookOpen },
  { id: "band", label: "밴드 게시판", icon: Users },
] as const;

const PAGE_SIZE = 15;

export default function AdminContentPage() {
  const [allPosts, setAllPosts] = useState<AdminContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("jam");

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const data = await getAdminContentsApi();
      setAllPosts(data);
    } catch (error) {
      toast.error("콘텐츠 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // Reset page and filters on tab change
  useEffect(() => {
    setCurrentPage(1);
    setSearchTitle("");
    setSearchAuthor("");
    setDateFrom("");
    setDateTo("");
  }, [activeTab]);

  // Filtered + paginated data
  const filteredPosts = useMemo(() => {
    let filtered = allPosts.filter(p => p.type === activeTab);

    if (searchTitle.trim()) {
      filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTitle.toLowerCase()));
    }
    if (searchAuthor.trim()) {
      filtered = filtered.filter(p => p.author.toLowerCase().includes(searchAuthor.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(p => p.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(p => p.date <= dateTo + " 23:59");
    }

    return filtered;
  }, [allPosts, activeTab, searchTitle, searchAuthor, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page if filter changes push current page out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredPosts.length, totalPages, currentPage]);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("정말 이 콘텐츠를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await deleteAdminContentApi(type, id);
      setAllPosts(prev => prev.filter(p => !(p.type === type && p.id === id)));
      toast.success("콘텐츠가 영구 삭제되었습니다.");
    } catch (error) {
      toast.error("콘텐츠 삭제에 실패했습니다.");
    }
  };

  const handleToggleVisibility = async (type: string, id: string) => {
    try {
      await toggleAdminContentVisibilityApi(type, id);
      setAllPosts(prev => prev.map(p =>
        (p.type === type && p.id === id) ? { ...p, hidden: !p.hidden } : p
      ));
      const target = allPosts.find(p => p.type === type && p.id === id);
      toast.success(target?.hidden ? "게시글이 다시 공개되었습니다." : "게시글이 숨김 처리되었습니다.");
    } catch (error) {
      toast.error("숨김 상태 변경에 실패했습니다.");
    }
  };

  const clearFilters = () => {
    setSearchTitle("");
    setSearchAuthor("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTitle || searchAuthor || dateFrom || dateTo;

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TABS) {
      counts[tab.id] = allPosts.filter(p => p.type === tab.id).length;
    }
    return counts;
  }, [allPosts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon size={16} />
              {tab.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center",
                isActive ? "bg-white/20" : "bg-secondary"
              )}>
                {tabCounts[tab.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-secondary/30 rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
          <Search size={14} /> 필터 검색
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
              <X size={12} /> 필터 초기화
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Title filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => { setSearchTitle(e.target.value); setCurrentPage(1); }}
              placeholder="게시글 제목 검색..."
              className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          {/* Author filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={searchAuthor}
              onChange={(e) => { setSearchAuthor(e.target.value); setCurrentPage(1); }}
              placeholder="작성자 검색..."
              className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          {/* Date from */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
            />
          </div>
          {/* Date to */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-secondary/50 rounded-2xl border border-border overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-secondary border-b border-border uppercase text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-4">게시판</th>
              <th className="px-4 py-4">제목</th>
              <th className="px-4 py-4">작성자</th>
              <th className="px-4 py-4 hidden md:table-cell">작성일</th>
              <th className="px-4 py-4">공개 상태</th>
              <th className="px-4 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPosts.map(post => (
              <tr key={`${post.type}-${post.id}`} className={cn("border-b border-border/50 transition-colors hover:bg-white/5", post.hidden && "opacity-50")}>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-background rounded-md border border-border text-[10px] whitespace-nowrap">{post.board}</span>
                </td>
                <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{post.title}</td>
                <td className="px-4 py-3 text-slate-400">{post.author}</td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell whitespace-nowrap">{post.date}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold",
                    post.hidden
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {post.hidden ? "숨김" : "공개"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleToggleVisibility(post.type, post.id)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        post.hidden
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                          : "bg-background text-slate-400 hover:text-white"
                      )}
                      title={post.hidden ? "숨김 해제" : "숨기기"}
                    >
                      {post.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(post.type, post.id)}
                      className="p-1.5 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      title="영구 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedPosts.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={24} className="text-slate-600" />
                    {hasActiveFilters ? "검색 조건에 맞는 콘텐츠가 없습니다." : "조회된 콘텐츠가 없습니다."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-background border border-border p-3 rounded-2xl">
          <span className="text-sm text-slate-400">
            총 <strong className="text-white">{filteredPosts.length}</strong>건 중{" "}
            <strong className="text-white">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredPosts.length)}</strong>건
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-bold transition-colors",
                    pageNum === currentPage
                      ? "bg-primary text-white"
                      : "bg-secondary text-slate-400 hover:text-white"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
