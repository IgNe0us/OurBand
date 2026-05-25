"use client";
import { EditBandProfileModal, type BandProfileData } from "@/components/band/EditBandProfileModal";
import { VideoPostModal, type VideoPost } from "@/components/band/VideoPostModal";
import { useContext } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { WritePostModal } from "@/components/post/WritePostModal";
// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import { MessageSquare, Calendar, Menu, Edit3, X, Flag, Settings, Play, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";


const TABS = ["전체", "공지사항", "자유게시판", "합주 일정", "합주", "멤버"];

const MOCK_VIDEO_POSTS: VideoPost[] = [
  {
    id: "1",
    title: "Oasis - Don't Look Back In Anger (Cover)",
    date: "2023.11.20",
    thumbnail: "https://picsum.photos/seed/oasis1/800/450",
    description: "저번 주말 합주 때 맞춰본 오아시스 커버곡입니다.\n아직 기타 솔로 부분은 조금 더 다듬어야겠지만, 전체적인 합은 꽤 잘 맞는 것 같아요!\n다음 합주 때는 코러스 라인 집중적으로 파보겠습니다. 🔥\n\n모두 수고하셨습니다!"
  },
  {
    id: "2",
    title: "Radiohead - Creep (합주실 라이브)",
    date: "2023.10.15",
    thumbnail: "https://picsum.photos/seed/radiohead1/800/450",
    description: "톤 잡는데 시간 꽤 썼는데 결과물이 좋네요!\n드럼이랑 베이스 리듬섹션 사운드가 특히 맘에 듭니다.\n영상 한 번씩 모니터링 해주시고 피드백 있으면 댓글 남겨주세요."
  },
  {
    id: "3",
    title: "자작곡 'Neon Lights' 러프 스케치",
    date: "2023.09.05",
    thumbnail: "https://picsum.photos/seed/neon1/800/450",
    description: "보컬 멜로디라인까지 대략적으로 얹어본 자작곡 러프입니다.\n신스 라인이 약간 약한 것 같아서 다음 번에 프리셋 좀 더 찾아올게요.\n\n다들 코드 진행 한 번씩 숙지 부탁드려요!"
  }
];

export default function BandIdDynamicBoardPage() {
  const { id } = useParams();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const { openMenu } = useContext(LayoutContext);
  const [activeTab, setActiveTab] = useState("전체");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedVideoPost, setSelectedVideoPost] = useState<VideoPost | null>(null);
  
  // mock user role (현재 사용자가 방장인지 확인하는 모의 데이터)
  const isLeader = true; // 변경해서 권한 테스트 가능
  
  const [bandProfile, setBandProfile] = useState<BandProfileData>({
    name: id === "rubyspark" ? "루비스파크" : "Neon Dreams",
    genre: "신스팝 / 인디록",
    location: "서울 마포구 상수동",
    frequency: "월 4회 (매주 주말)",
    description: "안녕하세요! 저희는 홍대를 기반으로 활동하는 밴드입니다.\n주로 신스팝, 인디록 계열의 몽환적이고 에너제틱한 곡들을 커버하고 창작합니다.\n합을 맞추는 재미, 그리고 무대 위에서의 쾌감을 목표로 함께 달릴 분들을 찾습니다.🎸",
    coverImage: "https://picsum.photos/seed/band1/800/400",
    logoImage: "https://picsum.photos/seed/logo1/150/150",
    positions: [
      { id: "1", role: "보컬", memberName: "홍길동", isRecruiting: false },
      { id: "2", role: "기타", memberName: "조지스미스", isRecruiting: false },
      { id: "3", role: "베이스", memberName: "톤성애자", isRecruiting: false },
      { id: "4", role: "드럼", memberName: "김드럼", isRecruiting: false },
      { id: "5", role: "건반", memberName: "", isRecruiting: true }
    ],
    history: [
      { id: "h1", date: "2023.11", title: "하반기 클럽 FF 정기공연" },
      { id: "h2", date: "2023.08", title: "첫 번째 자작곡 'Neon Lights' 데모 완성" },
      { id: "h3", date: "2023.01", title: "밴드 결성" }
    ]
  });

  return (
    <div className="flex flex-col bg-background pb-20 overflow-x-hidden">
      {/* Cover Banner Header */}
      <div className="relative h-56 md:h-72 w-full bg-slate-900 shrink-0">
        <img src={bandProfile.coverImage} className="w-full h-full object-cover opacity-60" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-0 left-0 w-full p-6 pt-12 md:pt-8 flex justify-between items-start z-10">
          <button onClick={openMenu} className="md:hidden text-white drop-shadow-md">
            <Menu size={28} />
          </button>
          
          {isLeader && (
            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="ml-auto bg-black/50 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/10 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              프로필 관리
            </button>
          )}
        </div>

        {/* Profile Info in Cover */}
        <div className="absolute bottom-6 left-6 md:left-8 flex items-end gap-5 w-[calc(100%-3rem)] pr-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background shadow-2xl overflow-hidden bg-slate-800 shrink-0">
            <img src={bandProfile.logoImage} className="w-full h-full object-cover" alt="Logo" />
          </div>
          <div className="mb-1">
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">{bandProfile.name}</h1>
            <p className="text-sm md:text-base font-medium text-slate-300 drop-shadow-md mt-1">{bandProfile.genre}</p>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="bg-background/80 backdrop-blur-xl z-20 sticky top-0 border-b border-border pt-4 px-6 md:px-8">
        <div className="flex gap-6 relative overflow-x-auto hide-scrollbar whitespace-nowrap pb-3">
          {TABS.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-sm md:text-base font-bold relative transition-colors",
                activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-400"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="board-tab" className="absolute -bottom-3 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-[1600px] mx-auto w-full">
        {/* Members Section */}
        {activeTab === "멤버" && (
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-black text-white mb-4 text-left">가입된 멤버</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bandProfile.positions && bandProfile.positions.filter(p => !p.isRecruiting).length > 0 ? (
                  bandProfile.positions.filter(p => !p.isRecruiting).map((member, index) => (
                    <div key={member.id} className="bg-secondary/40 border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                      <div className="relative shrink-0">
                        <img src={`https://i.pravatar.cc/150?u=${member.id}`} alt={member.memberName} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                        {index === 0 && ( // First non-recruiting member as leader indicator (mock logic)
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-yellow-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-secondary shadow-sm">
                            방장
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-bold text-primary mb-1 truncate">{member.role}</div>
                        <div className="text-base font-bold text-white leading-tight truncate">{member.memberName || "이름 없음"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-sm font-bold text-slate-500 bg-secondary/20 rounded-2xl border border-dashed border-border">
                    가입된 멤버가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white mb-4 text-left flex items-center gap-2">
                모집 중인 포지션
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30 leading-none">
                  {bandProfile.positions?.filter(p => p.isRecruiting).length || 0}
                </span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {bandProfile.positions && bandProfile.positions.filter(p => p.isRecruiting).length > 0 ? (
                  bandProfile.positions.filter(p => p.isRecruiting).map((pos) => (
                    <div key={pos.id} className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="text-sm font-bold text-white">{pos.role}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm font-bold text-slate-500">
                    현재 모집 중인 포지션이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Posts Section */}
        {activeTab === "합주" && (
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-black text-white mb-4 text-left">합주 영상 및 기록</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {MOCK_VIDEO_POSTS.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => setSelectedVideoPost(post)}
                  className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-800 shrink-0">
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary transition-colors">
                        <Play size={20} className="ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 text-left flex flex-col flex-1">
                    <div className="text-xs font-bold text-primary mb-2">{post.date}</div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{post.description}</p>
                    <div className="mt-auto pt-4 flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Heart size={14} /> 12</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={14} /> 2</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notice Card */}
        {(activeTab === "전체" || activeTab === "공지사항") && (
          <div onClick={() => navigate("/post/notice1")} className="bg-secondary/40 border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors cursor-pointer group relative flex flex-col h-full text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded">필독</span>
                <span className="text-xs text-slate-500">방장 (조지스미스) • 1시간 전</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                title="신고하기"
              >
                <Flag size={14} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">이번 주말 합주곡 리스트 픽스합니다.</h3>
            <p className="text-sm text-slate-400 line-clamp-2">다들 주말 합주 준비 잘 하고 계시죠? 이번 주는 Oasis - Don't Look Back In Anger, 그리고 새로 추가할 펑크 잼 1곡 입니다!</p>
            <div className="mt-auto pt-4 flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><MessageSquare size={14} /> 5</span>
            </div>
          </div>
        )}
        
        {/* General Card */}
        {(activeTab === "전체" || activeTab === "자유게시판") && (
          <div onClick={() => navigate("/post/general1")} className="bg-secondary/40 border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors cursor-pointer group relative flex flex-col h-full text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded">잡담</span>
                <span className="text-xs text-slate-500">김드럼 • 어제</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                title="신고하기"
              >
                <Flag size={14} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">새 스네어 샀습니다 ㅎㅎ</h3>
            <p className="text-sm text-slate-400 line-clamp-2">드디어 원하던 루딕 블랙뷰티 스네어 중고로 업어왔습니다! 소리 완전 딴딴하고 좋네요. 이번 합주때 가져갈게요!!</p>
            <div className="mt-auto pt-4 flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><MessageSquare size={14} /> 12</span>
            </div>
          </div>
        )}

        {/* Schedule Card */}
        {(activeTab === "전체" || activeTab === "합주 일정") && (
          <div onClick={() => navigate("/post/schedule1")} className="bg-primary/5 border border-primary/20 rounded-2xl p-5 hover:border-primary/50 transition-colors cursor-pointer group relative flex flex-col h-full text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Calendar size={10} />일정</span>
                <span className="text-xs text-slate-500">방장 (조지스미스) • 3일 전</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setReportModalOpen(true); }}
                className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                title="신고하기"
              >
                <Flag size={14} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors pr-6">6월 3주차 정기 합주 투표</h3>
            <p className="text-sm text-slate-400 mb-4">가능한 시간 모두 투표해주세요. 장소는 저번이랑 같은 홍대 프리버드 합주실입니다.</p>
            <div className="w-full bg-secondary/80 rounded-xl p-3 border border-border shadow-inner relative z-10 mt-auto" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center bg-primary/20 p-2.5 rounded-lg mb-2 border border-primary/30">
                  <span className="text-sm font-bold text-white">토요일 오후 2시~4시</span>
                  <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded">3명 참여</span>
               </div>
               <div className="flex justify-between items-center bg-background/50 p-2.5 rounded-lg border border-border">
                  <span className="text-sm font-bold text-slate-400">일요일 오후 1시~3시</span>
                  <span className="text-xs font-bold text-slate-500 bg-secondary px-2 py-1 rounded">1명 참여</span>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Write Post FAB */}
      <button 
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-primary hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all z-30 hover:scale-105"
      >
        <Edit3 size={24} />
      </button>

      {/* Write Post Modal Instance */}
      <WritePostModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        defaultBoard={activeTab === "전체" ? "자유게시판" : activeTab}
        isLeader={isLeader}
      />

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetName="게시글"
      />

      {/* Video Post Modal */}
      <VideoPostModal
        isOpen={!!selectedVideoPost}
        onClose={() => setSelectedVideoPost(null)}
        post={selectedVideoPost}
      />

      {/* Edit Profile Modal */}
      <EditBandProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={bandProfile}
        onSave={(updatedData) => setBandProfile(updatedData)}
      />
    </div>
  );
}
