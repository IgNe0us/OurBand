"use client";
// @ts-nocheck
import { X, Camera, Save, Plus, Trash2, UserPlus, Loader2, AlertTriangle, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmModal } from "../common/ConfirmModal";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { uploadToCloudflare } from "@/lib/cloudflare";

import { type BandProfileData, type BandHistory, type BandPositionData as BandPosition, deleteBandApi } from "@/api/band/bandService";
import { useRouter } from "next/navigation";

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

interface EditBandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: BandProfileData;
  onSave: (data: BandProfileData) => void;
}

export function EditBandProfileModal({ isOpen, onClose, initialData, onSave }: EditBandProfileModalProps) {
  const [formData, setFormData] = useState<BandProfileData>(initialData);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [disbandConfirmText, setDisbandConfirmText] = useState("");
  const router = useRouter();
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [loc1, setLoc1] = useState("전국");
  const [loc2, setLoc2] = useState("전체");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        positions: initialData.positions || [
          { id: "1", role: "보컬", memberName: "홍길동", isRecruiting: false },
          { id: "2", role: "기타", memberName: "조지스미스", isRecruiting: false },
          { id: "3", role: "베이스", memberName: "", isRecruiting: true }
        ],
        history: initialData.history || []
      });

      if (initialData.location && initialData.location !== "전국") {
        const parts = initialData.location.split(" ");
        setLoc1(parts[0]);
        setLoc2(parts.slice(1).join(" ") || "전체");
      } else {
        setLoc1("전국");
        setLoc2("전체");
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const finalLocation = loc1 === "전국" 
      ? "전국" 
      : loc2 === "전체" 
        ? loc1 
        : `${loc1} ${loc2}`;
    setFormData(prev => ({ ...prev, location: finalLocation }));
  }, [loc1, loc2, isOpen]);

  const handleChange = (field: keyof Omit<BandProfileData, "positions" | "history">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const IMAGE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'png', 'webp', 'bmp', 'tif', 'tiff', 'heic'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!IMAGE_ALLOWED_EXTENSIONS.includes(ext)) {
      setAlertModal({isOpen: true, message: `지원하지 않는 파일 형식입니다: ${file.name}`});
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setAlertModal({isOpen: true, message: `총 파일 용량은 50MB를 초과할 수 없습니다.`});
      return;
    }
    setIsUploadingLogo(true);
    try {
      const url = await uploadToCloudflare(file);
      setFormData((prev) => ({ ...prev, logoImage: url }));
    } catch (err) {
      console.error("Failed to upload logo:", err);
      setAlertModal({isOpen: true, message: "로고 업로드에 실패했습니다. 다시 시도해 주세요."});
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const IMAGE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'png', 'webp', 'bmp', 'tif', 'tiff', 'heic'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!IMAGE_ALLOWED_EXTENSIONS.includes(ext)) {
      setAlertModal({isOpen: true, message: `지원하지 않는 파일 형식입니다: ${file.name}`});
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setAlertModal({isOpen: true, message: `총 파일 용량은 50MB를 초과할 수 없습니다.`});
      return;
    }
    setIsUploadingCover(true);
    try {
      const url = await uploadToCloudflare(file);
      setFormData((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error("Failed to upload cover image:", err);
      setAlertModal({isOpen: true, message: "커버 이미지 업로드에 실패했습니다. 다시 시도해 주세요."});
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAddPosition = () => {
    const newPosition: BandPosition = {
      id: String(Date.now() + Math.random()),
      role: "",
      memberName: "",
      isRecruiting: true,
    };
    setFormData((prev) => ({ ...prev, positions: [...prev.positions, newPosition] }));
  };

  const handleRemovePosition = (id: string | number) => {
    setFormData((prev) => ({ ...prev, positions: prev.positions.filter(p => p.id !== id) }));
  };

  const handlePositionChange = (id: string | number, field: keyof BandPosition, value: any) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleToggleRecruiting = (id: string | number) => {
    setFormData((prev) => ({
      ...prev,
      positions: prev.positions.map(p => {
        if (p.id === id) {
          const newIsRecruiting = !p.isRecruiting;
          return {
            ...p,
            isRecruiting: newIsRecruiting,
            memberName: newIsRecruiting ? "" : p.memberName // 구인중으로 바꿀 시 이름 초기화
          };
        }
        return p;
      })
    }));
  };

  const handleAddHistory = () => {
    const newHistory: BandHistory = {
      id: String(Date.now() + Math.random()),
      date: "",
      title: "",
    };
    setFormData((prev) => ({ ...prev, history: [...(prev.history || []), newHistory] }));
  };

  const handleRemoveHistory = (id: string | number) => {
    setFormData((prev) => ({ ...prev, history: (prev.history || []).filter(h => h.id !== id) }));
  };

  const handleHistoryChange = (id: string | number, field: keyof BandHistory, value: string) => {
    setFormData((prev) => ({
      ...prev,
      history: (prev.history || []).map(h => h.id === id ? { ...h, [field]: value } : h)
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleDisbandBand = async () => {
    if (disbandConfirmText !== formData.name) {
      setAlertModal({isOpen: true, message: "밴드 이름이 일치하지 않습니다."});
      return;
    }
    
    try {
      await deleteBandApi(formData.id!);
      setAlertModal({isOpen: true, message: "밴드가 성공적으로 해체되었습니다."});
      onClose();
      router.push('/bands');
    } catch (err: any) {
      setAlertModal({isOpen: true, message: err.response?.data?.message || "밴드 해체에 실패했습니다."});
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-secondary rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-secondary">
            <h2 className="text-xl font-black text-white">밴드 관리</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar text-left">
            
            {/* Images */}
            <div className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-slate-400 mb-2">커버 이미지</label>
                 <div 
                   onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                   className="relative h-32 w-full bg-slate-800 rounded-xl overflow-hidden border border-border group cursor-pointer"
                 >
                    {formData.coverImage ? (
                      <img src={formData.coverImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-50 group-hover:opacity-30 transition-opacity" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingCover ? (
                        <Loader2 className="animate-spin text-white mb-1" size={24} />
                      ) : (
                        <Camera size={24} className="mb-1" />
                      )}
                      <span className="text-xs font-bold">{isUploadingCover ? "업로드 중..." : "이미지 변경"}</span>
                    </div>
                 </div>
                 <input 
                   type="file" 
                   ref={coverInputRef} 
                   onChange={handleCoverChange} 
                   accept=".jpg,.jpeg,.gif,.png,.webp,.bmp,.tif,.tiff,.heic" 
                   className="hidden" 
                 />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-400 mb-2">밴드 로고</label>
                 <div 
                   onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                   className="relative h-20 w-20 bg-slate-800 rounded-xl overflow-hidden border border-border group cursor-pointer"
                 >
                    {formData.logoImage ? (
                      <img src={formData.logoImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 opacity-50 group-hover:opacity-30 transition-opacity">
                        <Users size={24} className="text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingLogo ? (
                        <Loader2 className="animate-spin text-white" size={16} />
                      ) : (
                        <Camera size={16} />
                      )}
                    </div>
                 </div>
                 <input 
                   type="file" 
                   ref={logoInputRef} 
                   onChange={handleLogoChange} 
                   accept=".jpg,.jpeg,.gif,.png,.webp,.bmp,.tif,.tiff,.heic" 
                   className="hidden" 
                 />
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">밴드명</label>
                  <input 
                    type="text" 
                    value={formData.name || ''}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors"
                  />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">선호 장르</label>
                    <input 
                      type="text" 
                      value={formData.genre || ''}
                      onChange={(e) => handleChange("genre", e.target.value)}
                      placeholder="예: 신스팝 / 인디록"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">합주 주기</label>
                    <input 
                      type="text" 
                      value={formData.frequency || ''}
                      onChange={(e) => handleChange("frequency", e.target.value)}
                      placeholder="예: 월 4회 (매주 주말)"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors"
                    />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">활동 지역</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select 
                        value={loc1} 
                        onChange={(e) => {
                          setLoc1(e.target.value);
                          setLoc2("전체");
                        }}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
               <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">밴드 소개</label>
                  <textarea 
                    value={formData.description || ''}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={5}
                    placeholder="밴드의 방향성, 분위기 등을 자유롭게 적어주세요."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  />
               </div>
            </div>

            {/* Positions Section */}
            <div className="space-y-4 pt-6 border-t border-border mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-white">멤버 및 포지션 관리</label>
                  <p className="text-xs text-slate-400 mt-1">현재 가입된 멤버와 구인할 포지션을 설정하세요.</p>
                </div>
                <button 
                  onClick={handleAddPosition}
                  className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-primary/30"
                >
                  <Plus size={14} />
                  포지션 추가
                </button>
              </div>

              <div className="space-y-3">
                {formData.positions?.map((pos, idx) => (
                  <div key={pos.id || `pos-${idx}`} className="flex flex-col sm:flex-row gap-3 p-3 bg-background border border-border rounded-xl items-start sm:items-center">
                    
                    <div className="flex-1 flex gap-3 w-full">
                      {/* Role Input */}
                      <input 
                        type="text" 
                        value={pos.role}
                        onChange={(e) => handlePositionChange(pos.id!, 'role', e.target.value)}
                        placeholder="포지션 (예: 보컬)"
                        className="w-1/3 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-primary transition-colors"
                      />

                      {/* Member Name Input */}
                      <input 
                        type="text" 
                        value={pos.memberName}
                        onChange={(e) => handlePositionChange(pos.id!, 'memberName', e.target.value)}
                        placeholder={pos.isRecruiting ? "구인 완료시 입력" : "멤버 닉네임"}
                        disabled={pos.isRecruiting}
                        className={cn(
                          "flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors",
                          pos.isRecruiting && "opacity-50 cursor-not-allowed text-slate-500"
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleToggleRecruiting(pos.id!)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-bold transition-colors border flex items-center gap-1",
                          pos.isRecruiting 
                            ? "bg-primary/20 text-primary border-primary/50" 
                            : "bg-secondary text-slate-400 border-border hover:text-white"
                        )}
                      >
                        <UserPlus size={14} />
                        구인 중
                      </button>
                      <button
                        onClick={() => handleRemovePosition(pos.id!)}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent"
                        title="포지션 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))}

                {(!formData.positions || formData.positions.length === 0) && (
                  <div className="text-center py-6 text-sm font-bold text-slate-500 bg-background rounded-xl border border-dashed border-border">
                    등록된 포지션이 없습니다. 포지션을 추가해주세요.
                  </div>
                )}
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-4 pt-6 border-t border-border mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-white">밴드 히스토리 관리</label>
                  <p className="text-xs text-slate-400 mt-1">밴드의 주요 공연 기록이나 결성일 등을 관리하세요.</p>
                </div>
                <button 
                  onClick={handleAddHistory}
                  className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-primary/30"
                >
                  <Plus size={14} />
                  히스토리 추가
                </button>
              </div>

              <div className="space-y-3">
                {formData.history?.map((hist, idx) => (
                  <div key={hist.id || `history-${idx}`} className="flex gap-3 p-3 bg-background border border-border rounded-xl items-center">
                    <input 
                      type="text" 
                      value={hist.date}
                      onChange={(e) => handleHistoryChange(hist.id, 'date', e.target.value)}
                      placeholder="날짜 (예: 2023.11)"
                      className="w-1/3 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    <input 
                      type="text" 
                      value={hist.title}
                      onChange={(e) => handleHistoryChange(hist.id, 'title', e.target.value)}
                      placeholder="내용 (예: 하반기 클럽 공연)"
                      className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={() => handleRemoveHistory(hist.id)}
                      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent"
                      title="히스토리 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {(!formData.history || formData.history.length === 0) && (
                  <div className="text-center py-6 text-sm font-bold text-slate-500 bg-background rounded-xl border border-dashed border-border">
                    등록된 히스토리가 없습니다. 히스토리를 추가해주세요.
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4 pt-6 border-t border-border mt-8">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-rose-500">
                  <AlertTriangle size={16} /> Danger Zone
                </label>
                <p className="text-xs text-slate-400 mt-1">밴드 해체 시 모든 게시글, 멤버 정보, 신청 내역이 영구적으로 삭제되며 복구할 수 없습니다.</p>
              </div>

              {!showDisbandConfirm ? (
                <button 
                  onClick={() => setShowDisbandConfirm(true)}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  밴드 해체하기
                </button>
              ) : (
                <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-white text-center">정말 해체하시겠습니까?</p>
                  <p className="text-xs text-slate-400 text-center mb-2">해체하려면 밴드 이름(<span className="text-rose-400 font-black">{formData.name}</span>)을 아래에 정확히 입력해 주세요.</p>
                  <input 
                    type="text" 
                    value={disbandConfirmText}
                    onChange={(e) => setDisbandConfirmText(e.target.value)}
                    placeholder="밴드 이름 입력"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 text-center"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setShowDisbandConfirm(false); setDisbandConfirmText(""); }}
                      className="flex-1 bg-secondary text-slate-300 hover:text-white py-2.5 rounded-lg text-sm font-bold transition-colors"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleDisbandBand}
                      disabled={disbandConfirmText !== formData.name}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                    >
                      해체 확인
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border bg-background shrink-0 flex gap-3 justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-secondary hover:bg-slate-800 transition-colors border border-border"
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              저장하기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    <ConfirmModal
      isOpen={alertModal.isOpen}
      onClose={() => setAlertModal({isOpen: false, message: ''})}
      onConfirm={() => setAlertModal({isOpen: false, message: ''})}
      title="알림"
      message={alertModal.message}
      confirmText="확인"
      hideCancel={true}
    />
    </>
  );
}
