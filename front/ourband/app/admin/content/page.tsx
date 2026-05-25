"use client";

import React, { useState } from "react";
import { Plus, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_POSTS = [
  { id: "1", board: "오디오잼", title: "새로운 합주곡 등록합니다", author: "드럼머신", date: "2024-04-26", hidden: false },
  { id: "2", board: "자유게시판", title: "펜더 기타 추천좀요", author: "기타초보", date: "2024-04-25", hidden: false },
  { id: "3", board: "자유게시판", title: "광고성 글입니다", author: "스팸유저", date: "2024-04-24", hidden: true },
];

export default function AdminContentPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">전체 콘텐츠 관리</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/80 transition-colors flex items-center gap-2">
            <Plus size={16} /> 공지사항 등록
          </button>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-secondary border-b border-border uppercase text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-4 w-12"><input type="checkbox" className="rounded bg-background border-border" /></th>
              <th className="px-4 py-4">게시판</th>
              <th className="px-4 py-4">제목 (유형)</th>
              <th className="px-4 py-4">작성자</th>
              <th className="px-4 py-4">작성일</th>
              <th className="px-4 py-4 text-right">상태</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className={cn("border-b border-border/50 transition-colors hover:bg-white/5", post.hidden && "opacity-50")}>
                <td className="px-4 py-3"><input type="checkbox" className="rounded bg-background border-border" /></td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-background rounded-md border border-border text-[10px]">{post.board}</span></td>
                <td className="px-4 py-3 font-medium text-white">{post.title}</td>
                <td className="px-4 py-3 text-slate-400">{post.author}</td>
                <td className="px-4 py-3 text-slate-400">{post.date}</td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => setPosts(posts.map(p => p.id === post.id ? { ...p, hidden: !p.hidden } : p))}
                    className="p-1.5 bg-background rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    {post.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl">
        <span className="text-sm text-slate-400">선택한 항목을...</span>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 border border-border bg-secondary text-sm rounded-lg hover:bg-white/10 transition-colors">숨김 처리</button>
          <button className="px-4 py-1.5 border border-red-500/20 bg-red-500/10 text-red-500 text-sm rounded-lg hover:bg-red-500 hover:text-white transition-colors">영구 삭제</button>
        </div>
      </div>
    </div>
  );
}
