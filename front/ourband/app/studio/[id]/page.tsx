"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Share2, Heart, MapPin, Star, Info, Speaker, Check, MessageCircle, ExternalLink, ShieldAlert, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { getStudioApi, deleteStudioApi, reportStudioApi, type StudioData } from "@/api/studio/studioService";
import { getUserInfoApi } from "@/api/account/userService";
import { RegisterStudioModal } from "@/components/studio/RegisterStudioModal";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

export default function StudioIdDynamicPage() {
  const { confirm } = useConfirm();
  const params = useParams();
  const studioId = params?.id as string;
  const router = useRouter();
  
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    getUserInfoApi().then(user => {
      if (user && user.userId) {
        setCurrentUserId(user.userId);
      }
    }).catch(err => console.log('Not logged in'));
  }, []);

  useEffect(() => {
    if (!studioId) return;
    
    // 외부 데이터(카카오 지도)인 경우
    if (studioId.startsWith('ext-')) {
      setError("외부 지도 데이터는 상세 페이지를 지원하지 않습니다. 지도에서 위치만 확인할 수 있습니다.");
      setLoading(false);
      return;
    }

    getStudioApi(studioId)
      .then(data => {
        setStudio(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("합주실 정보를 불러오는데 실패했습니다.");
        setLoading(false);
      });
  }, [studioId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold">합주실 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">오류 발생</h2>
        <p className="text-slate-400 text-center mb-6">{error}</p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  const amenitiesList = studio.amenities ? studio.amenities.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  // Backend might send string[] or {imageUrl: string}[] depending on the API structure
  const displayImages = studio.images && studio.images.length > 0 
    ? studio.images.map((img: any) => typeof img === 'string' ? img : img.imageUrl)
    : ["https://picsum.photos/seed/placeholder/800/600"]; // Placeholder if no image

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Standard Header */}
      <header className="sticky top-0 w-full px-4 py-4 md:px-8 md:py-6 z-30 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-border"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-border">
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-border"
          >
            <Heart size={18} className={cn(isLiked && "fill-rose-500 text-rose-500")} />
          </button>
        </div>
      </header>

      <main className="px-5 md:px-8 max-w-4xl mx-auto w-full pt-6 relative z-20 space-y-6">
        
        {/* Title Info Section */}
        <div className="bg-secondary/80 backdrop-blur-xl border border-border p-6 rounded-3xl shadow-xl mb-6 relative">
          
          {/* Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-2">
            {studio.ownerId && currentUserId === studio.ownerId ? (
              <>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-primary transition-colors bg-background rounded-lg border border-border"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={async () => {
                    if (await confirm({ message: "정말 이 합주실 정보를 삭제하시겠습니까?", isDestructive: true })) {
                      try {
                        await deleteStudioApi(studio.id);
                        toast.success("삭제되었습니다.");
                        router.push('/studio');
                      } catch (err) {
                        toast.error("삭제에 실패했습니다.");
                      }
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-background rounded-lg border border-border"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              !studio.isExternal && (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-background rounded-lg border border-border flex items-center gap-1 text-xs font-bold"
                >
                  <AlertTriangle size={14} /> 신고
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 mb-2 pr-20">
            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs font-bold border border-amber-400/20">
              <Star size={12} className="fill-amber-400" />
              <span>{studio.rating || "0.0"}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">리뷰 {studio.reviewCount || 0}개</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight tracking-tight pr-20">{studio.name}</h1>
          <p className="text-slate-400 text-sm flex items-start gap-1.5 mb-5 font-medium leading-relaxed">
            <MapPin size={16} className="shrink-0 mt-0.5 text-primary" />
            {studio.address}
          </p>
          <div className="h-px w-full bg-border/50 mb-5" />
          <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
            {studio.description || "등록된 소개글이 없습니다."}
          </p>
        </div>

        {/* Image Gallery Carousel */}
        <div className="bg-secondary/40 border border-border rounded-3xl p-4 mb-6 shadow-sm">
          <h3 className="text-lg font-black text-white mb-3 ml-2 flex items-center gap-2">
            <Info size={18} className="text-primary"/>
            시설 및 사진
          </h3>
          <div className="relative group overflow-hidden rounded-2xl border border-border/50 bg-black aspect-video flex items-center justify-center">
            <img 
              src={displayImages[selectedImage]} 
              alt="Studio preview" 
              className="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              onClick={() => setIsLightboxOpen(true)}
            />
            
            {/* Left Button */}
            {displayImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Right Button */}
            {displayImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Paginator Indicators */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {displayImages.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                    className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", selectedImage === idx ? "w-4 bg-primary" : "bg-white/50")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amenities Section */}
        {amenitiesList.length > 0 && (
          <div className="mb-8 p-1">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary"/>
              제공 시설
            </h3>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map(amenity => (
                <span key={amenity} className="bg-secondary border border-border text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Check size={12} className="text-primary" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Room Selection */}
        {studio.rooms && studio.rooms.length > 0 && (
          <div className="mb-8 p-1">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Speaker size={18} className="text-primary"/>
              보유 룸 및 장비 안내
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {studio.rooms.map(room => (
                <div 
                  key={room.id}
                  className="bg-secondary border-border border rounded-2xl p-5 hover:border-slate-500 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-black text-white">{room.name}</h4>
                    <span className="text-sm font-bold text-slate-300 bg-background/50 border border-border px-2 py-1 rounded-md">{room.size}</span>
                  </div>
                  
                  <ul className="space-y-1.5">
                    {room.equipment ? room.equipment.split(',').map((eq, i) => (
                      <li key={i} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                        {eq.trim()}
                      </li>
                    )) : (
                      <li className="text-xs font-medium text-slate-500">장비 정보가 없습니다.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Contact Bar */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 w-full bg-secondary/95 backdrop-blur-xl border-t border-border p-4 md:p-6 z-40 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 mb-1">문의 및 예약</span>
            <span className="text-sm font-bold text-white">이 합주실에 연락해보세요!</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => toast.error("1:1 채팅 기능은 준비 중입니다.")}
              className="px-5 py-3.5 rounded-xl font-bold text-white text-sm transition-all flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600"
            >
              <MessageCircle size={18} />
              1:1 대화하기
            </button>
            
            {studio.bookingUrl ? (
              <a 
                href={studio.bookingUrl.startsWith('http') ? studio.bookingUrl : `https://${studio.bookingUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 rounded-xl font-black text-white text-sm transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-[#03C75A] to-[#02b350] hover:scale-105 shadow-[0_0_20px_rgba(3,199,90,0.3)]"
              >
                네이버 예약 <ExternalLink size={16} />
              </a>
            ) : (
              <button 
                onClick={() => toast.error("등록된 외부 예약 링크가 없습니다. 1:1 대화로 문의해주세요.")}
                className="px-5 py-3.5 rounded-xl font-bold text-white text-sm transition-all flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                예약 문의하기
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 md:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button 
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-50"
              onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            >
              <X size={28} />
            </button>
            
            {/* Left Button for Lightbox */}
            {displayImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev - 1);
                }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-50"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Right Button for Lightbox */}
            {displayImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-50"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={displayImages[selectedImage]} 
              alt="Fullscreen Studio View"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing the lightbox
            />
            
            {/* Paginator for Lightbox */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {displayImages.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                    className={cn("w-2 h-2 rounded-full transition-all duration-300", selectedImage === idx ? "w-6 bg-white" : "bg-white/40 hover:bg-white/60")}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Actions */}

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-secondary w-full max-w-sm rounded-[2rem] border border-border shadow-2xl p-6"
            >
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-rose-500" />
                합주실 신고하기
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                허위 정보, 부적절한 이미지, 또는 운영되지 않는 합주실인 경우 신고해주세요.
              </p>
              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="신고 사유를 상세히 적어주세요."
                rows={4}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-rose-500 transition-all resize-none mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
                >
                  취소
                </button>
                <button 
                  onClick={async () => {
                    if (!reportReason.trim()) return toast.error('신고 사유를 입력해주세요.');
                    try {
                      await reportStudioApi(studio.id, reportReason);
                      toast.success('신고가 접수되었습니다.');
                      setIsReportModalOpen(false);
                      setReportReason("");
                    } catch (err) {
                      toast.error('신고 접수에 실패했습니다.');
                    }
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition"
                >
                  신고 접수
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Studio Modal */}
      {isEditModalOpen && studio && (
        <RegisterStudioModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={studio}
        />
      )}
    </div>
  );
}
