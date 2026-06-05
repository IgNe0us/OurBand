"use client";
import { X, Heart, Share2, MessageSquare, Send, Reply, Edit3, Trash2, Check, User, Play } from "lucide-react";
import { useUserProfile } from "@/store/userProfileContext";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getUserInfoApi } from '@/api/account/userService';
import { getBandPostApi, toggleLikeApi, createBandPostCommentApi, updateCommentApi, deleteCommentApi } from '@/api/band/bandService';
import { useConfirm } from "@/hooks/useConfirm";
import { ExpandableComment } from "@/components/common/ExpandableComment";
export type VideoPost = {
  id: string | number;
  title: string;
  description?: string;
  thumbnail?: string;
  videoUrl?: string;
  date?: string;
};

interface VideoPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | number | null;
  bandId: string | number | null;
}

export function VideoPostModal({ isOpen, onClose, postId, bandId }: VideoPostModalProps) {
  const { confirm } = useConfirm();
  const { openUserProfile } = useUserProfile();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    getUserInfoApi()
      .then((user: any) => setCurrentUserId(user.userId))
      .catch((err: any) => console.error('Failed to load user info:', err));
  }, []);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPost();
    } else {
      setPost(null);
      setCommentText("");
      setReplyingTo(null);
      setEditingComment(null);
    }
  }, [isOpen, postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const data = await getBandPostApi(postId!);
      setPost({
        id: data.id,
        title: data.title,
        content: data.content,
        authorName: data.authorName || '알 수 없음',
        authorId: data.authorId,
        date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        isLikedByCurrentUser: data.isLikedByCurrentUser,
        commentsList: data.comments || []
      });
    } catch (e) {
      console.error("Failed to fetch post", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await toggleLikeApi(postId!);
      setPost((prev: any) => prev ? {
        ...prev,
        likeCount: result.isLiked ? prev.likeCount + 1 : prev.likeCount - 1,
        isLikedByCurrentUser: result.isLiked
      } : prev);
    } catch (e) {
      console.error("Failed to toggle like", e);
    }
  };

  const handleShare = () => {
    alert("링크가 복사되었습니다!");
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment || !post) return;
    
    setIsSubmittingComment(true);
    try {
      const newComment = await createBandPostCommentApi(bandId || 1, postId!, { content: commentText.trim(), parentId: null });
      setPost((prev: any) => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1,
        commentsList: [...(prev.commentsList || []), newComment]
      } : prev);
      setCommentText("");
    } catch (e) {
      console.error("Failed to add comment", e);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim() || !post) return;
    try {
      const newReply = await createBandPostCommentApi(bandId || 1, postId!, { content: replyText.trim(), parentId });
      setPost((prev: any) => {
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
          commentCount: prev.commentCount + 1,
          commentsList: addReplyToComments(prev.commentsList || [])
        };
      });
      setReplyingTo(null);
      setReplyText("");
    } catch (e) {
      console.error("Failed to add reply", e);
      alert("답글 작성에 실패했습니다.");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim() || !post) return;
    try {
      const updated = await updateCommentApi(bandId || 1, postId!, commentId, { content: editText.trim() });
      setPost((prev: any) => {
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
      alert("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!await confirm({ message: "댓글을 삭제하시겠습니까?", isDestructive: true }) || !post) return;
    try {
      await deleteCommentApi(bandId || 1, postId!, commentId);
      setPost((prev: any) => {
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
        return { ...prev, commentCount: Math.max(0, prev.commentCount - removedCount), commentsList: newList };
      });
    } catch (e) {
      console.error("Failed to delete comment", e);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  // 댓글 평탄화 함수 (재귀를 풀어서 UI가 화면 밖으로 나가는 것을 방지)
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
    const isEditing = editingComment === c.id;
    const isReplying = replyingTo === c.id;
    const isAuthor = currentUserId === c.userId || currentUserId === c.authorId;
    
    // 깊이에 따른 들여쓰기 계산 (3단위로 순환하여 화면 밖으로 나가지 않게 함)
    const effectiveDepth = c.depth === 0 ? 0 : ((c.depth - 1) % 4) + 1;
    const isRoot = c.depth === 0;

    return (
      <div 
        key={c.id} 
        style={{ marginLeft: effectiveDepth > 0 ? `${effectiveDepth * 2.5}rem` : '0' }}
        className={cn("flex gap-3 relative", isRoot ? "mt-6" : "mt-3", effectiveDepth > 0 && "pl-4 border-l-2 border-border/40")}
      >
        <div 
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary shrink-0 border border-border flex items-center justify-center font-bold text-xs text-white overflow-hidden mt-0.5 cursor-pointer"
          onClick={() => openUserProfile(Number(c.authorId), c.authorName, c.authorProfileImageUrl)}
        >
          {c.authorProfileImageUrl ? (
            <img src={c.authorProfileImageUrl} alt={c.authorName} className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div 
              className="flex items-baseline gap-2 mb-1 cursor-pointer"
              onClick={() => openUserProfile(Number(c.authorId), c.authorName, c.authorProfileImageUrl)}
            >
              <span className="font-bold text-sm text-white hover:text-primary transition-colors">{c.authorName}</span>
              <span className="text-[10px] text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
              {c.updatedAt && c.createdAt && c.updatedAt !== c.createdAt && (
                <span className="text-[10px] text-slate-500 italic">(수정됨)</span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
                <button
                  onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyText(""); setEditingComment(null); }}
                  className="text-slate-500 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-white/5"
                  title="답글"
                >
                  <Reply size={14} />
                </button>
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

          {isEditing ? (
            <div className="mt-2 flex gap-2 items-start">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-primary transition-colors"
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
            <ExpandableComment content={c.content} className="text-sm text-slate-300 mt-1" lines={4} />
          )}

          {isReplying && (
            <div className="mt-3 flex gap-2 items-start">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${c.authorName}에게 답글...`}
                className="flex-1 bg-secondary border border-border rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-primary transition-colors"
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
          {/* 대댓글 목록 렌더링 부분은 평탄화 처리로 삭제됨 */}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex flex-col md:items-center justify-end md:justify-center bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full h-[90vh] md:max-w-4xl bg-background md:rounded-3xl overflow-hidden border-t md:border border-border shadow-2xl flex flex-col md:h-[85vh] rounded-t-3xl"
        >
          {loading || !post ? (
             <div className="flex-1 flex items-center justify-center text-white font-bold text-lg">
               로딩 중...
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-border shrink-0 bg-background sticky top-0 z-10">
                <h2 className="text-lg md:text-xl font-black text-white line-clamp-1 pr-4">{post.title}</h2>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                {/* Video Area */}
                <div className="w-full aspect-video bg-black relative flex items-center justify-center shrink-0">
                  {post.mediaType === 'VIDEO' && post.mediaUrl ? (
                    <video src={post.mediaUrl} className="w-full h-full" controls playsInline autoPlay />
                  ) : post.mediaUrl ? (
                    <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-slate-500">미디어가 없습니다.</div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 md:p-8 text-left bg-background grow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary px-2.5 py-1 rounded border border-primary/30 text-xs font-bold">합주 기록</span>
                      <span className="text-sm font-bold text-slate-400">{post.date}</span>
                    </div>
                    
                    {/* Interaction Buttons */}
                    <div className="flex items-center gap-2 md:gap-4">
                      <button onClick={handleLike} className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <Heart size={20} className={post.isLikedByCurrentUser ? "fill-rose-500 text-rose-500" : ""} />
                        <span className="text-sm font-bold text-white">{post.likeCount}</span>
                      </button>
                      <button onClick={handleShare} className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors p-2">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none border-b border-border pb-8">
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]" dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>

                  {/* Comments Section */}
                  <div className="pt-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <MessageSquare size={18} className="text-primary" />
                      댓글 <span className="text-slate-400 text-sm font-normal">{post.commentCount}</span>
                    </h3>
                    {post.commentsList && post.commentsList.length > 0 ? (
                      <div className="pb-4">
                        {flattenComments(post.commentsList).map((comment: any) => renderComment(comment))}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-8">댓글이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input Sticky Bottom */}
              <div className="p-4 border-t border-border bg-background shrink-0 pb-safe">
                <form onSubmit={submitComment} className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 남겨보세요..." 
                    className="flex-1 bg-secondary border border-border rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    autoComplete="off"
                  />
                  <button 
                    type="submit" 
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
                  >
                    <Send size={18} className="-ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
