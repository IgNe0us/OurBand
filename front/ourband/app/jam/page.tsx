"use client";
import { useContext } from "react";

// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { Play, Heart, MessageCircle, Share2, Plus, Music2, Menu, Pause, X, Copy, Send, Disc, Image as ImageIcon, Video, Mic, Check, ArrowLeft, MoreVertical, Edit3, Trash2, Reply, Volume2, VolumeX, Flag, User } from "lucide-react";

import type { LayoutContextType } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";;
import { motion, AnimatePresence } from "motion/react";

import { searchJamPostsApi, createJamPostApi, toggleJamLikeApi, getJamCommentsApi, createJamCommentApi, incrementJamShareApi, type JamPostData, updateJamCommentApi, deleteJamCommentApi, getJamPostApi } from "@/api/jam/jamService";
import { ReportModal } from "@/components/common/ReportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ExpandableComment } from "@/components/common/ExpandableComment";
import { getUserInfoApi, toggleFollowApi } from "@/api/account/userService";
import { uploadToCloudflare } from "@/lib/cloudflare";
import { useUserProfile } from "@/store/userProfileContext";
import { useRouter, useSearchParams } from 'next/navigation';
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

function JamVideoItem({
  v,
  parentVideo,
  idx,
  currentUserId,
  isPlaying,
  isLiked,
  togglePlay,
  toggleLike,
  toggleFollow,
  followingMap,
  setActiveCommentId,
  comments,
  setActiveShareId,
  setActiveDuetId,
  setReportTarget,

  onVisible,
  openUserProfile
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const parentVideoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [masterVolume, setMasterVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      const time = (newProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      if (parentVideoRef.current) parentVideoRef.current.currentTime = time;
      setProgress(newProgress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      if (parentVideoRef.current) {
        parentVideoRef.current.currentTime = 0;
        parentVideoRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current?.pause();
      parentVideoRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const vFactor = masterVolume / 100;
    if (videoRef.current) {
      videoRef.current.volume = (v.myVolume !== undefined ? v.myVolume : 1) * vFactor;
    }
    if (parentVideoRef.current) {
      parentVideoRef.current.volume = (v.originalVolume !== undefined ? v.originalVolume : 1) * vFactor;
    }
  }, [v, masterVolume]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible(v.id);
        }
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.id]);

  return (
    <div ref={containerRef} className="h-screen w-full snap-start relative overflow-hidden bg-secondary flex justify-center">
      <div className="relative w-full h-full max-w-xl md:border-x md:border-border/50">
        {parentVideo ? (
          <div className="flex flex-col w-full h-full bg-black">
            <div className="flex-1 relative border-b border-white/20">
               <video 
                 ref={parentVideoRef} 
                 src={parentVideo.mediaUrl} 
                 loop 
                 playsInline 
                 className="absolute inset-0 w-full h-full object-contain opacity-90" 
               />
               <div className="absolute top-24 left-4 bg-black/60 px-2 py-1 rounded text-[10px] text-white">Original</div>
            </div>
            <div className="flex-1 relative">
               <video 
                 ref={videoRef} 
                 src={v.mediaUrl} 
                 loop 
                 playsInline 
                 onTimeUpdate={handleTimeUpdate} 
                 className="absolute inset-0 w-full h-full object-contain opacity-90" 
               />
               <div className="absolute top-24 left-4 bg-primary/40 border border-primary/50 px-2 py-1 rounded text-[10px] text-primary font-bold">Duet</div>
            </div>
          </div>
        ) : v.mediaUrl ? (
          <video 
            ref={videoRef}
            src={v.mediaUrl} 
            loop 
            muted={false} 
            playsInline 
            onTimeUpdate={handleTimeUpdate}
            className="absolute inset-0 w-full h-full md:object-contain object-cover opacity-90" 
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center">
            <Music2 size={64} className="text-slate-700" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/90 pointer-events-none" />

        {/* Fake Video Player interaction area */}
        <div 
          className="absolute inset-0 cursor-pointer z-0 flex items-center justify-center"
          onClick={() => togglePlay(v.id)}
        >
          {!isPlaying && (
            <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 shadow-2xl transition-transform scale-110">
              <Play size={40} className="ml-2" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Top Right Volume Control */}
        <div className="absolute right-4 top-24 z-50 flex items-center group pointer-events-auto">
          <div className="absolute right-12 w-28 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center px-3 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <input 
              type="range" 
              min="0" max="100" 
              value={masterVolume} 
              onChange={(e) => {
                const v = Number(e.target.value);
                setMasterVolume(v);
                if (videoRef.current) {
                  videoRef.current.muted = (v === 0);
                }
                if (parentVideoRef.current) {
                  parentVideoRef.current.muted = (v === 0);
                }
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>
          <div 
            className="w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/10 relative z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const isMuted = masterVolume === 0;
              const newVol = isMuted ? 100 : 0;
              setMasterVolume(newVol);
              if (videoRef.current) videoRef.current.muted = !isMuted;
              if (parentVideoRef.current) parentVideoRef.current.muted = !isMuted;
            }}
          >
            {masterVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </div>
        </div>

        <div className="absolute right-4 bottom-28 md:bottom-32 flex flex-col items-center gap-4 z-10 pointer-events-auto">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden shadow-lg cursor-pointer bg-slate-800"
              onClick={() => openUserProfile(Number(v.userId), v.authorName, v.authorProfileImageUrl)}
            >
              {v.authorProfileImageUrl ? (
                <img src={v.authorProfileImageUrl} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">{v.authorName?.[0] || 'U'}</div>
              )}
            </div>
            <AnimatePresence>
              {v.userId !== currentUserId && !followingMap[v.authorName] && (
                <motion.button 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => toggleFollow(v.authorName, v.userId)}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-background cursor-pointer hover:scale-110 transition-transform"
                >
                  <Plus size={14} className="text-white" />
                </motion.button>
              )}
              {/* {v.userId !== currentUserId && followingMap[v.authorName] && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 rounded-full p-0.5 border-2 border-background pointer-events-none"
                >
                  <Check size={14} className="text-white" />
                </motion.div>
              )} */}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => toggleLike(v.id)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className={cn(
              "w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all",
              isLiked ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-transparent" : "bg-background/20 border border-border group-hover:bg-white/10 text-white"
            )}>
              <Heart size={24} className={cn(isLiked && "fill-white", isLiked && "scale-110 transition-transform")} />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-md">
              {v.likeCount || 0}
            </span>
          </button>
          <button 
            onClick={() => setActiveCommentId(v.id)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
              <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-md">{v.commentCount || 0}</span>
          </button>
          <button 
            onClick={() => setActiveShareId(v.id)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
              <Share2 size={24} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-md">{v.shareCount || 0}</span>
          </button>

          {String(v.userId) !== String(currentUserId) && (
            <button 
              onClick={(e) => { e.stopPropagation(); setReportTarget({ type: 'JAM_POST', id: v.id, name: '오디오잼' }); }}
              className="mt-2 flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-rose-500/20 transition-colors">
                <Flag size={20} className="text-white/80 group-hover:text-rose-500 transition-colors" />
              </div>
            </button>
          )}

          {/* Jam Button - Core Feature */}
          {v.parentId ? (
            <div className="mt-4 flex flex-col items-center gap-1 opacity-50 grayscale select-none">
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center border-2 border-white/10">
                <Music2 size={24} className="text-slate-400" />
              </div>
              <span className="font-black text-slate-400 text-[10px] tracking-widest mt-1">DUETED</span>
            </div>
          ) : (
            <button 
              onClick={() => setActiveDuetId(v.id)}
              className="mt-4 flex flex-col items-center gap-1 group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform cursor-pointer border-2 border-white/20">
                <Music2 size={24} className="text-white fill-white" />
              </div>
              <span className="font-black text-white text-[10px] tracking-widest mt-1">DUET</span>
            </button>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-16 md:bottom-20 left-0 w-3/4 md:w-2/3 p-5 z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-3">
            {v.parentId && v.originalAuthorName ? (
              <span 
                className="bg-primary/20 backdrop-blur-md text-primary border border-primary/30 px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer hover:bg-primary/30 transition-colors"
              >
                @{v.originalAuthorName} 와 듀엣
              </span>
            ) : (
              <span className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[11px] font-bold border border-white/20">오디오 듀엣 챌린지</span>
            )}
          </div>
          <h2 className="text-white font-black text-xl md:text-2xl mb-2 leading-tight drop-shadow-lg">{v.title}</h2>
          
          {/* Audio Waveform visualization mockup */}
          <div className="w-full h-10 flex items-end gap-1 mb-2 bg-background/20 p-2 rounded-xl backdrop-blur-sm border border-border">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-indigo-500/80 to-purple-400 rounded-t-sm transition-all duration-300" 
                style={{ 
                  height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : '15%',
                  opacity: isPlaying ? 1 : 0.4
                }} 
              />
            ))}
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full z-20 group bg-black/20 h-1.5 hover:h-3 transition-all flex items-end">
          <input 
            type="range" 
            min="0" max="100" 
            step="0.1"
            value={progress || 0}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
          />
          <div className="absolute bottom-0 left-0 h-full bg-primary/30 w-full" />
          <div className="absolute bottom-0 left-0 h-full bg-primary pointer-events-none transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function JamPage() {
  const { confirm } = useConfirm();
  const { openMenu } = useContext(LayoutContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jamIdParam = searchParams.get("id");
  const { openUserProfile } = useUserProfile();

  const [activeTab, setActiveTab] = useState<"FOLLOWING" | "RECOMMENDED">("RECOMMENDED");

  const [videos, setVideos] = useState<JamPostData[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [alertModal, setAlertModal] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});

  const filteredVideos = useMemo(() => {
    if (activeTab === "FOLLOWING") {
      return videos.filter(v => followingMap[v.authorName]);
    }
    return videos;
  }, [videos, activeTab, followingMap]);
  
  useEffect(() => {
    getUserInfoApi().then(res => setCurrentUserId(res.userId)).catch(() => {});
    
    const fetchInitialData = async () => {
      try {
        let initialVideos: JamPostData[] = [];
        
        if (jamIdParam) {
           try {
             const specificVideo = await getJamPostApi(Number(jamIdParam));
             initialVideos.push(specificVideo);
           } catch (e: any) {
             if (e.response?.data?.errorCode === 'CONTENT_HIDDEN') {
               toast.error("관리자에 의해 숨겨진 게시글입니다.");
               // url 파라미터 지우기
               router.replace('/jam');
             } else {
               console.error("Failed to fetch specific jam video", e);
             }
           }
        }
        
        const res = await searchJamPostsApi();
        const otherVideos = res.content.filter((v: JamPostData) => v.id !== Number(jamIdParam));
        initialVideos = [...initialVideos, ...otherVideos];
        
        setVideos(initialVideos);
        
        const newLikedMap: Record<number, boolean> = {};
        const newFollowingMap: Record<string, boolean> = {};
        
        initialVideos.forEach((v: JamPostData) => {
          if (v.isLiked) newLikedMap[v.id] = true;
          if (v.isFollowing && v.authorName) newFollowingMap[v.authorName] = true;
        });
        
        setLikedMap(newLikedMap);
        setFollowingMap(newFollowingMap);

        if (initialVideos.length > 0) setPlayingId(initialVideos[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchInitialData();
  }, [jamIdParam]);
  
  // Modals state
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [activeShareId, setActiveShareId] = useState<number | null>(null);
  const [activeDuetId, setActiveDuetId] = useState<number | null>(null);
  
  // Create Jam Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<"SELECT" | "UPLOAD" | "HISTORY_SELECT" | "RECORD">("SELECT");
  const [userHistories, setUserHistories] = useState<any[]>([]);
  const [newJamTitle, setNewJamTitle] = useState("");
  const [newJamDesc, setNewJamDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newJamFile, setNewJamFile] = useState<File | null>(null);
  const [newJamMediaUrl, setNewJamMediaUrl] = useState("");
  
  // Create Jam Recording States
  const createLiveVideoRef = useRef<HTMLVideoElement>(null);
  const createMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const createChunksRef = useRef<Blob[]>([]);
  const [isCreateRecording, setIsCreateRecording] = useState(false);
  const [createRecordTime, setCreateRecordTime] = useState(0);
  const createRecordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup stream for Create Jam when step is RECORD
  useEffect(() => {
    if (isCreateModalOpen && createStep === "RECORD") {
      const setupStream = (stream: MediaStream) => {
        if (createLiveVideoRef.current) createLiveVideoRef.current.srcObject = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) createChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(createChunksRef.current, { type: "video/webm" });
          setNewJamFile(new File([blob], `recorded_${Date.now()}.webm`, { type: "video/webm" }));
          setCreateStep("UPLOAD");
          createChunksRef.current = [];
          setCreateRecordTime(0);
        };
        createMediaRecorderRef.current = mediaRecorder;
      };

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(setupStream)
        .catch(err => {
          console.warn("Video access failed, trying audio only:", err);
          navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(setupStream)
            .catch(() => toast.error("마이크 권한이 필요합니다."));
        });
    } else {
      if (createLiveVideoRef.current?.srcObject) {
        const stream = createLiveVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        createLiveVideoRef.current.srcObject = null;
      }
      if (createRecordTimerRef.current) clearInterval(createRecordTimerRef.current);
      setIsCreateRecording(false);
      setCreateRecordTime(0);
    }
  }, [isCreateModalOpen, createStep]);

  const startCreateRecording = () => {
    if (createMediaRecorderRef.current && createMediaRecorderRef.current.state === "inactive") {
      createChunksRef.current = [];
      createMediaRecorderRef.current.start();
      setIsCreateRecording(true);
      setCreateRecordTime(0);
      
      createRecordTimerRef.current = setInterval(() => {
        setCreateRecordTime(prev => {
          if (prev >= 179) {
            stopCreateRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopCreateRecording = () => {
    if (createMediaRecorderRef.current && createMediaRecorderRef.current.state === "recording") {
      createMediaRecorderRef.current.stop();
      setIsCreateRecording(false);
      if (createRecordTimerRef.current) clearInterval(createRecordTimerRef.current);
    }
  };

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{id: number, authorName: string} | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [reportTarget, setReportTarget] = useState<{ type: string, id: string | number, name: string } | null>(null);

  // Duet recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [isMixing, setIsMixing] = useState(false);
  const [originalVolume, setOriginalVolume] = useState(100);
  const [myVolume, setMyVolume] = useState(100);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const duetFileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Real Camera & Recording
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (activeDuetId) {
      const setupStream = (stream: MediaStream) => {
        if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          setRecordedBlob(blob);
          setRecordedVideoUrl(URL.createObjectURL(blob));
          chunksRef.current = [];
        };
        mediaRecorderRef.current = mediaRecorder;
      };

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(setupStream)
        .catch(err => {
          console.warn("Video access failed, trying audio only:", err);
          navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then(setupStream)
            .catch(audioErr => {
              console.error("Audio access also denied:", audioErr);
              toast.error("마이크 접근 권한이 없거나 장치를 찾을 수 없습니다.");
            });
        });
    } else {
      if (liveVideoRef.current?.srcObject) {
        const stream = liveVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        liveVideoRef.current.srcObject = null;
      }
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      chunksRef.current = [];
    }
  }, [activeDuetId]);

  const handleDuetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const allowedExtensions = ['jpg', 'jpeg', 'gif', 'png', 'mp4', 'mov', 'webm', 'ogv', 'webp', 'bmp', 'tif', 'tiff', 'heic', 'avi', 'mkv', 'wmv', 'asf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      setAlertModal({isOpen: true, message: `지원하지 않는 파일 형식입니다: ${file.name}`});
      if (duetFileInputRef.current) duetFileInputRef.current.value = "";
      return;
    }

    // Validate video/gif file size (40MB limit)
    const videoExtensions = ['mp4', 'mov', 'webm', 'ogv', 'avi', 'mkv', 'wmv', 'asf', 'gif'];
    if (videoExtensions.includes(fileExtension) && file.size > 40 * 1024 * 1024) {
      setAlertModal({isOpen: true, message: `동영상/움짤 파일은 40MB 이하만 가능합니다: ${file.name}`});
      if (duetFileInputRef.current) duetFileInputRef.current.value = "";
      return;
    }

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      const originalDuration = originalVideoRef.current?.duration || 0;
      if (originalDuration > 0 && tempVideo.duration > originalDuration + 1) { // allow 1 sec leeway
        toast.error("업로드하는 영상의 길이는 원본 영상의 길이를 초과할 수 없습니다!");
        if (duetFileInputRef.current) duetFileInputRef.current.value = "";
        return;
      }
      setRecordedBlob(file);
      setRecordedVideoUrl(URL.createObjectURL(file));
      setIsMixing(true);
    };
    tempVideo.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    if (originalVideoRef.current) originalVideoRef.current.volume = Math.min(1, Math.max(0, originalVolume / 100));
  }, [originalVolume]);

  useEffect(() => {
    if (myVideoRef.current) myVideoRef.current.volume = Math.min(1, Math.max(0, myVolume / 100));
  }, [myVolume]);

  useEffect(() => {
    if (isRecording) {
      if (originalVideoRef.current) {
        originalVideoRef.current.currentTime = 0;
        originalVideoRef.current.play();
      }
      chunksRef.current = [];
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
        mediaRecorderRef.current.start();
      }
    } else {
      if (originalVideoRef.current && !isPreviewPlaying) originalVideoRef.current.pause();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isRecording]);

  const handlePublishDuet = async () => {
    const parentVideo = videos.find(v => v.id === activeDuetId);
    if (!parentVideo) return;
    
    setIsUploading(true);
    try {
      let finalMediaUrl = "https://example.com/cloudflare/dummy_duet_video.mp4";
      if (recordedBlob) {
        const file = new File([recordedBlob], `duet_${Date.now()}.webm`, { type: "video/webm" });
        finalMediaUrl = await uploadToCloudflare(file);
      }
      
      await createJamPostApi({
        parentId: activeDuetId || undefined,
        mediaUrl: finalMediaUrl,
        title: `${parentVideo.title} (듀엣 커버)`,
        instrument: "보컬",
        genre: parentVideo.genre,
        originalVolume: originalVolume / 100,
        myVolume: myVolume / 100
      });
      toast.success("듀엣 영상이 성공적으로 업로드되었습니다!");
      setIsMixing(false);
      setActiveDuetId(null);
      setIsPreviewPlaying(false);
      setRecordProgress(0);
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      // Refresh list
      searchJamPostsApi().then(res => setVideos(res.content));
    } catch (err) {
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateJamSubmit = async () => {
    if (!newJamTitle.trim()) return toast.error("제목을 입력해주세요!");
    setIsUploading(true);
    try {
      let finalMediaUrl = newJamMediaUrl;
      if (newJamFile) {
        finalMediaUrl = await uploadToCloudflare(newJamFile);
      }
      if (!finalMediaUrl) throw new Error("미디어 파일이 없습니다.");

      await createJamPostApi({
        title: newJamTitle,
        description: newJamDesc,
        mediaUrl: finalMediaUrl,
        instrument: "기타",
        genre: "전체 장르",
        originalVolume: 1.0,
        myVolume: 1.0
      });
      toast.success("오디오잼 게시물이 등록되었습니다!");
      setIsCreateModalOpen(false);
      setCreateStep("SELECT");
      setNewJamFile(null);
      setNewJamTitle("");
      setNewJamDesc("");
      searchJamPostsApi().then(res => setVideos(res.content));
    } catch (err) {
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenHistorySelect = async () => {
    setCreateStep("HISTORY_SELECT");
    try {
      const userInfo = await getUserInfoApi();
      setUserHistories(userInfo.histories.filter((h: any) => h.mediaType === "VIDEO"));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePlay = (id: number) => {
    setPlayingId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    if (activeCommentId && !comments[activeCommentId]) {
      getJamCommentsApi(activeCommentId).then(res => {
        setComments(prev => ({ ...prev, [activeCommentId]: res }));
      }).catch(console.error);
    }
  }, [activeCommentId]);

  const toggleLike = async (id: number) => {
    const prevLiked = likedMap[id];
    setLikedMap(prev => ({ ...prev, [id]: !prevLiked }));
    setVideos(prev => prev.map(v => v.id === id ? { ...v, likeCount: prevLiked ? v.likeCount - 1 : v.likeCount + 1 } : v));
    try {
      const res = await toggleJamLikeApi(id);
      setLikedMap(prev => ({ ...prev, [id]: res.isLiked }));
    } catch (err) {
      setLikedMap(prev => ({ ...prev, [id]: prevLiked }));
      setVideos(prev => prev.map(v => v.id === id ? { ...v, likeCount: prevLiked ? v.likeCount + 1 : v.likeCount - 1 } : v));
      console.error(err);
    }
  };

  const toggleFollow = async (authorName: string, targetUserId: number) => {
    const prevFollowing = followingMap[authorName];
    setFollowingMap(prev => ({ ...prev, [authorName]: !prevFollowing }));
    try {
      const res = await toggleFollowApi(targetUserId);
      setFollowingMap(prev => ({ ...prev, [authorName]: res.isFollowing }));
    } catch (err) {
      setFollowingMap(prev => ({ ...prev, [authorName]: prevFollowing }));
      console.error(err);
    }
  };

  const handleAddComment = async (videoId: number) => {
    if (!commentText.trim()) return;
    try {
      const res = await createJamCommentApi(videoId, { 
        content: commentText, 
        parentId: replyingTo ? replyingTo.id : null 
      });
      // Fetch fresh comments after creating
      const updatedComments = await getJamCommentsApi(videoId);
      setComments(prev => ({ ...prev, [videoId]: updatedComments }));
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, commentCount: v.commentCount + 1 } : v));
      setCommentText("");
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
      toast.error("댓글 작성에 실패했습니다.");
    }
  };

  const handleEditComment = async (videoId: number, commentId: number) => {
    if (!editText.trim()) return;
    try {
      await updateJamCommentApi(videoId, commentId, { content: editText.trim() });
      const updatedComments = await getJamCommentsApi(videoId);
      setComments(prev => ({ ...prev, [videoId]: updatedComments }));
      setEditingComment(null);
      setEditText("");
    } catch (err) {
      console.error(err);
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (videoId: number, commentId: number) => {
    if (!await confirm({ message: "댓글을 삭제하시겠습니까?", isDestructive: true })) return;
    try {
      await deleteJamCommentApi(videoId, commentId);
      const updatedComments = await getJamCommentsApi(videoId);
      setComments(prev => ({ ...prev, [videoId]: updatedComments }));
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, commentCount: Math.max(0, v.commentCount - 1) } : v));
    } catch (err) {
      console.error(err);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  const handleCopyLink = async () => {
    if (activeShareId) {
      try {
        await navigator.clipboard.writeText(window.location.origin + `/jam?id=${activeShareId}`);
        await incrementJamShareApi(activeShareId);
        setVideos(prev => prev.map(v => v.id === activeShareId ? { ...v, shareCount: v.shareCount + 1 } : v));
        toast.success("링크가 클립보드에 복사되었습니다.");
        setActiveShareId(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-background snap-y snap-mandatory overflow-y-scroll hide-scrollbar pb-16 relative">
      {/* Top Bar overlay */}
      <div className="absolute top-0 w-full z-20 flex pt-12 text-center pb-4 md:pt-14 px-6 md:px-8 bg-gradient-to-b from-background/80 to-transparent pointer-events-none items-center justify-between">
        <button onClick={openMenu} className="md:hidden text-white drop-shadow-md pointer-events-auto">
          <Menu size={28} />
        </button>
        <div className="flex gap-4 absolute left-1/2 -translate-x-1/2 pointer-events-auto transition-colors">
          <span 
            onClick={() => setActiveTab("FOLLOWING")}
            className={cn("font-semibold text-lg drop-shadow-md cursor-pointer transition-all", activeTab === "FOLLOWING" ? "text-white font-bold border-b-2 border-white pb-1" : "text-white/60 hover:text-white")}
          >
            팔로잉
          </span>
          <span 
            onClick={() => setActiveTab("RECOMMENDED")}
            className={cn("font-semibold text-lg drop-shadow-md cursor-pointer transition-all", activeTab === "RECOMMENDED" ? "text-white font-bold border-b-2 border-white pb-1" : "text-white/60 hover:text-white")}
          >
            추천 잼
          </span>
        </div>
        <div className="flex items-center justify-end pointer-events-auto">
          <button 
            onClick={() => {
              setCreateStep("SELECT");
              setIsCreateModalOpen(true);
            }} 
            className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-primary transition-colors shadow-lg"
            title="새 잼 만들기"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {(activeTab === "FOLLOWING" ? videos.filter(v => followingMap[v.authorName]) : videos).length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-white/50">
          <Music2 size={64} className="mb-4 opacity-50" />
          <p>{activeTab === "FOLLOWING" ? "팔로우한 사용자의 잼이 없습니다." : "등록된 잼이 없습니다."}</p>
        </div>
      )}

      {(activeTab === "FOLLOWING" ? videos.filter(v => followingMap[v.authorName]) : videos).map((v, idx) => (
        <JamVideoItem
          key={`jam-video-${v.id}-${idx}`}
          v={v}
          parentVideo={v.parentId ? videos.find(vid => vid.id === v.parentId) : undefined}
          idx={idx}
          currentUserId={currentUserId}
          isPlaying={playingId === v.id && !activeDuetId && !activeCommentId && !activeShareId && !isCreateModalOpen}
          isLiked={likedMap[v.id]}
          togglePlay={togglePlay}
          toggleLike={toggleLike}
          toggleFollow={toggleFollow}
          followingMap={followingMap}
          setActiveCommentId={setActiveCommentId}
          comments={comments}
          setActiveShareId={setActiveShareId}
          setActiveDuetId={setActiveDuetId}
          setReportTarget={setReportTarget}
          onVisible={setPlayingId}
          openUserProfile={openUserProfile}
        />
      ))}

      {/* Modals */}
      <AnimatePresence>
        {/* Comments Modal (Bottom Sheet style) */}
        {activeCommentId && (
          <div className="fixed inset-0 z-50 flex justify-center pointer-events-none md:pl-64 lg:pl-72">
            <motion.div key="comment-modal-container" 
              className="relative w-full max-w-xl h-full flex items-end bg-black/60 backdrop-blur-sm pointer-events-auto overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveCommentId(null)}
            >
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()} 
                className="bg-secondary w-full h-[70%] rounded-t-3xl border-t border-border flex flex-col shadow-2xl relative mx-auto"
              >
                <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                  <h3 className="text-lg font-black text-white">댓글 <span className="text-primary text-sm ml-1">{videos.find(v => v.id === activeCommentId)?.commentCount || 0}</span></h3>
                  <button onClick={() => { setActiveCommentId(null); setReplyingTo(null); setEditingComment(null); setCommentText(''); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 pb-8 hide-scrollbar">
                  {(() => {
                    const flattenComments = (commentsList: any[], depth = 0): any[] => {
                      return commentsList.reduce((acc, c) => {
                        acc.push({ ...c, depth });
                        if (c.replies && c.replies.length > 0) {
                          acc.push(...flattenComments(c.replies, depth + 1));
                        }
                        return acc;
                      }, []);
                    };

                    const renderComment = (c: any) => {
                      const effectiveDepth = c.depth === 0 ? 0 : ((c.depth - 1) % 4) + 1;
                      const isRoot = c.depth === 0;
                      const isReply = effectiveDepth > 0;
                      
                      return (
                        <div 
                          key={`comment-${c.id}`} 
                          style={{ marginLeft: isReply ? `${effectiveDepth * 2.5}rem` : '0' }}
                          className={cn("flex gap-3 group relative", isRoot ? "mt-5" : "mt-3", isReply ? "before:absolute before:-left-5 before:top-4 before:w-4 before:h-px before:bg-border before:content-['']" : "")}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border flex items-center justify-center overflow-hidden mt-0.5">
                            {c.authorProfileImageUrl ? (
                              <img src={c.authorProfileImageUrl} alt={c.authorName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-slate-500" />
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-300">{c.authorName}</span>
                              <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()} {c.updatedAt && c.createdAt && c.updatedAt !== c.createdAt && "(수정됨)"}</span>
                            </div>
                            <div className="group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => {setReplyingTo({ id: c.id, authorName: c.authorName }); setEditingComment(null); setCommentText('');}} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="답글">
                                  <Reply size={13} />
                                </button>
                              {c.authorId === currentUserId && (
                                <>
                                  <button onClick={() => {setEditingComment(c.id); setEditText(c.content); setReplyingTo(null);}} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="수정">
                                    <Edit3 size={13} />
                                  </button>
                                  {(!c.replies || c.replies.length === 0) && (
                                    <button onClick={() => handleDeleteComment(activeCommentId, c.id)} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="삭제">
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </>
                              )}
                              {c.authorId !== currentUserId && (
                                <button onClick={() => setReportTarget({ type: 'JAM_COMMENT', id: c.id, name: '댓글' })} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="신고">
                                  <Flag size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                          {editingComment === c.id ? (
                              <div className="mt-2 flex gap-2 items-start">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="flex-1 bg-secondary/60 border border-border rounded-lg p-2 text-sm text-white resize-none outline-none focus:border-primary transition-colors"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => handleEditComment(activeCommentId, c.id)} className="text-primary hover:text-indigo-400 p-1" title="저장">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => setEditingComment(null)} className="text-slate-400 hover:text-white p-1" title="취소">
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                          ) : (
                              <ExpandableComment content={c.content} className="text-sm text-white" lines={4} />
                          )}
                        </div>
                      </div>
                      );
                    };
                    return flattenComments(comments[activeCommentId] || []).map(c => renderComment(c));
                  })()}
                </div>
                <div className="p-4 bg-background border-t border-border shrink-0">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 mb-2">
                      <span><span className="font-bold text-primary">@{replyingTo.authorName}</span> 님에게 답글 남기는 중...</span>
                      <button onClick={() => setReplyingTo(null)} className="hover:text-white"><X size={14}/></button>
                    </div>
                  )}
                  <div className="flex items-center bg-secondary rounded-full px-4 py-2 border border-border w-full">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyingTo ? "답글 남기기..." : "댓글 남기기..."} 
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none py-1"
                    />
                    <button onClick={() => handleAddComment(activeCommentId)} disabled={!commentText.trim()} className={cn("p-1 transition-colors", commentText.trim() ? "text-primary" : "text-slate-500")} >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Share Modal */}
        {activeShareId && (
          <div className="fixed inset-0 z-50 flex justify-center pointer-events-none md:pl-64 lg:pl-72">
            <motion.div key="share-modal-container" 
              className="relative w-full max-w-xl h-full flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto p-4"
            onClick={() => setActiveShareId(null)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button onClick={() => setActiveShareId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-xl font-black text-white mb-6 text-center">어디로 공유할까요?</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: MessageCircle, color: "bg-yellow-400", name: "카카오" },
                  { icon: Share2, color: "bg-blue-500", name: "트위터" },
                  { icon: Plus, color: "bg-purple-500", name: "더보기" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                      <item.icon size={24} className="text-white" />
                    </div>
                    <span className="text-xs text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-background border border-border hover:border-primary text-white font-bold py-3 text-sm rounded-xl transition-colors"
              >
                <Copy size={16} /> 링크 복사하기
              </button>
            </motion.div>
          </motion.div>
        </div>
        )}

        {/* DUET Recording Modal */}
        {activeDuetId && (
          <motion.div key="duet-modal" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex flex-col bg-black overflow-hidden"
          >
            {/* Header */}
            <div className="absolute top-0 w-full z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={() => !isRecording && setActiveDuetId(null)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                <X size={20} />
              </button>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30 flex items-center gap-2">
                <Disc size={14} className={cn(isRecording && "animate-spin")} />
                {isRecording ? "녹음 중..." : "듀엣 준비"}
              </div>
            </div>

            {/* Content (Split Screen Simulation) */}
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Original Video */}
              <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/20 bg-slate-900 overflow-hidden">
                {videos.find(v => v.id === activeDuetId)?.mediaUrl ? (
                  <video 
                    ref={originalVideoRef}
                    src={videos.find(v => v.id === activeDuetId)?.mediaUrl} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    playsInline 
                    loop={false}
                    onTimeUpdate={(e) => {
                      if (isRecording) {
                        const video = e.currentTarget;
                        setRecordProgress((video.currentTime / video.duration) * 100 || 0);
                      }
                    }}
                    onEnded={() => {
                      if (isRecording) {
                        setIsRecording(false);
                        setIsMixing(true);
                        setRecordProgress(0);
                        if (isPreviewPlaying) setIsPreviewPlaying(false);
                      } else if (isPreviewPlaying) {
                        setIsPreviewPlaying(false);
                      }
                    }}
                  />
                ) : (
                  <img src={`https://picsum.photos/seed/${activeDuetId}/400/800`} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Original" referrerPolicy="no-referrer" />
                )}
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-white text-xs font-bold px-2 py-1 bg-white/20 rounded-md">Original</span>
                  <p className="text-white/80 text-sm mt-1 truncate">{videos.find(v => v.id === activeDuetId)?.authorName}</p>
                </div>
              </div>
              
              {/* My Camera/Recording */}
              <div className="flex-1 relative bg-slate-800">
                {isMixing ? (
                  recordedVideoUrl ? (
                    <video 
                      ref={myVideoRef}
                      src={recordedVideoUrl} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">영상을 처리하는 중입니다...</span>
                    </div>
                  )
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center text-slate-500">
                         <Video size={32} />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">카메라를 비추고 악기를 준비하세요</p>
                    </div>
                    <video 
                      ref={liveVideoRef}
                      className="absolute inset-0 w-full h-full object-cover" 
                      playsInline
                      autoPlay
                      muted
                    />
                  </>
                )}
                
                {/* Recording Progress Line */}
                {isRecording && (
                  <div className="absolute top-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear" style={{ width: `${recordProgress}%` }} />
                )}

                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-primary text-xs font-bold px-2 py-1 bg-primary/20 rounded-md border border-primary/30">My Jam</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            {isMixing ? (
              <div className="h-auto bg-black pb-8 pt-4 px-6 flex flex-col shrink-0 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-center flex-1 ml-10">볼륨 믹싱 (미리보기)</h3>
                  <button 
                    onClick={() => {
                      if (isPreviewPlaying) {
                        setIsPreviewPlaying(false);
                        originalVideoRef.current?.pause();
                        myVideoRef.current?.pause();
                      } else {
                        setIsPreviewPlaying(true);
                        if (originalVideoRef.current) {
                           if (originalVideoRef.current.currentTime >= originalVideoRef.current.duration) {
                             originalVideoRef.current.currentTime = 0;
                           }
                           originalVideoRef.current.play();
                        }
                        if (myVideoRef.current) {
                           if (myVideoRef.current.currentTime >= myVideoRef.current.duration) {
                             myVideoRef.current.currentTime = 0;
                           }
                           myVideoRef.current.play();
                        }
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    {isPreviewPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>원본 오디오</span>
                      <span>{originalVolume}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={originalVolume} onChange={(e) => setOriginalVolume(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>내 오디오</span>
                      <span>{myVolume}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={myVolume} onChange={(e) => setMyVolume(Number(e.target.value))} className="w-full accent-red-500" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsMixing(false);
                      setIsPreviewPlaying(false);
                      setRecordProgress(0);
                      setRecordedVideoUrl(null);
                      setRecordedBlob(null);
                      if (originalVideoRef.current) {
                        originalVideoRef.current.pause();
                        originalVideoRef.current.currentTime = 0;
                      }
                    }}
                    className="flex-1 py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all"
                  >
                    재녹음
                  </button>
                  <button 
                    onClick={handlePublishDuet}
                    disabled={isUploading}
                    className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all disabled:opacity-50"
                  >
                    {isUploading ? "업로드 중..." : "발행하기"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-40 bg-black pb-8 pt-4 flex flex-col items-center justify-center shrink-0">
                <div className="flex items-center gap-8">
                  {/* Upload Button */}
                  <button 
                    onClick={() => duetFileInputRef.current?.click()}
                    className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
                    title="영상 업로드"
                  >
                    <ImageIcon size={20} className="text-white" />
                  </button>
                  <input 
                    type="file" 
                    ref={duetFileInputRef} 
                    accept=".jpg,.jpeg,.gif,.png,.mp4,.mov,.webm,.ogv,.webp,.bmp,.tif,.tiff,.heic,.avi,.mkv,.wmv,.asf" 
                    className="hidden" 
                    onChange={handleDuetFileUpload} 
                  />

                  {/* Record Button */}
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className="relative group"
                  >
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300", isRecording ? "border-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "border-white hover:scale-105")}>
                      <div className={cn("bg-red-500 rounded-full transition-all duration-300", isRecording ? "w-6 h-6 rounded-md" : "w-12 h-12")} />
                    </div>
                  </button>
                  
                  {/* Spacer for centering */}
                  <div className="w-12 h-12" />
                </div>
                <p className="text-white/60 text-xs mt-3 font-medium text-center">
                  {isRecording ? "터치해서 중지" : "빨간 버튼을 눌러 잼 시작\n또는 좌측 버튼으로 영상 업로드"}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Create Jam Hybrid Modal */}
        {isCreateModalOpen && (
          <motion.div key="create-jam-modal" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-lg rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={20} /></button>
              
              <h2 className="text-xl font-black text-white mb-6">새 오디오잼 만들기</h2>

              {createStep === "SELECT" && (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setCreateStep("UPLOAD")}
                    className="flex items-center gap-4 p-6 rounded-2xl bg-background border border-border hover:border-primary group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all text-primary group-hover:text-white">
                      <Video size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-lg mb-1">잼 영상 업로드</h3>
                      <p className="text-slate-400 text-sm">기기에 있는 동영상 파일을 선택해 업로드합니다.</p>
                    </div>
                  </button>
                  <button 
                    onClick={handleOpenHistorySelect}
                    className="flex items-center gap-4 p-6 rounded-2xl bg-background border border-border hover:border-indigo-400 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:scale-110 transition-all text-indigo-400 group-hover:text-white">
                      <ImageIcon size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-lg mb-1">내 포트폴리오에서 불러오기</h3>
                      <p className="text-slate-400 text-sm">프로필에 등록해둔 히스토리 영상으로 발행합니다.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setCreateStep("RECORD")}
                    className="flex items-center gap-4 p-6 rounded-2xl bg-background border border-border hover:border-red-400 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500 group-hover:scale-110 transition-all text-red-400 group-hover:text-white">
                      <Mic size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-lg mb-1">직접 녹화하기</h3>
                      <p className="text-slate-400 text-sm">카메라와 마이크를 사용해 지금 바로 녹화합니다. (최대 3분)</p>
                    </div>
                  </button>
                </div>
              )}

              {createStep === "RECORD" && (
                <div className="flex flex-col gap-4">
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center">
                    <video 
                      ref={createLiveVideoRef}
                      className="absolute inset-0 w-full h-full object-cover" 
                      playsInline
                      autoPlay
                      muted
                    />
                    {isCreateRecording && (
                      <div className="absolute top-4 right-4 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        녹화 중... {Math.floor(createRecordTime / 60)}:{(createRecordTime % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {!isCreateRecording ? (
                      <button 
                        onClick={startCreateRecording}
                        className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-white hover:scale-105 transition-transform"
                      >
                        <div className="bg-red-500 w-12 h-12 rounded-full" />
                      </button>
                    ) : (
                      <button 
                        onClick={stopCreateRecording}
                        className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform"
                      >
                        <div className="bg-red-500 w-6 h-6 rounded-md" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {createStep === "UPLOAD" && (
                <div className="flex flex-col gap-4">
                  <input type="text" placeholder="제목을 입력하세요 (예: 블루스 잼 참여하실 분!)" value={newJamTitle} onChange={e => setNewJamTitle(e.target.value)} className="bg-background border border-border rounded-xl p-4 text-white placeholder-slate-500 focus:border-primary outline-none" />
                  <textarea placeholder="설명 (옵션)" value={newJamDesc} onChange={e => setNewJamDesc(e.target.value)} className="bg-background border border-border rounded-xl p-4 text-white placeholder-slate-500 focus:border-primary outline-none resize-none h-24" />
                  
                  {newJamFile || newJamMediaUrl ? (
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border flex items-center justify-center">
                      <video 
                        src={newJamFile ? URL.createObjectURL(newJamFile) : newJamMediaUrl} 
                        className="w-full h-full object-contain" 
                        controls 
                      />
                      <button 
                        onClick={() => {
                          setNewJamFile(null);
                          setNewJamMediaUrl("");
                        }}
                        className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                        title="파일 삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.gif,.png,.mp4,.mov,.webm,.ogv,.webp,.bmp,.tif,.tiff,.heic,.avi,.mkv,.wmv,.asf" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const allowedExtensions = ['jpg', 'jpeg', 'gif', 'png', 'mp4', 'mov', 'webm', 'ogv', 'webp', 'bmp', 'tif', 'tiff', 'heic', 'avi', 'mkv', 'wmv', 'asf'];
                          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                          if (!allowedExtensions.includes(fileExtension)) {
                            setAlertModal({isOpen: true, message: `지원하지 않는 파일 형식입니다: ${file.name}`});
                            e.target.value = '';
                            return;
                          }
                          const videoExtensions = ['mp4', 'mov', 'webm', 'ogv', 'avi', 'mkv', 'wmv', 'asf', 'gif'];
                          if (videoExtensions.includes(fileExtension) && file.size > 40 * 1024 * 1024) {
                            setAlertModal({isOpen: true, message: `동영상/움짤 파일은 40MB 이하만 가능합니다: ${file.name}`});
                            e.target.value = '';
                            return;
                          }
                          setNewJamFile(file);
                        }} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        id="jam-file-upload"
                      />
                      <label htmlFor="jam-file-upload" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 hover:bg-slate-800 hover:border-primary transition-all cursor-pointer">
                        <Video size={40} className="text-slate-400 mb-2" />
                        <span className="text-slate-300 font-medium">여기를 눌러 영상을 선택하세요</span>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setCreateStep("SELECT")} className="flex-1 py-3 rounded-xl border border-border text-white hover:bg-white/5">이전</button>
                    <button onClick={handleCreateJamSubmit} disabled={isUploading || (!newJamFile && !newJamMediaUrl)} className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50">
                      {isUploading ? "업로드 중..." : "오디오잼 등록하기"}
                    </button>
                  </div>
                </div>
              )}

              {createStep === "HISTORY_SELECT" && (
                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {userHistories.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">포트폴리오에 비디오 영상이 없습니다.</div>
                  ) : (
                    userHistories.map(h => (
                      <div key={h.id} className="flex gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary cursor-pointer transition-colors" onClick={() => {
                        setNewJamMediaUrl(h.mediaUrl);
                        setNewJamTitle(h.title);
                        setNewJamDesc(h.content);
                        setCreateStep("UPLOAD");
                      }}>
                        <div className="w-20 h-20 bg-slate-800 rounded-lg shrink-0 overflow-hidden relative">
                          <video src={h.mediaUrl} className="w-full h-full object-cover opacity-50" />
                          <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={24} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-white font-bold truncate mb-1">{h.title}</h4>
                          <p className="text-slate-400 text-xs truncate">{h.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <button onClick={() => setCreateStep("SELECT")} className="w-full mt-4 py-3 rounded-xl border border-border text-white hover:bg-white/5">이전으로</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
        {/* Report Modal */}
        {reportTarget && (
          <ReportModal 
            isOpen={true} 
            onClose={() => setReportTarget(null)} 
            targetName={reportTarget.name}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
          />
        )}

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
    </div>
  );
}
