"use client";

// @ts-nocheck

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Camera, Music2, MapPin } from "lucide-react";

export default function BandCreatePage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const [bandName, setBandName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`밴드 '${bandName}' 결성이 완료되었습니다!`);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-20 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-secondary border border-border rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">새로운 밴드 결성</h1>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-10 pb-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-border bg-secondary flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer overflow-hidden shadow-inner">
                <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">로고 업로드</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">밴드의 아이덴티티를 나타내는 멋진 로고를 올려주세요.</p>
          </div>

          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">밴드 이름 <span className="text-red-500">*</span></label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  placeholder="멋진 밴드 이름을 입력하세요" 
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">주 활동 지역</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="예: 서울 마포구, 강남구 등" 
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">선호 장르 및 스타일</label>
              <div className="relative">
                <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="예: 스페이스 바이럴, 펑크 락, 시티팝" 
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">밴드 소개</label>
              <textarea 
                rows={5}
                placeholder="지향하는 음악성, 합주 주기, 밴드 분위기 등을 자유롭게 적어보세요." 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 resize-none shadow-inner"
              />
            </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              className="w-full bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl py-4 flex justify-center items-center shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all"
            >
              밴드 창설 완료
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
