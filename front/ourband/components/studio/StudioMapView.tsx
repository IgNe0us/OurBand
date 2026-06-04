"use client";
// @ts-nocheck
import { useEffect, useState } from "react";
import { Map, MapMarker, Circle, useKakaoLoader } from "react-kakao-maps-sdk";
import { Star, Navigation } from "lucide-react";

export interface MapStudio {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  isExternal?: boolean;
}

interface StudioMapViewProps {
  center: [number, number];
  studios: MapStudio[];
  onExternalClick?: (studio: MapStudio) => void;
}

export function StudioMapView({ center, studios, onExternalClick }: StudioMapViewProps) {
  const [map, setMap] = useState<any>(null);

  const defaultLat = center?.[0] ?? 37.5500;
  const defaultLng = center?.[1] ?? 126.9200;

  useEffect(() => {
    if (map && (window as any).kakao && (window as any).kakao.maps) {
      // 강제로 지도의 중심을 이동 (panto 애니메이션 버그 우회)
      map.setCenter(new (window as any).kakao.maps.LatLng(defaultLat, defaultLng));
    }
  }, [map, defaultLat, defaultLng]);

  const rawKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY as string || "";
  const sanitizedKey = rawKey.replace("NEXT_PUBLIC_KAKAO_MAP_APP_KEY=", "").trim();

  // 앱 키가 없는 경우 에러 방지용 Fallback UI
  if (!sanitizedKey) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-border bg-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-4 border border-yellow-500/50">
          <Star size={32} />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">카카오 지도 API 키가 필요합니다</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">
          좌측 하단이나 우측 상단의 플랫폼 설정 메뉴에서 <strong>NEXT_PUBLIC_KAKAO_MAP_APP_KEY</strong>를 입력해야 지도가 활성화됩니다.
        </p>
      </div>
    );
  }

  // 상위 컴포넌트에서 로딩 상태를 관리하므로 여기서는 체크 생략

  // 에러 체크도 상위 컴포넌트에서 처리

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-border relative z-0">
      <Map
        onCreate={setMap}
        center={{ lat: defaultLat, lng: defaultLng }}
        style={{ width: "100%", height: "100%" }}
        level={5}
      >
        <Circle
          center={{ lat: defaultLat, lng: defaultLng }}
          radius={10000}
          strokeWeight={1}
          strokeColor={"#6366f1"}
          strokeOpacity={0.5}
          fillColor={"#6366f1"}
          fillOpacity={0.1}
        />

        <MapMarker position={{ lat: defaultLat, lng: defaultLng }}>
          <div className="p-1 px-2 whitespace-nowrap font-bold text-sm text-slate-800 font-sans text-center">
            현재 내 위치
          </div>
        </MapMarker>

        {studios.map((studio, idx) => studio && (
          <MapMarker
            key={studio.id || `studio-idx-${idx}`}
            position={{ lat: studio.lat || 0, lng: studio.lng || 0 }}
            {...(studio.isExternal ? {
              image: {
                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                size: { width: 24, height: 35 },
              }
            } : {})}
          >
            <div className="p-2 font-sans text-slate-800 min-w-[150px]">
              <div className="font-bold text-[13px] mb-1 leading-tight flex items-center gap-1">
                {studio.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between mt-2">
                <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                  <Star size={10} className="fill-yellow-500" />
                  {studio.rating}
                </span>
                {!studio.isExternal ? (
                  <button
                    onClick={() => (window.location.href = `/studio/${studio.id}`)}
                    className="text-primary hover:underline font-bold"
                  >
                    예약하기
                  </button>
                ) : (
                  <button
                    onClick={() => onExternalClick && onExternalClick(studio)}
                    className="text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    <Navigation size={10} /> 위치 보기
                  </button>
                )}
              </div>
            </div>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
