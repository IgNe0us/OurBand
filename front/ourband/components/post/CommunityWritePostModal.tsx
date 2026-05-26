"use client";
// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Palette, BarChart2, Plus, Trash2, Bold, Italic, Underline, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface CommunityWritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBoard?: string;
  isLeader?: boolean;
  initialData?: {
    id?: string | number;
    boardType: string;
    category: string;
    part?: string;
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    poll?: any;
  };
  onSubmit?: (data: { id?: string | number; boardType: string; category: string; part?: string; title: string; content: string; files?: File[]; poll?: any; removeMedia?: boolean }) => Promise<void>;
}

const CATEGORIES: Record<string, string[]> = {
  "자유게시판": ["일반", "잡담", "질문", "정보", "장비"],
  "고민상담": ["일반", "밴드생활", "진로", "기타"],
  "악기자랑": ["일반", "자랑", "언박싱"],
  "구인구직": ["멤버구함", "밴드구함"],
  "합주실/공연장": ["합주실", "공연장"],
  "중고장터": ["팝니다", "삽니다"]
};

const PARTS = ["보컬", "기타", "베이스", "드럼", "건반", "작곡/미디", "그외"];

export function CommunityWritePostModal({ isOpen, onClose, defaultBoard = "자유게시판", isLeader = false, initialData, onSubmit }: CommunityWritePostModalProps) {
  const [board, setBoard] = useState(defaultBoard);
  const [category, setCategory] = useState(CATEGORIES[defaultBoard]?.[0] || "일반");
  const [part, setPart] = useState(PARTS[0]);
  const [title, setTitle] = useState("");
  const [usePoll, setUsePoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollTitle, setPollTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ url: string, type: string } | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const partDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (partDropdownRef.current && !partDropdownRef.current.contains(event.target as Node)) {
        setIsPartDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setBoard(defaultBoard);
        setCategory(initialData.category || (CATEGORIES[defaultBoard]?.[0] || "일반"));
        setPart(initialData.part || PARTS[0]);
        setTitle(initialData.title);
        if (initialData.mediaUrl) {
          setExistingMedia({ url: initialData.mediaUrl, type: initialData.mediaType || 'IMAGE' });
        } else {
          setExistingMedia(null);
        }
        setRemoveMedia(false);
        if (initialData.poll) {
          setUsePoll(true);
          setPollTitle(initialData.poll.title || "");
          if (initialData.poll.options && Array.isArray(initialData.poll.options)) {
            setPollOptions(initialData.poll.options.map((o: any) => o.content || o.text));
          } else {
            setPollOptions(["", ""]);
          }
        }
        if (editorRef.current) {
          editorRef.current.innerHTML = initialData.content;
        }
      } else {
        setBoard(defaultBoard);
        setCategory(CATEGORIES[defaultBoard]?.[0] || "일반");
        setPart(PARTS[0]);
        setTitle("");
        setFiles([]);
        setExistingMedia(null);
        setRemoveMedia(false);
        setUsePoll(false);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
    }
  }, [isOpen, defaultBoard, initialData]);

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const newOpts = [...pollOptions];
    newOpts[idx] = val;
    setPollOptions(newOpts);
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePublish = async () => {
    if (!title.trim()) return alert("제목을 입력해주세요!");
    const content = editorRef.current?.innerHTML || "";
    if (!content.trim() || content === "<br>") return alert("내용을 입력해주세요!");

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          id: initialData?.id,
          boardType: board,
          category,
          part: board === "자유게시판" ? part : undefined,
          title: title.trim(),
          content,
          files: files.length > 0 ? files : undefined,
          poll: usePoll && pollTitle.trim() ? {
            title: pollTitle.trim(),
            options: pollOptions.filter(o => o.trim() !== "")
          } : undefined,
          removeMedia: initialData?.mediaUrl && !existingMedia ? true : false
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to publish post:", err);
      alert("게시글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-background w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl rounded-none md:rounded-2xl border-0 md:border border-border flex flex-col shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-border bg-secondary shrink-0 pt-10 md:pt-5">
              <h2 className="text-xl font-black text-white">게시글 작성</h2>
              <div className="flex gap-2">
                <button onClick={onClose} className="p-2 -mr-2 md:mr-0 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 hide-scrollbar">
              {/* Selects */}
              <div className="flex gap-3">
                {/* Board Dropdown - fixed for community */}
                <div className="flex-1 md:flex-none md:w-[160px] bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 text-sm font-bold text-primary flex items-center justify-center shrink-0 truncate">
                  {board}
                </div>
                
                {/* Category Dropdown */}
                {CATEGORIES[board] && (
                  <div className="relative flex-1 md:flex-none" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full md:w-[140px] bg-secondary border border-border rounded-2xl pl-4 pr-4 py-3 text-sm font-bold text-slate-300 focus:outline-none focus:border-primary text-left flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{category}</span>
                      <ChevronDown className="text-slate-400 shrink-0" size={16} />
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-full bg-secondary border border-border rounded-xl shadow-xl overflow-hidden z-20 py-2"
                        >
                          {CATEGORIES[board].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategory(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 text-sm font-bold transition-colors",
                                category === cat ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Part Dropdown - Only if 자유게시판 */}
                {board === "자유게시판" && (
                  <div className="relative flex-1 md:flex-none" ref={partDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsPartDropdownOpen(!isPartDropdownOpen)}
                      className="w-full md:w-[140px] bg-secondary border border-border rounded-2xl pl-4 pr-4 py-3 text-sm font-bold text-slate-300 focus:outline-none focus:border-primary text-left flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{part}</span>
                      <ChevronDown className="text-slate-400 shrink-0" size={16} />
                    </button>

                    <AnimatePresence>
                      {isPartDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-full bg-secondary border border-border rounded-xl shadow-xl overflow-hidden z-20 py-2 max-h-[300px] overflow-y-auto hide-scrollbar"
                        >
                          {PARTS.map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setPart(p);
                                setIsPartDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 text-sm font-bold transition-colors",
                                part === p ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-border py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors font-bold"
              />

              {/* Toolbar & Editor */}
              <div className="border border-border rounded-xl bg-secondary/30 overflow-hidden flex flex-col">
                <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-secondary/80 overflow-x-auto hide-scrollbar relative">
                  <select 
                    onChange={(e) => execCmd("fontName", e.target.value)}
                    className="bg-background border border-border text-xs text-slate-300 rounded px-2 py-1.5 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="Inter">기본 글꼴 (Inter)</option>
                    <option value="NanumSquare">나눔스퀘어</option>
                    <option value="Pretendard">프리텐다드</option>
                    <option value="sans-serif">돋움</option>
                    <option value="serif">명조</option>
                  </select>
                  <div className="w-px h-4 bg-border mx-1 shrink-0" />
                  
                  {/* Color Picker */}
                  <div className="relative flex items-center">
                    <input 
                      type="color" 
                      ref={colorInputRef}
                      onChange={(e) => execCmd("foreColor", e.target.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <button 
                      onClick={() => colorInputRef.current?.click()}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0" 
                      title="글자 색상"
                    >
                      <Palette size={16}/>
                    </button>
                  </div>

                  <button onClick={() => execCmd("bold")} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition font-bold shrink-0" title="굵게"><Bold size={16}/></button>
                  <button onClick={() => execCmd("italic")} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition italic shrink-0" title="기울임"><Italic size={16}/></button>
                  <button onClick={() => execCmd("underline")} className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition underline shrink-0" title="밑줄"><Underline size={16}/></button>
                  <div className="w-px h-4 bg-border mx-1 shrink-0" />
                  <button 
                    onClick={() => {
                      if (usePoll && initialData?.poll?.totalVotes > 0) {
                        alert("이미 투표가 진행되어 투표를 삭제할 수 없습니다.");
                        return;
                      }
                      setUsePoll(!usePoll);
                    }} 
                    className={cn("px-2 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap", usePoll ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-background border border-border text-slate-300 hover:bg-slate-700 hover:text-white")}
                  >
                    <BarChart2 size={14}/> {usePoll ? (initialData?.poll?.totalVotes > 0 ? "투표 진행중" : "투표 추가") : "투표 추가"}
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  className="w-full min-h-[300px] p-4 bg-transparent text-sm text-white focus:outline-none overflow-y-auto block empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600"
                  data-placeholder="내용을 자유롭게 작성해주세요."
                />
              </div>

              {/* Poll Form */}
              {usePoll && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 md:p-5 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                      <BarChart2 size={16}/> 투표 설정 {initialData?.poll?.totalVotes > 0 && <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">진행중 (삭제불가)</span>}
                    </h3>
                    {!(initialData?.poll?.totalVotes > 0) && (
                      <button onClick={() => setUsePoll(false)} className="text-xs text-slate-500 hover:text-slate-300"><X size={16}/></button>
                    )}
                  </div>
                  <input type="text" placeholder="투표 제목 (예: 다음 합주 장소 어디가 좋을까요?)" value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} disabled={initialData?.poll?.totalVotes > 0} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600 disabled:opacity-50" />
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 relative group">
                        <input type="text" placeholder={`투표 항목 ${idx + 1}`} value={opt} onChange={(e) => handleUpdatePollOption(idx, e.target.value)} disabled={initialData?.poll?.totalVotes > 0} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600 disabled:opacity-50" />
                        {pollOptions.length > 2 && !(initialData?.poll?.totalVotes > 0) && (
                          <button onClick={() => handleRemovePollOption(idx)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!(initialData?.poll?.totalVotes > 0) && (
                    <button onClick={handleAddPollOption} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <Plus size={14}/> 항목 추가하기
                    </button>
                  )}
                </div>
              )}

              {/* File Upload Rules & UI */}
              <div className="bg-slate-900/50 p-4 md:p-5 rounded-xl border border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-secondary border border-border hover:border-primary/50 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 flex-shrink-0">
                    <ImageIcon size={16}/> 사진, 움짤, 동영상 등 파일 첨부
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.gif,.png,.mp4,.mov,.webm,.ogv,.webp,.bmp,.tif,.tiff,.heic,.avi,.mkv,.wmv,.asf" className="hidden" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
                  <span className="text-sm font-bold text-slate-400 truncate w-full sm:w-auto">
                    {files.length > 0 ? <span className="text-primary">{files.length}개의 파일 선택됨 ({(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB)</span> : "선택된 파일 없음"}
                  </span>
                </div>

                {existingMedia && files.length === 0 && (
                  <div className="mb-4 inline-flex items-center gap-4 bg-background p-3 rounded-xl border border-border relative pr-12">
                    <div className="w-16 h-16 rounded overflow-hidden bg-slate-800 shrink-0">
                      {existingMedia.type === 'VIDEO' ? (
                        <video src={existingMedia.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={existingMedia.url} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-300 block truncate">기존 첨부파일</span>
                      <span className="text-xs text-slate-500">새 파일을 첨부하면 덮어씌워집니다.</span>
                    </div>
                    <button onClick={() => { setExistingMedia(null); setRemoveMedia(true); }} className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-full transition-colors" title="기존 파일 삭제">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                )}

                <div className="text-[11px] leading-relaxed text-slate-500 opacity-80 break-all space-y-0.5">
                  <p>• 허용 확장자: *.jpg;*.jpeg;*.gif;*.png;*.mp4;*.mov;*.webm;*.ogv;*.webp;*.bmp;*.tif;*.tiff;*.heic;*.avi;*.mkv;*.wmv;*.asf;</p>
                  <p>• 파일당 최대 용량: 50.00MB, 총 50MB.</p>
                  <p>• .mp4, .webm, .mov, .webp 는 총 <strong className="text-slate-400">12개</strong> 까지 첨부 가능</p>
                  <p>• .mp4, .webm, .mov, .webp 는 파일당 <strong className="text-slate-400">40MB</strong> 까지 업로드 가능</p>
                  <p>• 11MB~40MB 움짤은 11MB 이하로 자동변환됨</p>
                  <p>• 음원 있는 움짤/동영상은 45초 이내 길이만 가능, 쪼개서 올릴 경우 무통보 삭제 가능</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background shrink-0 flex justify-end gap-3 pb-8 md:pb-4">
              <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-secondary transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button 
                onClick={handlePublish} 
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    등록 중...
                  </>
                ) : (
                  "등록"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
