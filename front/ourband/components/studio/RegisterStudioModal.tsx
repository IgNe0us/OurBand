"use client";
// @ts-nocheck
import React, { useState } from "react";
import { X, Building2, MapPin, Speaker, Image as ImageIcon, Plus, Trash2, Check, CheckSquare, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";;

interface RegisterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_AMENITIES = [
  "무료 Wi-Fi", "주차 공간(1대)", "냉난방기", "정수기/음료자판기",
  "전용 화장실", "엘리베이터", "대기실/휴게실", "보면대/스탠드",
  "CCTV", "방음 도어"
];

interface RoomInput {
  id: string;
  name: string;
  size: string;
  price: string;
  equipment: string;
}

export function RegisterStudioModal({ isOpen, onClose }: RegisterStudioModalProps) {
  const [studioName, setStudioName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [rooms, setRooms] = useState<RoomInput[]>([{ id: '1', name: '', size: '', price: '', equipment: '' }]);

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddAmenity = () => {
    const trimmed = newAmenity.trim();
    if (trimmed && !COMMON_AMENITIES.includes(trimmed) && !customAmenities.includes(trimmed)) {
      setCustomAmenities([...customAmenities, trimmed]);
      setAmenities([...amenities, trimmed]);
    }
    setNewAmenity("");
  };

  const addRoom = () => {
    setRooms([...rooms, { id: Math.random().toString(), name: '', size: '', price: '', equipment: '' }]);
  };

  const updateRoom = (id: string, field: keyof RoomInput, value: string) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRoom = (id: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rooms.length === 0 || rooms.some(r => !r.name || !r.price)) {
      alert("룸 정보와 가격을 정확히 입력해주세요.");
      return;
    }
    alert("내 합주실 등록 신청이 완료되었습니다.\n운영자 검토 후 실시간 빈 방 지도(Map)에 반영됩니다.");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-secondary w-full max-w-2xl rounded-[2rem] border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-border bg-background shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 text-primary border border-primary/30 p-2 rounded-xl">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white">합주실 직접 등록</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">상세한 정보를 입력하여 많은 밴드와 연결되세요.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Scrollable Body */}
              <div className="p-5 md:p-6 overflow-y-auto hide-scrollbar space-y-8 bg-background/30">
                
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-border pb-2">
                    <Info size={16} className="text-primary" />
                    기본 정보
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">합주실 (업장) 이름 *</label>
                    <input 
                      type="text" 
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="상호명을 입력하세요" 
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">상세 주소 (지도 API 기반) *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="검색어를 입력하세요 (예: 상수동 123-4)" 
                        className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">합주실 상세 설명 *</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="규모, 분위기, 혜택, 오시는 길 등을 자세히 적어주세요." 
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">대표 사진 및 시설 사진 등록</label>
                    <label className="w-full bg-background border border-dashed border-border hover:border-primary/50 hover:bg-slate-800/50 rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                      <ImageIcon className="text-slate-500" size={24} />
                      <span className="text-sm font-medium text-slate-400">사진 첨부하기 (최대 10장)</span>
                      <input type="file" accept="image/*" multiple className="hidden" />
                    </label>
                  </div>
                </div>

                {/* 2. Amenities */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-border pb-2">
                    <CheckSquare size={16} className="text-primary" />
                    제공 시설 (선택)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...COMMON_AMENITIES, ...customAmenities].map((amenity) => {
                      const isSelected = amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={cn(
                            "text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border",
                            isSelected 
                              ? "bg-primary/20 border-primary/50 text-white shadow-inner" 
                              : "bg-background border-border text-slate-400 hover:border-slate-500 hover:text-slate-300"
                          )}
                        >
                          {isSelected && <Check size={12} className="text-primary" />}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 w-full max-w-sm">
                    <input 
                      type="text" 
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmenity();
                        }
                      }}
                      placeholder="직접 입력 (예: 공기청정기)"
                      className="flex-1 bg-background border border-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddAmenity}
                      className="bg-secondary border border-border text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 3. Rooms & Equipment */}
                <div className="space-y-4 pb-4">
                  <div className="flex justify-between items-end border-b border-border pb-2">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Speaker size={16} className="text-primary" />
                      룸 (Room) 상세 정보 및 장비 *
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {rooms.map((room, index) => (
                      <motion.div 
                        key={room.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-background border border-border p-5 rounded-2xl space-y-4 relative group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">룸 #{index + 1}</h4>
                          {rooms.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeRoom(room.id)} 
                              className="text-slate-500 hover:text-rose-500 p-1 flex items-center gap-1 text-xs font-medium"
                            >
                              <Trash2 size={14} /> 삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500">룸 이름</label>
                            <input 
                              value={room.name} 
                              onChange={(e) => updateRoom(room.id, 'name', e.target.value)} 
                              type="text" 
                              placeholder="예: A룸 (MAX 8인)" 
                              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                              required 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500">방 크기</label>
                            <input 
                              value={room.size} 
                              onChange={(e) => updateRoom(room.id, 'size', e.target.value)} 
                              type="text" 
                              placeholder="예: 6.5평" 
                              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                              required 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">시간당 대여료 (원)</label>
                          <input 
                            value={room.price} 
                            onChange={(e) => updateRoom(room.id, 'price', e.target.value)} 
                            type="number" 
                            min="0"
                            placeholder="예: 18000" 
                            className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                            required 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">주요 장비 (쉼표로 구분)</label>
                          <textarea 
                            value={room.equipment} 
                            onChange={(e) => updateRoom(room.id, 'equipment', e.target.value)} 
                            placeholder="예: Marshall JCM2000 2대, Ampeg SVT PRO, Pearl Reference Drum, Yamaha Motif" 
                            rows={2} 
                            className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" 
                            required 
                          />
                        </div>
                      </motion.div>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={addRoom} 
                      className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-slate-400 font-bold text-sm hover:border-primary hover:text-white hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> 새로운 룸 규격 추가하기
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 md:p-6 border-t border-border bg-background shrink-0">
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-indigo-600 text-white font-black rounded-xl py-4 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                >
                  제출 및 등록 신청
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
