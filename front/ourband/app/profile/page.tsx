"use client";
import { useContext, useEffect } from "react";
import { AudioJamModal } from "@/components/jam/AudioJamModal";
import { LayoutContext } from "@/components/layout/AppLayout";
import { useUserProfile } from "@/store/userProfileContext";

import React, { useState } from "react";
import { Settings, Share, Music2, Edit3, Play, MapPin, CalendarDays, Zap, AtSign, Menu, X, LogOut, Bell, Shield, Users, Plus, Trash2, Check, UserMinus, GuitarIcon, Guitar, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { KOREA_REGIONS } from "@/lib/regions";
import Link from 'next/link';
import type { LayoutContextType } from "@/components/layout/AppLayout";
import { AnimatePresence, motion } from "motion/react";
import { addFavoriteMusicApi, addGearApi, addHistoryApi, deleteFavoriteMusicApi, deleteGearApi, deleteHistoryApi, getUserInfoApi, logoutApi, updateProfileApi, updateProfileImageApi, getFollowersApi, getFollowingsApi, toggleFollowApi, type FollowUser } from "@/api/account/userService";
import { uploadToCloudflare } from "@/lib/cloudflare";
import { getUserJamPostsApi, createJamPostApi, deleteJamPostApi, type JamPostData } from "@/api/jam/jamService";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Band {
  bandId: number;
  bandName: string;
  role: string;
  logoImageUrl: string;
  createdAt: string;
}

interface History {
  id: number;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

interface ProfileData {
  userId: number;
  nickname: string;
  level: number;
  potential: number;
  instrument: string;
  location: string;
  bio: string;
  profilePictureUrl: string;
  coverImageUrl: string;
  followerCount: number;
  followingCount: number;
  bandCount: number;
  bands: Band[];
  favoriteMusics: { id: number, title: string }[];
  histories: History[];
  gears: { id:number, gearName: string }[];
}

export default function ProfilePage() {
  const { confirm } = useConfirm();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [instrument, setInstrument] = useState("");
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"좋아하는 곡" | "히스토리" | "내 오디오잼" | "내 장비">("좋아하는 곡");
  const [myJams, setMyJams] = useState<JamPostData[]>([]);
  const { openMenu } = useContext(LayoutContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFollowModal, setActiveFollowModal] = useState<"follower" | "following" | null>(null);
  const { openUserProfile } = useUserProfile();

  const historyFileInputRef = React.useRef<HTMLInputElement>(null);
  const [historyFile, setHistoryFile] = useState<File | null>(null);         // 실제 업로드할 파일 보관
  const [historyPreviewUrl, setHistoryPreviewUrl] = useState<string>("");    // 화면에 보여줄 로컬 미리보기 주소
  const [historyMediaType, setHistoryMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isUploading, setIsUploading] = useState(false);
  
  // 💡 팔로워/팔로잉 실제 DB 데이터 state
  const [followerList, setFollowerList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  const [historyList, setHistoryList] = useState([
    { id: 1, title: "홍대 첫 라이브", desc: "떨렸지만 좋았습니다.", type: "video" },
    { id: 2, title: "새로운 합주실", desc: "사운드 체크", type: "post" }
  ]);

  const [isAddingMusic, setIsAddingMusic] = useState(false);
  const [newMusic, setNewMusic] = useState("");

  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryTitle, setNewHistoryTitle] = useState("");
  const [newHistoryDesc, setNewHistoryDesc] = useState("");

  const [isAddingGear, setIsAddingGear] = useState(false);
  const [newGear, setNewGear] = useState("");
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;

  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  // 1. 파일 선택 (미리보기만 생성)
  const handleHistoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 기존 미리보기 URL이 있다면 메모리 해제
    if (historyPreviewUrl) URL.revokeObjectURL(historyPreviewUrl);

    setHistoryFile(file); // 파일 객체 임시 저장
    setHistoryPreviewUrl(URL.createObjectURL(file)); // 브라우저용 로컬 미리보기 주소 생성
    setHistoryMediaType(file.type.includes('video') ? "VIDEO" : "IMAGE");
  };

  // 2. 최종 저장 (이때 Cloudflare 업로드 + DB 저장 진행)
  const handleAddHistory = async () => {
    if (!newHistoryTitle.trim()) return toast.error("제목을 입력해주세요!");

    setIsUploading(true); // 여기서 업로드 시작 상태로 변경
    try {
      let finalMediaUrl = "";

      // 💡 1. 파일이 첨부되어 있다면, 이때 Cloudflare로 진짜 업로드!
      if (historyFile) {
        finalMediaUrl = await uploadToCloudflare(historyFile);
      }

      // 💡 2. 발급받은 URL과 텍스트를 백엔드 DB로 전송
      const newHistory = await addHistoryApi({
        title: newHistoryTitle.trim(),
        content: newHistoryDesc.trim(),
        mediaUrl: finalMediaUrl,
        mediaType: historyMediaType
      });

      // 💡 3. 화면 업데이트
      setProfileData(prev => prev ? {
        ...prev,
        histories: [newHistory, ...prev.histories]
      } : null);

      // 💡 4. 모달 닫기 및 초기화
      closeHistoryModal();
    } catch (error) {
      console.error("히스토리 등록 실패:", error);
      toast.error("히스토리 등록에 실패했습니다.");
    } finally {
      setIsUploading(false); // 로딩 끝
    }
  };

  const closeHistoryModal = () => {
    setIsAddingHistory(false);
    setNewHistoryTitle("");
    setNewHistoryDesc("");
    setHistoryFile(null);
    if (historyPreviewUrl) URL.revokeObjectURL(historyPreviewUrl); // 메모리 누수 방지
    setHistoryPreviewUrl("");
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!await confirm({ message: "정말 이 히스토리를 삭제하시겠습니까?\n첨부된 파일도 R2 저장소에서 전면 삭제됩니다.", isDestructive: true })) return;

    try {
      // 1. 서버 삭제 API 요청 실행 (R2 스토리지 파일 및 DB 데이터 증발)
      await deleteHistoryApi(historyId);

      // 2. 삭제 성공 시 UI에서 해당 카드만 부드럽게 필터링 제거
      setProfileData(prev => prev ? {
        ...prev,
        histories: prev.histories.filter(h => h.id !== historyId)
      } : null);

      toast.success("히스토리가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("히스토리 삭제 중 오류 발생:", error);
      toast.error("삭제 처리에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "PROFILE" | "COVER") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Cloudflare 업로드
      const imageUrl = await uploadToCloudflare(file);
      
      // 2. 서버 DB에 URL 반영 (즉시 반영!)
      await updateProfileImageApi(imageUrl, type);
      
      // 3. UI 즉시 업데이트
      setProfileData(prev => prev ? {
          ...prev, 
          profilePictureUrl: type === "PROFILE" ? imageUrl : prev.profilePictureUrl,
          coverImageUrl: type === "COVER" ? imageUrl : prev.coverImageUrl
      } : null);
      
      toast.success("사진이 변경되었습니다.");
    } catch (err) {
      toast.error("업로드 실패");
    }
  };

  const handleAddMusic = async () => {
    const trimmedMusic = newMusic.trim(); // 💡 미리 변수에 저장
    if (!trimmedMusic) return;

    try {
      const newSong = await addFavoriteMusicApi(trimmedMusic); // 서버에서 id 받아옴

      const newSongEntry = {
        id: newSong.id,         // 서버에서 생성된 ID
        title: trimmedMusic     // 우리가 입력한 제목
      };

      setProfileData(prev => prev ? {
        ...prev,
        favoriteMusics: [...prev.favoriteMusics, newSongEntry]
      } : null);

      setNewMusic("");
      setIsAddingMusic(false);
    } catch (err) {
      console.error("곡 등록 실패:", err);
      toast.error("곡 등록에 실패했습니다.");
    }
  };

  const handleDeleteMusic = async (musicId: number) => {
    // 실제 삭제 요청 전 사용자 확인 (선택 사항)
    if (!await confirm({ message: "정말 이 곡을 삭제하시겠습니까?", isDestructive: true })) return;

    try {
      // 1. 서버 API 호출
      await deleteFavoriteMusicApi(musicId);

      // 2. 서버 성공 시, 화면(state)에서 해당 곡을 즉시 제거
      setProfileData(prev => prev ? {
        ...prev,
        favoriteMusics: prev.favoriteMusics.filter(song => song.id !== musicId)
      } : null);
      
    } catch (err) {
      console.error("삭제 실패:", err);
      toast.error("삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleAddGear = async () => {
    const trimmedGear = newGear.trim(); // 💡 미리 변수에 저장
    if (!trimmedGear) return;

    try {
      const newGear = await addGearApi(trimmedGear); // 서버에서 id 받아옴

      const newGearEntry = {
        id: newGear.id,         // 서버에서 생성된 ID
        gearName: trimmedGear     // 우리가 입력한 제목
      };

      setProfileData(prev => prev ? {
        ...prev,
        gears: [...prev.gears, newGearEntry]
      } : null);

      setNewGear("");
      setIsAddingGear(false);
    } catch (err) {
      console.error("장비 등록 실패:", err);
      toast.error("장비 등록에 실패했습니다.");
    }
  };

  const handleDeleteGear = async (gearId: number) => {
    // 실제 삭제 요청 전 사용자 확인 (선택 사항)
    if (!await confirm({ message: "정말 이 장비를 삭제하시겠습니까?", isDestructive: true })) return;

    try {
      // 1. 서버 API 호출
      await deleteGearApi(gearId);

      // 2. 서버 성공 시, 화면(state)에서 해당 곡을 즉시 제거
      setProfileData(prev => prev ? {
        ...prev,
        gears: prev.gears.filter(gear => gear.id !== gearId)
      } : null);
      
    } catch (err) {
      console.error("삭제 실패:", err);
      toast.error("삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleSave = async () => {
    await updateProfileApi(
        bio,
        instrument,
        `${region} ${subRegion}`.trim()
    );

    setIsEditing(false);
    window.location.reload();
  };

  const handleLogout = async() => {
    toast.success("안전하게 로그아웃 되었습니다.");
    await logoutApi();
    setIsSettingsOpen(false);
    navigate("/login");
  };

  // 💡 팔로워/팔로잉 모달 열릴 때 실제 DB에서 데이터 가져오기
  const handleOpenFollowModal = async (type: "follower" | "following") => {
    setActiveFollowModal(type);
    setFollowLoading(true);
    try {
      if (type === "follower") {
        const data = await getFollowersApi();
        setFollowerList(data);
      } else {
        const data = await getFollowingsApi();
        setFollowingList(data);
      }
    } catch (error) {
      console.error(`${type} 목록 로드 실패:`, error);
    } finally {
      setFollowLoading(false);
    }
  };

  // 💡 팔로우/언팔로우 토글 핸들러
  const handleToggleFollow = async (targetUserId: number) => {
    try {
      const result = await toggleFollowApi(targetUserId);
      
      // 현재 열려있는 목록의 isFollowing 상태를 즉시 갱신
      const updateList = (list: FollowUser[]) =>
        list.map(user =>
          user.userId === targetUserId
            ? { ...user, isFollowing: result.isFollowing, following: result.isFollowing }
            : user
        );
      setFollowerList(prev => updateList(prev));
      setFollowingList(prev => updateList(prev));

      // 프로필의 팔로워/팔로잉 카운트도 즉시 반영
      setProfileData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          followingCount: result.isFollowing
            ? prev.followingCount + 1
            : prev.followingCount - 1
        };
      });
    } catch (error) {
      console.error("팔로우 토글 실패:", error);
      toast.error("팔로우 처리에 실패했습니다.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserInfoApi()
          .then(data => {
            setProfileData(data);
            setBio(data.bio || "");
            setInstrument(data.instrument || "");
            if (data.location) {
              const parts = data.location.split(" ");
              setRegion(parts[0] || "");
              setSubRegion(parts.slice(1).join(" ") || "");
            }
            setLoading(false);
          })
          .catch(err => {
            console.error("Failed to load profile", err);
            setLoading(false);
          });
      } catch (error) {
        console.error("프로필 로드 실패:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "내 오디오잼" && profileData) {
      getUserJamPostsApi(profileData.userId).then(res => setMyJams(res.content)).catch(console.error);
    }
  }, [activeTab, profileData]);

  const handlePublishToJam = async (history: History) => {
    if (!history.mediaUrl) return;
    try {
      await createJamPostApi({
        title: history.title,
        description: history.content,
        mediaUrl: history.mediaUrl,
        instrument: profileData?.instrument || "기타",
        genre: "기타",
        originalVolume: 1.0,
        myVolume: 1.0
      });
      toast.success("오디오잼 보드로 성공적으로 발행되었습니다!");
      setActiveTab("내 오디오잼");
    } catch (err) {
      toast.error("오디오잼 발행 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">로딩중...</div>;
  const handleDeleteJam = async (jamId: number) => {
    if (!await confirm({ message: "오디오잼 영상을 삭제하시겠습니까?", isDestructive: true })) return;
    try {
      await deleteJamPostApi(jamId);
      setMyJams(prev => prev.filter(j => j.id !== jamId));
    } catch (err) {
      console.error(err);
      toast.error("삭제에 실패했습니다.");
    }
  };

  if (!profileData) return <div className="min-h-screen flex items-center justify-center text-white">데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Cover Profile */}
      <div 
        className="relative h-64 md:h-80 bg-secondary border-b border-border overflow-hidden shadow-2xl relative group cursor-pointer"
        onClick={() => coverInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="text-white" />
        </div>
        {profileData.coverImageUrl ? (
          <img src={profileData.coverImageUrl} className="w-full h-full object-cover opacity-50" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-50" />
        )}
        {/* 커버용 input (여기에 coverInputRef 연결!) */}
        <input 
          type="file" 
          ref={coverInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleImageChange(e, "COVER")} // "COVER" 타입 전달
        />
        
        
        {/* Sleek soft gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-12 md:top-8 left-6 md:hidden">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // 💡 필수! 부모로 이벤트가 전달되지 않게 막음
              openMenu();
            }}
            className="w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-border hover:bg-white/10 transition-colors">
            <Menu size={18} />
          </button>
        </div>

        <div className="absolute top-12 md:top-8 right-6 pr-14 md:pr-16 flex gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toast.success("프로필 링크가 복사되었습니다!");
            }}
            className="w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-border hover:bg-white/10 transition-colors shrink-0"
          >
            <Share size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(true);
            }}
            className="w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-border hover:bg-white/10 transition-colors shrink-0"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 lg:px-16 -mt-20 relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-4">
          <div 
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-background bg-slate-800 overflow-hidden shadow-2xl relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileData.profilePictureUrl ? (
              <img src={profileData.profilePictureUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <User size={48} className="text-slate-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="text-white" />
            </div>
            {/* 숨겨진 파일 선택 창 */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" accept="image/*" 
              onChange={(e) => handleImageChange(e, "PROFILE")}
              />
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-white text-black px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Edit3 size={16} /> 프로필 편집
          </button>
        </div>

        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
            {profileData.nickname} 
            <span className="text-sm font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-lg border border-primary/20 scale-90 origin-left">Lv.{profileData.level}</span>
          </h1>
          <p className="text-sm md:text-base font-medium text-slate-400 mb-4 flex items-center gap-2">
            {/* <AtSign size={14} className="text-slate-500" /> george_smith_guitar */}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm mb-5">
            <span className="flex items-center gap-1.5 text-slate-300 bg-secondary border border-border px-3 py-1.5 rounded-lg font-bold">
               <Zap size={14} className="text-yellow-500 fill-yellow-500" /> 음악력 ({profileData.potential})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 bg-secondary border border-border px-3 py-1.5 rounded-lg font-bold">
               <MapPin size={14} className="text-primary" /> 활동구역 ({profileData.location ? profileData.location : "없음"})
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 bg-secondary border border-border px-3 py-1.5 rounded-lg font-bold">
               <GuitarIcon size={14} className="text-primary" /> 포지션 ({profileData.instrument})
            </span>
          </div>
          
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light md:w-2/3">{profileData.bio}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            {/* My Bands Setup */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Users size={18} className="text-primary" /> 소속 밴드
                </h3>
              </div>
              <div className="space-y-3">
                {profileData.bands.map((band) => (
                <div key={band.bandId} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl border-2 border-background overflow-hidden bg-slate-800 relative shrink-0">
                     {band.logoImageUrl ? (
                       <img src={band.logoImageUrl} className="w-full h-full object-cover" alt="Band" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-slate-800">
                         <Users size={24} className="text-slate-500" />
                       </div>
                     )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{band.bandName}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{band.role} (결성 {band.createdAt ? new Date(band.createdAt).toLocaleDateString('ko-KR') : ""})</span>
                  </div>
                </div>
                ))}
                {/* Create Band Button */}
                <Link href="/band/create" className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-border bg-background/50 hover:bg-secondary hover:border-primary/50 hover:text-primary text-slate-400 transition-colors font-bold text-sm cursor-pointer">
                  <Plus size={18} />
                  새로운 밴드 만들기
                </Link>
              </div>
            </section>

            {/* Stats */}
            <section className="mb-10 bg-secondary/50 border border-border rounded-2xl p-5 grid grid-cols-2 gap-4 items-center text-center">
              {/* <div>
                 <div className="text-2xl font-black text-white mb-1">12</div>
                 <div className="text-xs font-medium text-slate-500">참여 잼</div>
              </div> */}
              <div className="border-x border-border cursor-pointer hover:bg-white/5 transition-colors py-2 rounded-lg" onClick={() => handleOpenFollowModal("follower")}>
                 <div className="text-2xl font-black text-white mb-1">{profileData.followerCount}</div>
                 <div className="text-xs font-medium text-slate-500">팔로워</div>
              </div>
              <div className="border-x border-border cursor-pointer hover:bg-white/5 transition-colors py-2 rounded-lg" onClick={() => handleOpenFollowModal("following")}>
                 <div className="text-2xl font-black text-white mb-1">{profileData.followingCount}</div>
                 <div className="text-xs font-medium text-slate-500">팔로잉</div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            {/* Sleek Tab Navigation */}
            <div className="flex border-b border-border mb-6">
              {["좋아하는 곡", "히스토리", "내 오디오잼", "내 장비"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-1 pb-3 text-sm font-bold transition-colors relative",
                    activeTab === tab ? "text-white" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "좋아하는 곡" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">

                {profileData.favoriteMusics.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Music2 size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">등록된 좋아하는 곡이 없습니다.</p>
                  </div>
                ) : null}

                {profileData.favoriteMusics.map((song, idx) => (
                  <div key={`fav-${idx}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 group transition-colors rounded-xl hover:bg-white/5">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 text-xs font-mono font-bold w-4">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-sm font-medium text-slate-200">{song.title}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteMusic(song.id)}
                      className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={e => {setIsAddingMusic(true)}}
                  className="w-full mt-2 p-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/20 transition-colors"
                >
                  <Plus size={16} /> 좋아하는 곡 추가하기
                </button>
              </div>
            )}
            
            {activeTab === "히스토리" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">
                
                {profileData.histories.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Music2 size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">등록된 히스토리가 없습니다.</p>
                  </div>
                ) : null}
                
                <button 
                  onClick={() => setIsAddingHistory(true)}
                  className="w-full mt-2 p-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/20 transition-colors"
                >
                  <Plus size={16} /> 히스토리 기록하기 (영상/글)
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {profileData.histories.map((history, idx) => {
                    // 💡 대소문자 방지를 위해 상수로 정의
                    const isVideo = history.mediaType?.toUpperCase() === "VIDEO";

                    return (
                      <div 
                        key={`history-${history.id}-${idx}`} 
                        className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col relative mt-2" 
                        onClick={() => setSelectedHistory(history)}
                      >
                        {/* 💡 미디어 썸네일 영역 수정 */}
                        <div className="relative overflow-hidden bg-slate-800 shrink-0 aspect-[3/4]">
                          {history.mediaUrl ? (
                            isVideo ? (
                              // 🎥 비디오일 때는 video 태그를 사용 (첫 프레임이 자동으로 썸네일이 됨)
                              <video 
                                src={history.mediaUrl} 
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                                preload="metadata" // 메타데이터만 빠르게 로드해서 첫 화면 표시
                                muted 
                                playsInline
                              />
                            ) : (
                              // 🖼️ 이미지일 때는 기존대로 img 태그 사용
                              <img 
                                src={history.mediaUrl} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100" 
                                alt="history" 
                                referrerPolicy="no-referrer" 
                              />
                            )
                          ) : (
                            // 텍스트만 있는 포스트일 때 보여줄 기본 더미 이미지
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 opacity-50">
                              <Music2 size={32} className="text-slate-500" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:bg-black/40 transition-colors" />
                          
                          {/* 비디오 아이콘 표시 */}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <div className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all shadow-lg">
                                <Play size={16} className="ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4 md:p-5 text-left flex flex-col flex-1 bg-secondary/20">
                          <h4 className="text-sm md:text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{history.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{history.content}</p>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
                          {isVideo && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handlePublishToJam(history); }}
                              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 shadow-md"
                              title="오디오잼으로 발행하기"
                            >
                              <Music2 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              handleDeleteHistory(history.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-all"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "내 오디오잼" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">
                {myJams.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Music2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg text-slate-400 mb-2">아직 오디오잼이 없습니다</p>
                    <p className="text-sm">포트폴리오 영상으로 오디오잼에 참여해보세요!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {myJams.map((jam, i) => (
                      <div 
                        key={jam.id}
                        onClick={() => navigate(`/jam?id=${jam.id}`)}
                        className="group relative bg-background rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary transition-all aspect-[9/16]"
                      >
                        <div className="absolute inset-0 bg-slate-800">
                          {jam.mediaUrl ? (
                            <video src={jam.mediaUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                              <Music2 size={32} />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJam(jam.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                          {jam.parentId && jam.originalAuthorName && (
                            <span className="text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full w-max mb-1 border border-primary/30">
                              @{jam.originalAuthorName} 와 듀엣
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{jam.title}</h4>
                          <div className="flex gap-2 text-slate-400 text-xs">
                            <span className="flex items-center gap-1"><Play size={10} /> {jam.viewCount}</span>
                            <span className="flex items-center gap-1"><Heart size={10} /> {jam.likeCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "내 장비" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">
                 {profileData.gears.length === 0 ? (
                   <div className="text-center py-12 text-slate-500">
                     <Music2 size={32} className="mx-auto mb-3 opacity-30" />
                     <p className="font-medium text-sm">등록된 장비가 없습니다.</p>
                   </div>
                 ) : (
                   profileData.gears.map((gear, idx) => (
                     <div key={`gear-${idx}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 group transition-colors rounded-xl hover:bg-white/5">
                       <div className="flex items-center gap-4">
                         <span className="text-primary text-xs font-mono font-bold w-4">#{idx + 1}</span>
                         <span className="text-sm font-medium text-slate-200">{gear.gearName}</span>
                       </div>
                       <button 
                        onClick={() => handleDeleteGear(gear.id)}
                        className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   ))
                 )}
                 <button 
                   onClick={() => setIsAddingGear(true)}
                   className="w-full mt-2 p-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/20 transition-colors"
                 >
                   <Plus size={16} /> 내 장비 등록하기
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-secondary w-full max-w-lg rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-white mb-6">프로필 수정</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">활동구역</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setSubRegion("");
                        }}
                        className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-4 pr-8 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
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
                        value={subRegion}
                        onChange={(e) => setSubRegion(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-4 pr-8 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
                        required
                        disabled={!region}
                      >
                        <option value="" disabled>시/군/구</option>
                        {region && KOREA_REGIONS[region]?.map((sr) => (
                          <option key={sr} value={sr}>{sr}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">포지션 (악기)</label>
                  <div className="relative">
                    <Guitar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select 
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>포지션을 선택해주세요</option>
                      <option value="vocal">보컬</option>
                      <option value="guitar">기타</option>
                      <option value="bass">베이스</option>
                      <option value="drum">드럼</option>
                      <option value="keyboard">건반 / 피아노</option>
                      <option value="midi">작곡 / 미디</option>
                      <option value="other">기타 악기</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">한줄 소개 (Bio)</label>
                  <textarea 
                    rows={3}
                    value={bio || ""}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none" 
                    onChange={(e) => setBio(e.target.value)}
                    />
                </div>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-primary text-white font-bold rounded-xl py-4 mt-8 hover:bg-indigo-600 transition-colors"
              >
                저장하기
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <motion.div 
            key="settings-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-black text-white mb-6">설정</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => toast.error("알림 설정 페이지로 이동합니다.")}
                  className="w-full flex items-center justify-between p-4 bg-background/50 border border-border hover:border-slate-500 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">알림 설정</span>
                  </div>
                </button>
                <button 
                  onClick={() => toast.error("계정 및 보안 설정 페이지로 이동합니다.")}
                  className="w-full flex items-center justify-between p-4 bg-background/50 border border-border hover:border-slate-500 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">계정 및 보안</span>
                  </div>
                </button>
                <div className="pt-2 border-t border-border mt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl transition-colors group mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={18} className="text-red-500" />
                      <span className="text-sm font-bold text-red-500">로그아웃</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write Modals */}
      <AnimatePresence>
        {isAddingMusic && (
          <motion.div key="music-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative">
              <button onClick={() => setIsAddingMusic(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-6">곡 등록</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={newMusic} 
                  onChange={(e) => setNewMusic(e.target.value)} 
                  placeholder="곡명 - 아티스트" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary" 
                />
                <button 
                  onClick={handleAddMusic}
                  className="w-full bg-primary text-white font-bold rounded-xl py-4 mt-2 hover:bg-indigo-600 transition-colors"
                >저장하기</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isAddingHistory && (
          <motion.div key="history-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-secondary w-full max-w-lg rounded-[2rem] p-6 border border-border shadow-2xl relative">
              <button onClick={closeHistoryModal} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-6">히스토리 작성</h2>
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={historyFileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*" 
                  onChange={handleHistoryFileChange} 
                />
                <div
                  className={cn(
                    "border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden h-100",
                    historyPreviewUrl ? "border-primary/50" : "border-border bg-background/50 hover:border-primary/50"
                  )}
                  onClick={() => historyFileInputRef.current?.click()}
                >
                  {historyPreviewUrl ? (
                    // 파일이 선택된 상태 (미리보기 표시)
                    <>
                      {historyMediaType === 'VIDEO' ? (
                        <video src={historyPreviewUrl} className="w-full h-full object-cover opacity-80" muted loop playsInline autoPlay />
                      ) : (
                        <img src={historyPreviewUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                      )}
                      {/* 이미지 위 오버레이 (사진 변경 힌트) */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                        <Edit3 className="text-white mb-2" size={24} />
                        <span className="text-white text-sm font-bold">클릭하여 변경</span>
                      </div>
                    </>
                  ) : (
                    // 파일이 없는 상태
                    <div className="p-6 flex flex-col items-center justify-center">
                      <Play size={24} className="text-slate-400 mb-2" />
                      <span className="text-sm text-slate-400 font-bold">영상/사진 첨부하기</span>
                    </div>
                  )}
                </div>

                <input 
                  type="text" 
                  value={newHistoryTitle} 
                  onChange={(e) => setNewHistoryTitle(e.target.value)} 
                  placeholder="제목 (예: 2026 펜타포트 락페스티벌 예선)" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary" 
                />
                <textarea 
                  value={newHistoryDesc} 
                  onChange={(e) => setNewHistoryDesc(e.target.value)} 
                  placeholder="경험에 대한 이야기를 기록해 보세요." 
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary resize-none" 
                />
                <button 
                  onClick={handleAddHistory}
                  disabled={isUploading}
                  className="w-full bg-primary text-white font-bold rounded-xl py-4 mt-2 hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      저장 및 업로드 중...
                    </>
                  ) : "저장하기"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isAddingGear && (
          <motion.div key="gear-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative">
              <button onClick={() => setIsAddingGear(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-6">장비 등록</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={newGear} 
                  onChange={(e) => setNewGear(e.target.value)} 
                  placeholder="장비명 (예: Fender Stratocaster)" 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary" 
                />
                <button 
                  onClick={handleAddGear}
                  className="w-full bg-primary text-white font-bold rounded-xl py-4 mt-2 hover:bg-indigo-600 transition-colors"
                >저장하기</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Follow/Following Modal */}
        {activeFollowModal && (
          <motion.div 
            key="follow-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveFollowModal(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-xl h-[75vh] rounded-t-3xl border-t border-border flex flex-col shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h3 className="font-bold text-white text-lg">
                  {activeFollowModal === "follower" ? "팔로워" : "팔로잉"} 
                  <span className="text-primary ml-2">{activeFollowModal === "follower" ? followerList.length : followingList.length}</span>
                </h3>
                <button onClick={() => setActiveFollowModal(null)} className="p-1 text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {followLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-primary rounded-full animate-spin mb-4" />
                    <span className="text-sm font-medium">불러오는 중...</span>
                  </div>
                ) : (activeFollowModal === "follower" ? followerList : followingList).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <Users size={32} className="mb-3 opacity-30" />
                    <p className="font-medium text-sm">
                      {activeFollowModal === "follower" ? "아직 팔로워가 없습니다." : "아직 팔로잉하는 사람이 없습니다."}
                    </p>
                  </div>
                ) : (
                  (activeFollowModal === "follower" ? followerList : followingList).map((user, idx) => (
                    <div 
                      key={`follow-user-${user.userId}-${idx}`} 
                      className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
                      onClick={() => openUserProfile(user.userId, user.nickname, user.profilePictureUrl || "")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800 shrink-0 border border-border">
                          {user.profilePictureUrl ? (
                            <img 
                              src={user.profilePictureUrl} 
                              alt={user.nickname} 
                              referrerPolicy="no-referrer" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <User size={24} className="text-slate-500" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">{user.nickname}</span>
                          <span className="text-xs text-slate-400 line-clamp-1">{user.bio || user.instrument || ""}</span>
                        </div>
                      </div>
                      {/* Follow/Unfollow Button */}
                      <button 
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
                          (user.isFollowing || (user as any).following)
                            ? "bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-500 border border-transparent hover:border-red-500/50"
                            : "bg-primary text-white hover:bg-indigo-600 shadow-md shadow-primary/20"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(user.userId);
                        }}
                      >
                        {(user.isFollowing || (user as any).following) ? (
                          <>
                            <Check size={14} />
                            <span>Following</span>
                          </>
                        ) : (
                          "Follow"
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Detail Modal is now handled generically by AudioJamModal */}

      <AudioJamModal
        key="audio-jam-modal"
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        isHistory={true}
        post={selectedHistory ? {
          id: String(selectedHistory.id),
          title: selectedHistory.title,
          thumbnail: selectedHistory.mediaUrl || "https://picsum.photos/seed/default/600/800", 
          description: selectedHistory.content, 
          likes: selectedHistory.likeCount,
          date: "방금 전",
          likedByMe: selectedHistory.likedByMe, 
          sharesCount: selectedHistory.shareCount,
          author: selectedHistory.authorNickname,
          authorAvatar: selectedHistory.authorProfilePic,

          type: selectedHistory.mediaType?.toUpperCase() === "VIDEO" ? "video" : "post"
        } : null}
      />
    </div>
  );
}
