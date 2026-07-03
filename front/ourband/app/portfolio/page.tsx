import React from 'react';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 pt-20">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest uppercase">
            Portfolio
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
                개인용 클라우드 음악 스트리밍 앱 (개인 프로젝트) 포트폴리오 영상입니다.
            </p>
        </div>
        
        <div className="w-full flex justify-center">
          <video 
            className="w-full max-h-[80vh] rounded-2xl shadow-2xl ring-1 ring-white/10 object-contain bg-black"
            controls
            autoPlay
            playsInline
            preload="auto"
          >
            {/* Cloudflare R2 비디오 URL 적용 완료 */}
            <source src="https://pub-7182cb8a63b442d99599c60ce1f02ba7.r2.dev/profiles/KakaoTalk_20260703_135231653.mp4" type="video/mp4" />
            브라우저가 동영상 재생을 지원하지 않습니다.
          </video>
        </div>
      </div>
    </div>
  );
}
