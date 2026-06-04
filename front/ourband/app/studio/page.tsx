"use client";
import { useContext } from "react";
import { StudioMapView, type MapStudio } from "@/components/studio/StudioMapView";
// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Search, AlertCircle, Plus, Star, Zap, Menu, X, Music2, Map as MapIcon, List, Building2, ExternalLink, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import type { LayoutContextType } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "motion/react";
import { RegisterStudioModal } from "@/components/studio/RegisterStudioModal";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";



import { getStudiosApi, type StudioData, callEmergencySessionApi } from "@/api/studio/studioService";
import toast from "react-hot-toast";
import { KOREA_REGIONS } from "@/lib/regions";

export interface ExtendedStudioData extends StudioData {
  isExternal?: boolean;
}

export default function StudioPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  const [myLocation, setMyLocation] = useState<[number, number]>([37.5488, 126.9141]); // Default Hongdae
  const [platformStudios, setPlatformStudios] = useState<ExtendedStudioData[]>([]);
  const [externalStudios, setExternalStudios] = useState<ExtendedStudioData[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedExternal, setSelectedExternal] = useState<StudioData | null>(null);

  const [sosPosition, setSosPosition] = useState("");
  const [sosRegion, setSosRegion] = useState("");
  const [sosSubRegion, setSosSubRegion] = useState("");
  const [sosDetailAddress, setSosDetailAddress] = useState("");
  const [sosDatetime, setSosDatetime] = useState("");
  const [sosPay, setSosPay] = useState("");
  const [sosDesc, setSosDesc] = useState("");

  const { openMenu } = useContext(LayoutContext);

  const rawKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY as string || "";
  const sanitizedKey = rawKey.replace("NEXT_PUBLIC_KAKAO_MAP_APP_KEY=", "").trim();

  // 카카오 맵 로드
  const [loading, error] = useKakaoLoader({
    appkey: sanitizedKey || "dummy", 
    libraries: ["services"]
  });

  const isKakaoAvailable = !!sanitizedKey && !error;

  const fetchUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("lat", lat);
          console.log("lng", lng);
          setMyLocation([lat, lng]);
          setIsLoadingLocation(false);
        },
        (err) => {
          console.error("위치 정보를 가져올 수 없습니다. 기본 위치를 사용합니다.", err);
          setLocationError("위치 권한이 차단되었거나 기기에서 지원하지 않아 기본 위치(홍대)로 표시됩니다.");
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("이 브라우저는 위치 추적을 지원하지 않습니다.");
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  // 외부 검색을 위한 거리 계산기 (Haversine format)
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const formatDistance = (distKm: number) => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(1)}km`;
  };

  const fetchExternalStudios = () => {
    if (!isKakaoAvailable || !(window as any).kakao || !(window as any).kakao.maps || !(window as any).kakao.maps.services) return;
    
    const ps = new (window as any).kakao.maps.services.Places();
    ps.keywordSearch("합주실", (data: any, status: any) => {
      if (status === (window as any).kakao.maps.services.Status.OK) {
        const results: ExtendedStudioData[] = data.map((el: any) => {
          const lat = Number(el.y) || 0;
          const lng = Number(el.x) || 0;
          const distKm = getDistanceFromLatLonInKm(myLocation[0], myLocation[1], lat, lng);
          
          return {
            id: `ext-${el.id}`,
            name: `${el.place_name} (외부 데이터)`,
            address: el.address_name,
            description: "",
            amenities: "",
            dist: formatDistance(distKm),
            distKm,
            rating: Number((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)), // Mock rating
            reviewCount: 0,
            lat,
            lng,
            isExternal: true
          };
        }).sort((a: ExtendedStudioData, b: ExtendedStudioData) => (a.distKm || 0) - (b.distKm || 0));
        
        setExternalStudios(results);
      }
    }, {
      location: new (window as any).kakao.maps.LatLng(myLocation[0], myLocation[1]),
      radius: 10000,
      sort: (window as any).kakao.maps.services.SortBy.DISTANCE
    });
  };

  const fetchPlatformStudios = async () => {
    try {
      const data = await getStudiosApi(myLocation[0], myLocation[1], 10);
      const withDistance = data.map(studio => {
        const distKm = getDistanceFromLatLonInKm(myLocation[0], myLocation[1], studio.lat, studio.lng);
        return {
          ...studio,
          distKm,
          dist: formatDistance(distKm)
        };
      });
      setPlatformStudios(withDistance);
    } catch (err) {
      console.error("Failed to fetch platform studios", err);
    }
  };

  // 지도 데이터 가져오기 (카카오 에러가 나도 자체 DB 합주실은 가져와야 함)
  useEffect(() => {
    if (!loading && !isLoadingLocation) {
      if (isKakaoAvailable) {
        fetchExternalStudios();
      }
      fetchPlatformStudios();
    }
  }, [loading, isKakaoAvailable, isLoadingLocation, myLocation]);

  const allStudios = [...platformStudios, ...externalStudios].sort((a, b) => (a.distKm || 0) - (b.distKm || 0));

  const filteredStudios = allStudios
    .filter(studio => 
      (studio.distKm !== undefined && studio.distKm <= 10) && // 10km 이내만 표시
      (studio.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       studio.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <header className="px-6 pt-12 pb-4 bg-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-border md:pt-8 md:px-8">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={openMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <Menu size={28} />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white mb-0">합주실 & SOS</h1>
        </div>
        
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="지역, 합주실 이름 검색 (예: 합정동)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder-slate-500 shadow-inner"
          />
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-8 max-w-5xl">
        {/* Emergency SOS Button */}
        <div className="relative group overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-br from-red-600 via-rose-500 to-orange-500">
          <div className="bg-[#0A0C10] rounded-[2rem] p-6 md:p-8 relative overflow-hidden h-full w-full">
            <div className="absolute -top-10 -right-10 opacity-10 text-primary animate-pulse duration-3000">
              <Zap size={140} fill="currentColor" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">SOS</span>
                <h3 className="font-bold text-lg md:text-xl text-white">당일 펑크 타파, 긴급 용병!</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6 w-4/5 md:w-2/3 leading-relaxed">반경 10km 내 상위 랭킹 세션에게 즉시 푸시 알림을 발송합니다.</p>
              <button 
                onClick={() => setIsSOSModalOpen(true)}
                className="bg-white hover:bg-slate-100 text-red-600 font-black px-6 py-3.5 rounded-xl text-sm w-full md:w-auto shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex justify-center items-center gap-2"
              >
                <AlertCircle size={18} />
                긴급 세션 호출하기
              </button>
            </div>
          </div>
        </div>

        {/* Studio Discovery */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              내 주변 실시간 빈 방
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (viewMode === "list") setViewMode("map");
                  else setViewMode("list");
                }}
                className="bg-secondary/80 border border-border px-3 py-1.5 flex items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {viewMode === "list" ? <MapIcon size={16} /> : <List size={16} />}
                {viewMode === "list" ? "지도 보기" : "목록 보기"}
              </button>
            </div>
          </div>

          {/* Date Selector removed as booking feature is dropped */}

          {/* Map or List View */}
          {viewMode === "map" ? (
            <div className="mt-4 mb-20 animate-in fade-in duration-500">
               {isLoadingLocation ? (
                 <div className="w-full h-[400px] flex items-center justify-center bg-secondary rounded-2xl border border-border">
                   <div className="text-slate-400 font-bold flex flex-col items-center gap-3">
                     <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                     현재 위치를 가져오는 중...
                   </div>
                 </div>
               ) : (
                 <div className="relative z-0">
                   {locationError && (
                     <div className="absolute top-4 left-4 right-4 z-10 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center justify-between">
                       {locationError}
                       <button onClick={() => setLocationError(null)} className="ml-2 hover:bg-white/20 p-1 rounded-md">
                         <X size={14} />
                       </button>
                     </div>
                   )}
                   <StudioMapView 
                     center={myLocation} 
                     studios={filteredStudios} 
                     onExternalClick={(s) => setSelectedExternal(s as StudioData)}
                   />
                   <button 
                     onClick={fetchUserLocation}
                     className="absolute bottom-6 right-6 z-10 bg-slate-800 text-white border border-slate-700 shadow-xl px-4 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition"
                   >
                     <Navigation size={14} className="text-primary" />
                     내 위치 다시 찾기
                   </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 mb-20 animate-in fade-in duration-500">
              {filteredStudios.map((studio) => (
                <div 
                  key={studio.id} 
                  onClick={() => {
                    if (studio.isExternal) {
                      setSelectedExternal(studio);
                    } else {
                      navigate(`/studio/${studio.id}`);
                    }
                  }}
                className="bg-secondary border border-border rounded-[1.5rem] p-3 flex gap-4 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                  <div className="w-28 h-28 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative">
                  {studio.images && studio.images.length > 0 ? (
                    <img src={studio.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Studio" referrerPolicy="no-referrer" />
                  ) : studio.isExternal ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                      <MapPin size={24} />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                      <Building2 size={24} />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    {studio.rating}
                  </div>
                </div>
                <div className="flex flex-col justify-between flex-1 py-1">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white leading-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {studio.name}
                        {studio.isExternal && <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">외부 정보</span>}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <MapPin size={12} className="text-primary" /> {studio.address} • {studio.dist}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mt-2">
                    {!studio.isExternal && studio.bookingUrl ? (
                      <div className="text-[11px] text-primary flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                        <ExternalLink size={12} /> 예약 링크 제공
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 bg-background px-3 py-1.5 rounded-lg border border-border">
                        <Navigation size={12} /> {studio.isExternal ? "외부 합주실" : "1:1 대화로 문의"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

              {filteredStudios.length === 0 && (
                <div className="text-center py-10 lg:col-span-2 text-slate-500">
                  <p>조건에 맞는 합주실이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Floating Register Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsRegisterModalOpen(true);
        }}
        className="fixed bottom-24 right-5 md:bottom-10 md:right-10 bg-[#1e293b] border-2 border-primary text-white p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] z-40 flex items-center gap-2 group"
      >
        <Building2 size={24} className="text-primary group-hover:text-white transition-colors" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold whitespace-nowrap text-sm">
          내 합주실 등록하기
        </span>
      </motion.button>

      {/* Register Studio Modal */}
      <RegisterStudioModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* External Studio Route Map Modal */}
      <AnimatePresence>
        {selectedExternal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedExternal(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-secondary rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-background">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-1.5"><Navigation size={18} className="text-primary"/> 위치 경로 확인</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedExternal.name}</p>
                </div>
                <button onClick={() => setSelectedExternal(null)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              
              <div className="h-[350px] w-full relative z-0">
                {!loading && isKakaoAvailable && (window as any).kakao && (window as any).kakao.maps ? (
                  <Map
                    center={{ 
                      lat: (myLocation[0] + (selectedExternal?.lat || 0)) / 2, 
                      lng: (myLocation[1] + (selectedExternal?.lng || 0)) / 2 
                    }}
                    style={{ width: "100%", height: "100%" }}
                    level={6} 
                  >
                    <MapMarker position={{ lat: myLocation[0] || 0, lng: myLocation[1] || 0 }}>
                      <div className="p-1 px-2 font-bold font-sans text-xs text-slate-800 text-center whitespace-nowrap">
                        현재 내 위치
                      </div>
                    </MapMarker>
                    
                    {selectedExternal && (
                      <MapMarker 
                        position={{ lat: selectedExternal?.lat || 0, lng: selectedExternal?.lng || 0 }}
                        image={{
                          src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                          size: { width: 24, height: 35 },
                        }}
                      >
                        <div className="p-1 px-2 font-bold font-sans text-xs text-slate-800 text-center whitespace-nowrap">
                          {selectedExternal.name}
                        </div>
                      </MapMarker>
                    )}
                    
                    {selectedExternal && (
                      <Polyline 
                        path={[
                          { lat: myLocation[0] || 0, lng: myLocation[1] || 0 },
                          { lat: selectedExternal?.lat || 0, lng: selectedExternal?.lng || 0 }
                        ]}
                        strokeWeight={4}
                        strokeColor="#6366f1"
                        strokeOpacity={0.8}
                        strokeStyle="dash"
                      />
                    )}
                  </Map>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                     카카오 지도 준비 중이거나 앱 키가 없습니다.
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-background flex justify-between items-center border-t border-border">
                <div className="flex items-center gap-2">
                   <MapPin className="text-slate-400" size={16}/>
                   <span className="text-sm font-bold text-white">직선 거리: <span className="text-primary">{selectedExternal.dist}</span></span>
                </div>
                <button 
                  onClick={() => setSelectedExternal(null)}
                  className="bg-primary hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                >
                  지도 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <AnimatePresence>
        {isSOSModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setIsSOSModalOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-secondary w-full max-w-lg rounded-[2rem] p-6 md:p-8 border border-border shadow-2xl relative my-auto mt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsSOSModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-500/20 text-red-500 border border-red-500/30 p-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">긴급 세션 수배</h2>
                  <p className="text-xs text-slate-400 mt-1">반경 10km 내 관련 포지션 유저에게 푸시 발송</p>
                </div>
              </div>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!sosRegion || !sosSubRegion) {
                    toast.error("지역을 모두 선택해주세요.");
                    return;
                  }
                  try {
                    await callEmergencySessionApi(sosPosition, `${sosRegion} ${sosSubRegion}`, sosDetailAddress, sosDatetime);
                    toast.success("🚨 긴급 SOS가 발송되었습니다! 조건에 맞는 세션들에게 푸시 알림이 전송됩니다.");
                    setIsSOSModalOpen(false);
                  } catch (error) {
                    toast.error("SOS 발송 중 오류가 발생했습니다.");
                  }
                }} 
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">필요한 포지션</label>
                  <div className="relative">
                    <Music2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select value={sosPosition} onChange={e => setSosPosition(e.target.value)} className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white appearance-none focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none cursor-pointer" required>
                      <option value="" disabled>포지션을 선택하세요</option>
                      <option value="drum">드럼</option>
                      <option value="bass">베이스</option>
                      <option value="guitar">기타</option>
                      <option value="keyboard">건반 / 피아노</option>
                      <option value="vocal">보컬</option>
                      <option value="other">기타 악기</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">일시 및 장소</label>
                  <div className="relative mb-2">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" value={sosDatetime} onChange={e => setSosDatetime(e.target.value)} placeholder="예: 오늘 오후 7시 ~ 9시" className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" required />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={sosRegion}
                        onChange={(e) => {
                          setSosRegion(e.target.value);
                          setSosSubRegion("");
                        }}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-4 pr-8 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white appearance-none cursor-pointer"
                        required
                      >
                        <option value="" disabled>시/도</option>
                        {Object.keys(KOREA_REGIONS).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={sosSubRegion}
                        onChange={(e) => setSosSubRegion(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl py-3 pl-4 pr-8 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white appearance-none cursor-pointer"
                        required
                        disabled={!sosRegion}
                      >
                        <option value="" disabled>시/군/구</option>
                        {sosRegion && KOREA_REGIONS[sosRegion as keyof typeof KOREA_REGIONS]?.map((sr) => (
                          <option key={sr} value={sr}>{sr}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                    </div>
                  </div>
                  <div className="relative mt-2">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input type="text" value={sosDetailAddress} onChange={e => setSosDetailAddress(e.target.value)} placeholder="상세 주소를 입력해주세요 (선택)" className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">사례금 (페이)</label>
                  <input type="text" value={sosPay} onChange={e => setSosPay(e.target.value)} placeholder="예: 교통비 3만원 지원 / 식사 제공 등" className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">참고사항</label>
                  <textarea value={sosDesc} onChange={e => setSosDesc(e.target.value)} rows={2} placeholder="예: 드럼 기어는 다 세팅되어 있습니다. 하이햇 스틱만 가져오시면 됩니다!" className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none" />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black rounded-xl py-4 mt-4 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all"
                >
                  위 조건으로 SOS 호출
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
