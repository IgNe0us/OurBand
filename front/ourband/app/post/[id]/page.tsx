"use client";

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, ThumbsUp, User, Share2, AlertCircle, CheckCircle2, BarChart2, Reply, Edit3, Trash2, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ReportModal } from '@/components/common/ReportModal';
import { useUserProfile } from '@/store/userProfileContext';
import { getUserInfoApi } from '@/api/account/userService';
import { WritePostModal } from '@/components/post/WritePostModal';
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

type PollOption = {
  id: string;
  text: string;
  votes: number;
  isVoted?: boolean;
};

type PollData = {
  id?: string | number;
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
};

type PostData = {
  id: string; bandId?: string | number; title: string; content: string; author: string; authorId?: string | number; date: string; likes: number; comments: number; tag: string; board: string; img?: string; video?: string; poll?: PollData;
  isLikedByCurrentUser?: boolean;
  authorProfileImageUrl?: string;
  commentsList?: any[];
};

const MOCK_POSTS: Record<string, PostData> = {
  '1': {
    id: '1', title: '펜더 스트라토캐스터 픽업 교체 질문이요', content: '이번에 스트랫 픽업을 텍사스 스페셜로 교체하려고 하는데 혼자서도 가능할까요?\n납땜은 예전에 학교에서 해본게 다입니다.\n혹시 주의할 점이나 팁이 있다면 공유 부탁드립니다!', author: '기타초보', date: '2023-11-20', likes: 12, comments: 5, tag: '질문', board: '자유게시판'
  },
  '2': {
    id: '2', title: '합주때마다 베이스분이 자꾸 늦는데 어떻게 말하죠ㅠㅠ', content: '안녕하세요 밴드 리더를 맡고 있는 사람입니다.\n저희 밴드 베이스분이 실력은 정말 좋으신데, 매주 합주때마다 20~30분씩 지각을 하시네요.\n어떻게 기분 안 상하게 말씀드려볼지 고민입니다 ㅠㅠ', author: '멘붕리더', date: '2023-11-21', likes: 45, comments: 23, tag: '밴드생활', board: '고민상담'
  },
  '3': {
    id: '3', title: '드디어 PRS 커스텀 24 샀습니다!! 영롱하네요✨', content: '몇 달 동안 알바해서 드디어 목표하던 텐탑을 데려왔습니다!!!\n진짜 쳐보니까 소리도 외관도 미쳤네요... 한 달간 라면만 먹어도 배부를 것 같습니다 ㅋㅋㅋ', author: '톤성애자', date: '2023-11-21', likes: 120, comments: 18, tag: '자랑', board: '악기자랑', img: 'prs'
  },
  'schedule1': {
    id: 'schedule1', title: '6월 3주차 정기 합주 투표', content: '가능한 시간 모두 투표해주세요. 장소는 저번이랑 같은 홍대 프리버드 합주실입니다.', author: '방장 (조지스미스)', date: '3일 전', likes: 5, comments: 2, tag: '일정', board: '합주 일정',
    poll: {
      title: '6월 3주차 정기 합주 투표',
      description: '단일 투표만 가능합니다',
      totalVotes: 4,
      hasVoted: false,
      options: [
        { id: 'opt1', text: '토요일 오후 2시~4시', votes: 3 },
        { id: 'opt2', text: '토요일 오후 4시~6시', votes: 0 },
        { id: 'opt3', text: '일요일 오후 1시~3시', votes: 1 },
      ]
    }
  }
};

export default function PostDetailPage() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const { openUserProfile } = useUserProfile();
  const [poll, setPoll] = useState<PollData | undefined>(undefined);

  // 대댓글/수정/삭제 상태
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // API Import 추가
  const { getBandPostApi, toggleLikeApi, createBandPostCommentApi, votePollApi, updateCommentApi, deleteCommentApi, updateBandPostApi, deleteBandPostApi } = require('@/api/band/bandService');

  // 현재 유저 정보 로드
  useEffect(() => {
    getUserInfoApi()
      .then((user: any) => setCurrentUserId(user.userId))
      .catch((err: any) => console.error('Failed to load user info:', err));
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBandPostApi(id);
        let boardName = data.boardType;
        if (data.boardType === 'NOTICE') boardName = '공지사항';
        if (data.boardType === 'FREE') boardName = '자유게시판';
        if (data.boardType === 'SCHEDULE') boardName = '합주 일정';
        if (data.boardType === 'REHEARSAL') boardName = '합주 영상';
        
        setPost({
          id: String(data.id),
          bandId: data.bandId,
          title: data.title,
          content: data.content,
          author: data.authorName || '알 수 없음',
          authorId: data.authorId,
          date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '',
          likes: data.likeCount || 0, 
          comments: data.commentCount || 0,
          tag: data.category || '일반',
          board: boardName,
          img: data.mediaType === 'IMAGE' ? data.mediaUrl : undefined,
          video: data.mediaType === 'VIDEO' ? data.mediaUrl : undefined,
          isLikedByCurrentUser: data.isLikedByCurrentUser,
          authorProfileImageUrl: data.authorProfileImageUrl,
          commentsList: data.comments || [],
          poll: data.poll
        });
        setIsLiked(!!data.isLikedByCurrentUser);
        
        if (data.poll) {
          setPoll({
            ...data.poll,
            hasVoted: data.poll.myVotedOptionId !== null,
            options: data.poll.options.map((opt: any) => ({
              id: String(opt.id),
              text: opt.content,
              votes: opt.voteCount,
              isVoted: opt.id === data.poll.myVotedOptionId
            }))
          });
        }
      } catch (e) {
        console.error("Failed to fetch post, falling back to mock", e);
        const mockPost = MOCK_POSTS[id as keyof typeof MOCK_POSTS] || MOCK_POSTS['1'];
        setPost(mockPost);
        setPoll(mockPost.poll);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);
  
  const handleVote = async (optionId: string) => {
    if (!poll || !post) return;
    
    try {
      await votePollApi(post.bandId || 1, id, poll.id || 1, optionId);
      
      const newOptions = poll.options.map(opt => {
        if (opt.id === optionId) {
          return {
            ...opt,
            isVoted: !opt.isVoted,
            votes: opt.isVoted ? opt.votes - 1 : opt.votes + 1
          };
        } else {
          return {
            ...opt,
            isVoted: false,
            votes: opt.isVoted ? opt.votes - 1 : opt.votes
          };
        }
      });

      const hasVoted = newOptions.some(opt => opt.isVoted);
      const newTotal = newOptions.reduce((acc, curr) => acc + curr.votes, 0);
      
      setPoll({
        ...poll,
        options: newOptions,
        totalVotes: newTotal,
        hasVoted
      });
    } catch (e) {
      console.error("Vote failed", e);
      toast.error("투표 처리 중 오류가 발생했습니다.");
    }
  };
  
  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(`/band/${id}/board`);
    }
  };

  const handleToggleLike = async () => {
    try {
      const result = await toggleLikeApi(id);
      setIsLiked(result.isLiked);
      setPost(prev => prev ? {
        ...prev,
        likes: result.isLiked ? prev.likes + 1 : prev.likes - 1,
        isLikedByCurrentUser: result.isLiked
      } : prev);
    } catch (e) {
      console.error("Failed to toggle like", e);
    }
  };

  const handleUpdatePost = async (data: any) => {
    try {
      let mediaUrl = post?.img || post?.video || undefined;
      let mediaType = post?.img ? 'IMAGE' : (post?.video ? 'VIDEO' : undefined);

      if (data.files && data.files.length > 0) {
        const { uploadToCloudflare } = require('@/lib/cloudflare');
        mediaUrl = await uploadToCloudflare(data.files[0]);
        mediaType = data.files[0].type.startsWith("video/") ? "VIDEO" : "IMAGE";
      } else if (data.removeMedia) {
        mediaUrl = "";
        mediaType = "";
      }

      let mappedBoardType = "FREE";
      if (data.boardType === "공지사항" || data.boardType === "NOTICE") mappedBoardType = "NOTICE";
      else if (data.boardType === "합주 일정" || data.boardType === "SCHEDULE") mappedBoardType = "SCHEDULE";
      else if (data.boardType === "합주 영상" || data.boardType === "합주" || data.boardType === "REHEARSAL") mappedBoardType = "REHEARSAL";

      await updateBandPostApi(post?.bandId || 1, id, {
        ...data,
        boardType: mappedBoardType,
        mediaUrl,
        mediaType
      });
      window.location.reload();
    } catch (e) {
      console.error("Failed to update post", e);
      toast.error("게시글 수정에 실패했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!await confirm({ message: "게시글을 삭제하시겠습니까?", isDestructive: true })) return;
    try {
      await deleteBandPostApi(post?.bandId || 1, id);
      router.push(`/band/${post?.bandId}/board`);
    } catch (e) {
      console.error(e);
      toast.error("게시글 삭제에 실패했습니다.");
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment || !post) return;
    
    setIsSubmittingComment(true);
    try {
      const newComment = await createBandPostCommentApi(post.bandId || 1, id, { content: commentText.trim(), parentId: null });
      setPost(prev => prev ? {
        ...prev,
        comments: prev.comments + 1,
        commentsList: [...(prev.commentsList || []), newComment]
      } : prev);
      setCommentText("");
    } catch (e) {
      console.error("Failed to add comment", e);
      toast.error("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 대댓글 작성
  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim() || !post) return;
    try {
      const newReply = await createBandPostCommentApi(post.bandId || 1, id, { content: replyText.trim(), parentId });
      // 부모 댓글의 replies에 추가
      setPost(prev => {
        if (!prev) return prev;
        const addReplyToComments = (comments: any[]): any[] => {
          return comments.map((c: any) => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newReply] };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: addReplyToComments(c.replies) };
            }
            return c;
          });
        };
        return {
          ...prev,
          comments: prev.comments + 1,
          commentsList: addReplyToComments(prev.commentsList || [])
        };
      });
      setReplyingTo(null);
      setReplyText("");
    } catch (e) {
      console.error("Failed to add reply", e);
      toast.error("답글 작성에 실패했습니다.");
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: number) => {
    if (!editText.trim() || !post) return;
    try {
      const updated = await updateCommentApi(post.bandId || 1, id, commentId, { content: editText.trim() });
      setPost(prev => {
        if (!prev) return prev;
        const updateInComments = (comments: any[]): any[] => {
          return comments.map((c: any) => {
            if (c.id === commentId) {
              return { ...c, content: updated.content, updatedAt: updated.updatedAt };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateInComments(c.replies) };
            }
            return c;
          });
        };
        return { ...prev, commentsList: updateInComments(prev.commentsList || []) };
      });
      setEditingComment(null);
      setEditText("");
    } catch (e) {
      console.error("Failed to edit comment", e);
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!await confirm({ message: "댓글을 삭제하시겠습니까?", isDestructive: true }) || !post) return;
    try {
      await deleteCommentApi(post.bandId || 1, id, commentId);
      // 댓글 목록에서 제거 (대댓글 수 포함 차감)
      setPost(prev => {
        if (!prev) return prev;
        let removedCount = 0;
        const removeFromComments = (comments: any[]): any[] => {
          return comments.map((c: any) => {
            if (c.id === commentId) {
              removedCount = 1 + (c.replies?.length || 0);
              return null;
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: removeFromComments(c.replies) };
            }
            return c;
          }).filter(c => c !== null);
        };
        const newList = removeFromComments(prev.commentsList || []);
        return { ...prev, comments: Math.max(0, prev.comments - removedCount), commentsList: newList };
      });
    } catch (e) {
      console.error("Failed to delete comment", e);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  // 댓글 렌더링 함수 (React 컴포넌트가 아닌 일반 함수로 분리하여 한글 입력 끊김 방지)
  const renderComment = (c: any, depth = 0) => {
    const isEditing = editingComment === c.id;
    const isReplying = replyingTo === c.id;
    const isAuthor = currentUserId === c.authorId;

    return (
      <div key={c.id} className={cn("flex gap-3", depth > 0 && "ml-8 pl-4 border-l-2 border-border/40")}>
        <div
          className="w-8 h-8 rounded-full bg-slate-800 border border-border shrink-0 cursor-pointer hover:border-primary transition-colors overflow-hidden mt-0.5"
          onClick={() => openUserProfile(Number(c.authorId), c.authorName, c.authorProfileImageUrl)}
        >
          {c.authorProfileImageUrl ? (
            <img src={c.authorProfileImageUrl} alt={c.authorName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><User size={14} className="text-slate-400" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* 헤더: 이름, 시간, 액션 버튼 */}
          <div className="flex justify-between items-center">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => openUserProfile(Number(c.authorId), c.authorName, c.authorProfileImageUrl)}
            >
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.authorName}</span>
              <span className="text-[10px] text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
              {c.updatedAt && c.createdAt && c.updatedAt !== c.createdAt && (
                <span className="text-[10px] text-slate-500 italic">(수정됨)</span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {depth === 0 && (
                <button
                  onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyText(""); setEditingComment(null); }}
                  className="text-slate-500 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-white/5"
                  title="답글"
                >
                  <Reply size={13} />
                </button>
              )}
              {isAuthor && (
                <>
                  <button
                    onClick={() => { setEditingComment(isEditing ? null : c.id); setEditText(c.content); setReplyingTo(null); }}
                    className="text-slate-500 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-white/5"
                    title="수정"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5"
                    title="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 내용 or 수정 모드 */}
          {isEditing ? (
            <div className="mt-2 flex gap-2 items-start">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-secondary/60 border border-border rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-primary transition-colors"
                rows={2}
                autoFocus
              />
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => handleEditComment(c.id)} className="text-primary hover:text-indigo-400 transition-colors p-1" title="저장">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingComment(null)} className="text-slate-400 hover:text-white transition-colors p-1" title="취소">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{c.content}</p>
          )}

          {/* 답글 입력 */}
          {isReplying && (
            <div className="mt-3 flex gap-2 items-start">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${c.authorName}에게 답글...`}
                className="flex-1 bg-secondary/60 border border-border rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-primary transition-colors"
                rows={2}
                autoFocus
              />
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => handleReplySubmit(c.id)} className="text-primary hover:text-indigo-400 transition-colors p-1" title="등록">
                  <Check size={16} />
                </button>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white transition-colors p-1" title="취소">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 대댓글 목록 */}
          {c.replies && c.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {c.replies.map((reply: any) => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center font-bold text-xl">로딩 중...</div>;
  }

  if (!post) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center font-bold text-xl">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 w-full">
      <header className="px-6 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-20 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-secondary border border-border px-2.5 py-1 rounded-md">{post.board}</span>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">{post.tag}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><Share2 size={20}/></button>
          {currentUserId !== Number(post.authorId) && (
            <button onClick={() => setReportModalOpen(true)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-white/10"><AlertCircle size={20}/></button>
          )}
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-8 w-full text-left flex-1">
        <h1 className="text-2xl md:text-3xl font-black text-white leading-snug mb-6">{post.title}</h1>
        
        <div className="flex justify-between items-center pb-6 border-b border-border/50 mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => openUserProfile(Number(post.authorId), post.author, post.authorProfileImageUrl)}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-background overflow-hidden p-0.5 shadow-sm group-hover:border-primary/50 transition-colors">
              <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                {post.authorProfileImageUrl ? (
                  <img src={post.authorProfileImageUrl} alt={post.author} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{post.author}</span>
              <span className="text-xs text-slate-500">{post.date}</span>
            </div>
          </div>
          {currentUserId === Number(post.authorId) && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-bold bg-secondary border border-border px-3 py-1.5 rounded-lg"
              >
                <Edit3 size={16} /> 수정
              </button>
              <button 
                onClick={handleDeletePost}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 text-sm font-bold bg-secondary border border-border px-3 py-1.5 rounded-lg"
              >
                <Trash2 size={16} /> 삭제
              </button>
            </div>
          )}
        </div>
        
        <div 
          className="prose prose-invert max-w-none text-slate-300 text-base md:text-lg leading-loose whitespace-pre-wrap mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {post.img && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-border">
            <img src={post.img.startsWith('http') ? post.img : `https://picsum.photos/seed/${post.img}/800/600`} className="w-full h-auto" alt="게시글 첨부" />
          </div>
        )}

        {post.video && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-border bg-black">
            <video src={post.video} className="w-full h-auto" controls />
          </div>
        )}
        
        {poll && (
          <div className="mb-12 bg-secondary/30 rounded-2xl p-6 md:p-8 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={20} className="text-primary" />
              <h2 className="text-xl font-bold text-white">{poll.title}</h2>
            </div>
            {poll.description && (
              <p className="text-sm text-slate-400 mb-6">{poll.description}</p>
            )}
            
            <div className="space-y-3">
              {poll.options.map(opt => {
                const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                return (
                  <div 
                    key={opt.id} 
                    onClick={() => handleVote(opt.id)}
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-colors flex justify-between items-center z-10",
                      opt.isVoted 
                        ? "border-primary bg-primary/10 text-white" 
                        : "border-border bg-background hover:bg-white/5 text-slate-300"
                    )}
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-primary/20 z-[-1] transition-all duration-500 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="flex items-center gap-3 font-bold">
                      {opt.isVoted ? <CheckCircle2 size={18} className="text-primary" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-600" />}
                      <span>{opt.text}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">{opt.votes}명</span>
                      <span className="text-slate-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
              <span>총 {poll.totalVotes}명 참여</span>
              {poll.hasVoted && <span className="text-primary font-bold">투표완료</span>}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4 py-4 mb-8">
          <button 
            onClick={handleToggleLike}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors", isLiked ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-slate-400 hover:bg-slate-800 hover:text-white")}
          >
            <ThumbsUp size={16} className={isLiked ? "fill-primary" : ""} />
            <span className="text-sm font-bold">{post.likes}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary border border-border text-slate-400 cursor-default">
            <MessageSquare size={16} /> {post.comments}
          </button>
        </div>

        {/* Comments Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">댓글 <span className="text-primary">{post.comments}</span></h2>
        </div>

          <div className="space-y-6">
            {post.commentsList && post.commentsList.length > 0 ? (
              post.commentsList.map((c: any) => renderComment(c, 0))
            ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              등록된 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요!
            </div>
          )}
        </div>

        {/* 댓글 입력 */}
        <div className="mt-8 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border mt-1 shadow-inner overflow-hidden flex items-center justify-center">
              <User size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 border border-border rounded-xl bg-background overflow-hidden focus-within:border-primary transition-colors pr-2">
              <textarea 
                rows={2} 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent text-sm text-white resize-none p-4 placeholder-slate-500 outline-none" 
                placeholder="댓글을 남겨보세요..."
              ></textarea>
              <div className="flex justify-end pb-2">
                <button 
                  onClick={handleCommentSubmit}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="bg-primary hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                >
                  {isSubmittingComment ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
        </div>

      </main>
      
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} targetName="게시글" />
      

      <WritePostModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleUpdatePost}
        defaultBoard={post.board === "공지사항" ? "NOTICE" : post.board === "합주 일정" ? "SCHEDULE" : post.board === "합주 영상" ? "REHEARSAL" : "FREE"}
        initialData={{
          id: post.id,
          boardType: post.board === "공지사항" ? "NOTICE" : post.board === "합주 일정" ? "SCHEDULE" : post.board === "합주 영상" ? "REHEARSAL" : "FREE",
          category: post.tag,
          title: post.title,
          content: post.content,
          mediaUrl: post.img || post.video,
          mediaType: post.img ? 'IMAGE' : (post.video ? 'VIDEO' : undefined),
          poll: poll || post.poll
        }}
      />
    </div>
  );
}
