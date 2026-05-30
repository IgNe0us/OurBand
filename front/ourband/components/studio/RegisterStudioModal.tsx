"use client";
// @ts-nocheck
import React, { useState } from "react";
import { X, Building2, MapPin, Speaker, Image as ImageIcon, Plus, Trash2, Check, CheckSquare, Info, Link as LinkIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DaumPostcode from 'react-daum-postcode';
import { createStudioApi, updateStudioApi } from "@/api/studio/studioService";
import { useRouter } from "next/navigation";

interface RegisterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // To support editing
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
  equipment: string;
}

export function RegisterStudioModal({ isOpen, onClose, initialData }: RegisterStudioModalProps) {
  const router = useRouter();
  const [studioName, setStudioName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [detailAddress, setDetailAddress] = useState("");
  const [description, setDescription] = useState(initialData?.description || "");
  const [bookingUrl, setBookingUrl] = useState(initialData?.bookingUrl || "");
  
  const [amenities, setAmenities] = useState<string[]>(
    initialData?.amenities ? initialData.amenities.split(',').map((s: string) => s.trim()) : []
  );
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  
  const [rooms, setRooms] = useState<RoomInput[]>(
    initialData?.rooms && initialData.rooms.length > 0 
      ? initialData.rooms.map((r: any) => ({ id: Math.random().toString(), name: r.name, size: r.size, equipment: r.equipment }))
      : [{ id: '1', name: '', size: '', equipment: '' }]
  );
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0 
      ? initialData.images.map((img: any) => typeof img === 'string' ? img : img.imageUrl)
      : []
  ); 
  
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setRooms([...rooms, { id: Math.random().toString(), name: '', size: '', equipment: '' }]);
  };

  const updateRoom = (id: string, field: keyof RoomInput, value: string) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRoom = (id: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // 동일한 파일을 다시 선택할 수 있도록 value 초기화
    e.target.value = '';
  };

  const handleCompletePostcode = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') extraAddress += data.bname;
      if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    setAddress(fullAddress);
    setIsPostcodeOpen(false);
  };

  const getLatLngFromKakao = (addr: string): Promise<{ lat: number, lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        // Fallback dummy coords if kakao map fails to load (e.g. 401 error)
        resolve({ lat: 37.5488, lng: 126.9141 });
        return;
      }
      
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addr, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else {
          // Fallback
          resolve({ lat: 37.5488, lng: 126.9141 });
        }
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rooms.length === 0 || rooms.some(r => !r.name)) {
      alert("룸 이름을 정확히 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const coordinates = await getLatLngFromKakao(address);
      const finalAddress = detailAddress ? `${address} ${detailAddress}` : address;
      const finalAmenities = amenities.join(", ");
      
      const payload = {
        name: studioName,
        address: finalAddress,
        lat: coordinates.lat,
        lng: coordinates.lng,
        description: description,
        amenities: finalAmenities,
        bookingUrl: bookingUrl || null,
        rooms: rooms
          .filter(r => r.name.trim())
          .map(r => ({
            name: r.name,
            size: r.size,
            equipment: r.equipment
          })),
        imageUrls: images
      };
      
      if (initialData) {
        await updateStudioApi(initialData.id, payload);
        alert("합주실 정보가 수정되었습니다.");
      } else {
        await createStudioApi(payload);
        alert("성공적으로 등록되었습니다.");
      }
      
      onClose();
      // Reload page to fetch new studios
      window.location.reload();
      
    } catch (error) {
      console.error(error);
      alert(initialData ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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
                    <p className="text-[11px] text-slate-400 mt-0.5">자신의 합주실을 소개하고 밴드와 연결되세요.</p>
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
                    <label className="text-[11px] font-bold text-slate-400 pl-1">주소 (우편번호 검색) *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={address}
                          readOnly
                          placeholder="주소 검색 버튼을 눌러주세요" 
                          className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none cursor-pointer"
                          required
                          onClick={() => setIsPostcodeOpen(true)}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsPostcodeOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-xl text-sm font-bold border border-slate-600 transition-colors shrink-0"
                      >
                        주소 찾기
                      </button>
                    </div>
                    {isPostcodeOpen && (
                      <div className="mt-2 border border-border rounded-xl overflow-hidden relative">
                         <button 
                            type="button"
                            onClick={() => setIsPostcodeOpen(false)}
                            className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1"
                          >
                            <X size={16} />
                          </button>
                         <DaumPostcode onComplete={handleCompletePostcode} autoClose={false} style={{ height: "400px" }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">상세 주소</label>
                    <input 
                      type="text" 
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="상세 주소를 입력하세요 (예: 지하 1층)" 
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">합주실 요금표 및 상세 설명 *</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="규모, 분위기, 룸별 요금표, 혜택 등을 자유롭게 적어주세요." 
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">네이버 예약 (또는 외부 예약) 링크 (선택)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="url" 
                        value={bookingUrl}
                        onChange={(e) => setBookingUrl(e.target.value)}
                        placeholder="예: https://m.booking.naver.com/..." 
                        className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 pl-1">대표 사진 및 시설 사진 등록</label>
                    <label className="w-full bg-background border border-dashed border-border hover:border-primary/50 hover:bg-slate-800/50 rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                      <ImageIcon className="text-slate-500" size={24} />
                      <span className="text-sm font-medium text-slate-400">클릭하여 사진 첨부하기</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                    </label>
                    
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {images.map((img, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border relative group">
                            <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      룸 (Room) 장비 정보 *
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
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl py-4 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={20} /> 처리 중...</>
                  ) : "합주실 등록하기"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
