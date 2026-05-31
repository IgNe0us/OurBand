"use client";

// @ts-nocheck

import React, { useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Camera, Music2, MapPin, Edit3 } from "lucide-react";
import { uploadToCloudflare } from "@/lib/cloudflare";
import { createBandApi } from "@/api/account/userService";
import toast from "react-hot-toast";

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

export default function BandCreatePage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  
  const [bandName, setBandName] = useState("");
  const [loc1, setLoc1] = useState("전국");
  const [loc2, setLoc2] = useState("전체");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");

  // 로고 관련 state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로고 파일 선택 핸들러 (미리보기만 생성)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  // 밴드 창설 완료 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim()) return toast.error("밴드 이름을 입력해주세요!");

    setIsSubmitting(true);
    try {
      // 1. 로고가 있으면 Cloudflare에 업로드
      let logoImageUrl = "";
      if (logoFile) {
        logoImageUrl = await uploadToCloudflare(logoFile);
      }

      const finalLocation = loc1 === "전국" 
        ? "전국" 
        : loc2 === "전체" 
          ? loc1 
          : `${loc1} ${loc2}`;

      // 2. 백엔드 DB에 밴드 정보 저장
      await createBandApi({
        name: bandName.trim(),
        location: finalLocation,
        genre: genre.trim(),
        description: description.trim(),
        logoImageUrl,
      });

      toast.success(`밴드 '${bandName}' 결성이 완료되었습니다! 🎸`);
      navigate("/profile");
    } catch (error) {
      console.error("밴드 생성 실패:", error);
      toast.error("밴드 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
              <div 
                className="w-32 h-32 rounded-3xl border-2 border-dashed border-border bg-secondary flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer overflow-hidden shadow-inner"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreviewUrl ? (
                  <>
                    <img src={logoPreviewUrl} className="w-full h-full object-cover" alt="Logo Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                      <Edit3 className="text-white" size={24} />
                    </div>
                  </>
                ) : (
                  <>
                    <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">로고 업로드</span>
                  </>
                )}
              </div>
              {/* 숨겨진 파일 입력 */}
              <input 
                type="file" 
                ref={logoInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleLogoChange} 
              />
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select 
                    value={loc1} 
                    onChange={(e) => {
                      setLoc1(e.target.value);
                      setLoc2("전체");
                    }}
                    className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer shadow-inner"
                  >
                    {Object.keys(KOREA_REGIONS).map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                </div>
                
                {loc1 !== "전국" && KOREA_REGIONS[loc1] && (
                  <div className="relative flex-1">
                    <select 
                      value={loc2} 
                      onChange={(e) => setLoc2(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer shadow-inner"
                    >
                      {KOREA_REGIONS[loc1].map(subRegion => (
                        <option key={subRegion} value={subRegion}>{subRegion}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">선호 장르 및 스타일</label>
              <div className="relative">
                <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="예: 스페이스 바이럴, 펑크 락, 시티팝" 
                  className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 pl-1">밴드 소개</label>
              <textarea 
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="지향하는 음악성, 합주 주기, 밴드 분위기 등을 자유롭게 적어보세요." 
                className="w-full bg-secondary border border-border rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-600 resize-none shadow-inner"
              />
            </div>
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-indigo-600 text-white font-bold rounded-xl py-4 flex justify-center items-center shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  밴드 창설 중...
                </>
              ) : (
                "밴드 창설 완료"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
