"use client";

// @ts-nocheck

import { useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Share2, Heart, MapPin, Star, Clock, 
  Info, Speaker, Music, Check, CalendarIcon, ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";;

// Mock data
const STUDIO_INFO = {
  id: "1",
  name: "프리버드 합주실 본점",
  address: "서울특별시 마포구 와우산로 123 지하 1층",
  rating: 4.8,
  reviewCount: 124,
  description: "홍대입구역 도보 5분 거리의 쾌적하고 장비 관리가 잘 되어있는 프리미엄 합주실입니다. 넓은 로비와 휴게 공간이 마련되어 있습니다.",
  images: [
    "https://picsum.photos/seed/studio1/800/600",
    "https://picsum.photos/seed/studio2/800/600",
    "https://picsum.photos/seed/studio3/800/600",
  ],
  amenities: ["무료 Wi-Fi", "주차 공간(1대)", "냉난방기", "정수기/음료자판기", "전용 화장실"],
  rooms: [
    { 
      id: "roomA", 
      name: "A룸 (MAX 8인)", 
      price: 18000, 
      size: "6.5평",
      equipment: ["Marshall JCM2000", "Fender Twin Reverb", "Ampeg SVT-4PRO", "Pearl Reference Drum", "Yamaha Motif XS8"] 
    },
    { 
      id: "roomB", 
      name: "B룸 (MAX 5인)", 
      price: 15000, 
      size: "4.5평",
      equipment: ["Marshall DSL100", "Vox AC30", "Markbass Little Mark", "Tama Starclassic", "Kurzweil SP6"] 
    },
  ]
};

const TIME_SLOTS = [
  { time: "10:00", available: false },
  { time: "11:00", available: true },
  { time: "12:00", available: true },
  { time: "13:00", available: true },
  { time: "14:00", available: false },
  { time: "15:00", available: false },
  { time: "16:00", available: true },
  { time: "17:00", available: true },
  { time: "18:00", available: true },
  { time: "19:00", available: true },
  { time: "20:00", available: true },
  { time: "21:00", available: true },
  { time: "22:00", available: true },
];

// Generate next 7 days for mock
const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    date: d.getDate(),
    day: ["일", "월", "화", "수", "목", "금", "토"][d.getDay()],
    full: d.toISOString().split('T')[0]
  };
});

export default function StudioIdDynamicPage() {
  const { studioId } = useParams();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(STUDIO_INFO.rooms[0].id);
  const [selectedDate, setSelectedDate] = useState(DATES[0].full);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  const activeRoom = STUDIO_INFO.rooms.find(r => r.id === selectedRoom) || STUDIO_INFO.rooms[0];
  const totalPrice = activeRoom.price * selectedTimes.length;

  const toggleTimeSlot = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
    }
  };

  const handleBooking = () => {
    if (selectedTimes.length === 0) {
      alert("예약할 시간을 선택해주세요.");
      return;
    }
    alert(`[예약 완료]\n선택한 룸: ${activeRoom.name}\n시간: ${selectedTimes.join(", ")}\n총 결제금액: ${totalPrice.toLocaleString()}원`);
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Immersive Header / Gallery */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full bg-slate-900 group">
        <img 
          src={STUDIO_INFO.images[selectedImage]} 
          alt="Studio view" 
          className="w-full h-full object-cover opacity-80 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/50" />
        
        {/* Top Navigation Bar */}
        <header className="absolute top-0 w-full px-4 py-4 md:px-8 md:py-6 z-20 flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/10">
              <Share2 size={18} />
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/10"
            >
              <Heart size={18} className={cn(isLiked && "fill-rose-500 text-rose-500")} />
            </button>
          </div>
        </header>

        {/* Custom Image Paginator */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {STUDIO_INFO.images.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", selectedImage === idx ? "w-4 bg-primary" : "bg-white/50")}
            />
          ))}
        </div>
      </div>

      <main className="px-5 md:px-8 max-w-4xl mx-auto w-full -mt-6 relative z-20 Space-y-6">
        
        {/* Title Info Section */}
        <div className="bg-secondary/80 backdrop-blur-xl border border-border p-6 rounded-3xl shadow-xl mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs font-bold border border-amber-400/20">
              <Star size={12} className="fill-amber-400" />
              <span>{STUDIO_INFO.rating}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">리뷰 {STUDIO_INFO.reviewCount}개</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight">{STUDIO_INFO.name}</h1>
          <p className="text-slate-400 text-sm flex items-start gap-1.5 mb-5 font-medium leading-relaxed">
            <MapPin size={16} className="shrink-0 mt-0.5 text-primary" />
            {STUDIO_INFO.address}
          </p>
          <div className="h-px w-full bg-border/50 mb-5" />
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {STUDIO_INFO.description}
          </p>
        </div>

        {/* Amenities Section */}
        <div className="mb-8 p-1">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Info size={18} className="text-primary"/>
            제공 시설
          </h3>
          <div className="flex flex-wrap gap-2">
            {STUDIO_INFO.amenities.map(amenity => (
              <span key={amenity} className="bg-secondary border border-border text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                <Check size={12} className="text-primary" />
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Room Selection */}
        <div className="mb-8 p-1">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Speaker size={18} className="text-primary"/>
            룸 선택 및 장비 확인
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {STUDIO_INFO.rooms.map(room => (
              <div 
                key={room.id}
                onClick={() => { setSelectedRoom(room.id); setSelectedTimes([]); }}
                className={cn(
                  "border rounded-2xl p-5 cursor-pointer transition-all duration-300",
                  selectedRoom === room.id 
                    ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                    : "bg-secondary border-border hover:border-slate-500"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={cn("text-lg font-black", selectedRoom === room.id ? "text-primary" : "text-white")}>{room.name}</h4>
                  <span className="text-sm font-bold text-slate-300 bg-background/50 border border-border px-2 py-1 rounded-md">{room.size}</span>
                </div>
                <p className="text-base font-bold text-white mb-4">
                  {room.price.toLocaleString()}원 <span className="text-xs text-slate-500 font-medium font-sans">/ 시간</span>
                </p>
                <ul className="space-y-1.5">
                  {room.equipment.slice(0, 3).map(eq => (
                    <li key={eq} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-slate-600" />
                      {eq}
                    </li>
                  ))}
                  {room.equipment.length > 3 && (
                    <li className="text-xs font-bold text-primary italic pt-1 pl-2">+ {room.equipment.length - 3}개의 장비 더보기</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Date & Time Selection (예약) */}
        <div className="mb-8 bg-secondary/30 rounded-3xl p-5 md:p-6 border border-border">
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary"/>
            일정 예약
          </h3>
          
          {/* Date Picker (Horizontal) */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 mb-2 -mx-2 px-2">
            {DATES.map((d, i) => {
              const isSelected = selectedDate === d.full;
              const isWeekend = d.day === "토" || d.day === "일";
              return (
                <button
                  key={d.full}
                  onClick={() => { setSelectedDate(d.full); setSelectedTimes([]); }}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[60px] h-20 rounded-2xl border transition-all shrink-0",
                    isSelected 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/25" 
                      : "bg-secondary border-border text-slate-400 hover:border-slate-500"
                  )}
                >
                  <span className={cn("text-xs font-bold mb-1", isWeekend && !isSelected && "text-rose-400")}>{d.day}</span>
                  <span className="text-lg font-black">{d.date}</span>
                </button>
              );
            })}
          </div>

          <div className="h-px w-full bg-border mb-6" />

          {/* Time Slots */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTimes.includes(slot.time);
              return (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => toggleTimeSlot(slot.time)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold border transition-all duration-200",
                    !slot.available 
                      ? "bg-background/50 border-transparent text-slate-600 cursor-not-allowed opacity-50" 
                      : isSelected
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                        : "bg-secondary border-border text-slate-300 hover:border-primary/50 hover:bg-slate-800"
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Booking Bar */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 w-full bg-secondary/95 backdrop-blur-xl border-t border-border p-4 md:p-6 z-40 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 mb-0.5">총 결제 금액</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{totalPrice.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-300">원</span>
            </div>
            {selectedTimes.length > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">
                {selectedTimes.length}시간 선택됨 ({selectedTimes[0]} ~ {parseInt(selectedTimes[selectedTimes.length-1])+1}:00)
              </span>
            )}
          </div>
          <button 
            onClick={handleBooking}
            className={cn(
              "px-8 py-4 rounded-xl font-black text-white text-base md:text-lg transition-all duration-300 flex items-center gap-2",
              selectedTimes.length > 0 
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105" 
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            예약하기 <ChevronRight size={20} className={cn(selectedTimes.length === 0 && "opacity-50")} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
