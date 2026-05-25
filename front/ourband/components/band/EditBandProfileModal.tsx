"use client";
// @ts-nocheck
import { X, Camera, Save, Plus, Trash2, UserPlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { uploadToCloudflare } from "@/lib/cloudflare";

import { type BandProfileData, type BandHistory, type BandPositionData as BandPosition } from "@/api/band/bandService";
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
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof Omit<BandProfileData, "positions" | "history">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadToCloudflare(file);
      setFormData((prev) => ({ ...prev, logoImage: url }));
    } catch (err) {
      console.error("Failed to upload logo:", err);
      alert("로고 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadToCloudflare(file);
      setFormData((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error("Failed to upload cover image:", err);
      alert("커버 이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
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

  if (!isOpen) return null;

  return (
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
            <h2 className="text-xl font-black text-white">밴드 프로필 수정</h2>
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
                    <img src={formData.coverImage || "https://picsum.photos/seed/bandcover/800/400"} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
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
                   accept="image/*" 
                   className="hidden" 
                 />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-400 mb-2">밴드 로고</label>
                 <div 
                   onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                   className="relative h-20 w-20 bg-slate-800 rounded-xl overflow-hidden border border-border group cursor-pointer"
                 >
                    <img src={formData.logoImage || "https://picsum.photos/seed/bandlogo/150/150"} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
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
                   accept="image/*" 
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
                  <input 
                    type="text" 
                    value={formData.location || ''}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="예: 홍대 / 합정"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-primary transition-colors"
                  />
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
  );
}
