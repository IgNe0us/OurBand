"use client";
import { BandPreviewModal, type BandPreviewData } from "@/components/band/BandPreviewModal";
import { useContext } from "react";
// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import React, { useState } from "react";
import Link from 'next/link';
import { Search, MapPin, Users, Plus, Star, Filter, Heart, Menu, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_TRENDING_BANDS } from "@/lib/mockData";


export default function BandsList() {
  const { openMenu } = useContext(LayoutContext);
  const [selectedBand, setSelectedBand] = useState<BandPreviewData | null>(null);
  const [bandFilters, setBandFilters] = useState({ loc: "전체 지역", genre: "전체 장르", status: "전체", followedOnly: false });
  const [followedBands, setFollowedBands] = useState<number[]>([]);

  const filteredBands = MOCK_TRENDING_BANDS.filter(band => {
    const matchLoc = bandFilters.loc === "전체 지역" || band.location.includes(bandFilters.loc);
    let matchGenre = true;
    if (bandFilters.genre !== "전체 장르") {
      matchGenre = band.genre.includes(bandFilters.genre) || band.tags.some(t => t.includes(bandFilters.genre));
    }
    const matchStatus = bandFilters.status === "전체" ? true : bandFilters.status === "구인 중" ? band.members.some(m => m.isRecruiting) : !band.members.some(m => m.isRecruiting);
    const matchFollowed = !bandFilters.followedOnly || followedBands.includes(band.id);
    return matchLoc && matchGenre && matchStatus && matchFollowed;
  });

  const updateFilter = (key: keyof typeof bandFilters, value: any) => {
    setBandFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFollow = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFollowedBands(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
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
              모든 밴드
            </h1>
          </div>
          <button className="w-10 h-10 border border-border bg-secondary/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
            <Search size={18} />
          </button>
        </div>

        {/* Filters */}
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
              value={bandFilters.loc} 
              onChange={(e) => updateFilter("loc", e.target.value)}
              className={cn(
                "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                bandFilters.loc !== "전체 지역" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
              )}
            >
              <option value="전체 지역">전체 지역</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
          </div>

          <div className="relative shrink-0">
            <select 
              value={bandFilters.genre} 
              onChange={(e) => updateFilter("genre", e.target.value)}
              className={cn(
                "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                bandFilters.genre !== "전체 장르" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
              )}
            >
              <option value="전체 장르">전체 장르</option>
              <option value="록">록</option>
              <option value="알앤비">알앤비</option>
              <option value="어쿠스틱">어쿠스틱</option>
              <option value="메탈">메탈</option>
              <option value="재즈">재즈</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
          </div>
          
          <div className="relative shrink-0">
            <select 
              value={bandFilters.status} 
              onChange={(e) => updateFilter("status", e.target.value)}
              className={cn(
                "appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 border rounded-lg text-xs font-bold hover:text-white outline-none cursor-pointer transition-colors",
                bandFilters.status !== "전체" ? "bg-primary/20 border-primary/50 text-white" : "bg-secondary border-border text-slate-300"
              )}
            >
              <option value="전체">모든 상태</option>
              <option value="구인 중">구인 중 밴드만</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBands.map((band) => (
            <motion.div 
              key={band.id} 
              className="bg-secondary rounded-[2rem] overflow-hidden shadow-xl border border-border group relative cursor-pointer hover:border-primary/50 transition-colors"
              whileHover={{ y: -5 }}
              onClick={() => setSelectedBand(band)}
            >
              <div className="relative h-48 bg-slate-800 shrink-0">
                <img src={band.coverImage} alt="Band cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-black/40 to-transparent" />
                
                {/* Live / Status Badge */}
                {band.members.some(m => m.isRecruiting) && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs border border-border shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                    <span className="font-bold text-white tracking-wider">구인 중</span>
                  </div>
                )}
                
                {/* Band Name in Cover */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 w-full pr-8">
                  <div className="w-12 h-12 rounded-2xl border-2 border-background shadow-xl overflow-hidden shrink-0 bg-slate-800">
                    <img src={band.logoImage} alt="Logo" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-black text-white leading-tight drop-shadow-md truncate">{band.name}</h4>
                    <p className="text-xs text-slate-300 font-medium truncate">{band.genre}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex gap-2 mb-3 max-w-full overflow-hidden">
                  {band.members.filter(m => m.isRecruiting).map((m, idx) => (
                    <span key={`${band.id}-${m.role}-${idx}`} className="px-2.5 py-1 text-[11px] bg-primary/20 text-primary border border-primary/20 rounded-md font-bold uppercase shrink-0">{m.role} 구함</span>
                  ))}
                  <span className="px-2.5 py-1 text-[11px] bg-slate-800 border border-border rounded-md text-slate-300 font-medium shrink-0">{band.frequency} 합주</span>
                </div>
                
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <div className="flex -space-x-2">
                    {band.members.slice(0, 4).map((member, i) => (
                      <div key={`${band.id}-member-${i}`} className="w-8 h-8 rounded-full border-2 border-secondary bg-slate-800 overflow-hidden relative group-hover:z-10 group-hover:ring-2 group-hover:ring-primary transition-all">
                        <img src={`https://i.pravatar.cc/100?u=${band.id}${i}`} alt="Member" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-medium ml-1">{band.members.length}명 멤버</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin size={16} className="text-slate-500 shrink-0" />
                    <span className="truncate">{band.location}</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed font-light mb-4">"{band.description.split('\n')[0]}"</p>
                
                <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
                  <div className="text-xs text-slate-500 font-medium">소통을 시작해보세요!</div>
                  <button 
                    onClick={(e) => toggleFollow(e, band.id)}
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
          {filteredBands.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500">
              조건에 맞는 밴드가 없습니다.
            </div>
          )}
        </div>
      </main>

      {/* Band Preview Modal */}
      <BandPreviewModal 
        isOpen={!!selectedBand} 
        onClose={() => setSelectedBand(null)} 
        band={selectedBand} 
      />
    </div>
  );
}
