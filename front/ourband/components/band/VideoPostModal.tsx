"use client";
// @ts-nocheck
import { X, Play, Heart, Share2, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export interface VideoPost {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
  description: string;
}

interface VideoPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: VideoPost | null;
}

export function VideoPostModal({ isOpen, onClose, post }: VideoPostModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    { id: 1, author: "김드럼", text: "오 이번 합주 진짜 잘 맞았네요!", time: "2시간 전" },
    { id: 2, author: "톤성애자", text: "베이스 톤 좀 더 만져볼게요 ㅎㅎ", time: "1시간 전" }
  ]);

  if (!isOpen || !post) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    alert("링크가 복사되었습니다!");
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([...comments, {
      id: Date.now(),
      author: "사용자",
      text: commentText,
      time: "방금 전"
    }]);
    setCommentText("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col md:items-center justify-end md:justify-center bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full h-[90vh] md:max-w-4xl bg-background md:rounded-3xl overflow-hidden border-t md:border border-border shadow-2xl flex flex-col md:h-[85vh] rounded-t-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-border shrink-0 bg-background sticky top-0 z-10">
            <h2 className="text-lg md:text-xl font-black text-white line-clamp-1 pr-4">{post.title}</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
            {/* Video Placeholder Area */}
            <div className="w-full aspect-video bg-black relative flex items-center justify-center shrink-0">
              <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <button className="w-14 h-14 md:w-16 md:h-16 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-110 transition-transform">
                  <Play size={24} className="ml-1 md:w-8 md:h-8" />
                </button>
              </div>
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
                    <Heart size={20} className={isLiked ? "fill-rose-500 text-rose-500" : ""} />
                    <span className="text-sm font-bold text-white">{likeCount}</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors p-2">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              <div className="prose prose-invert max-w-none border-b border-border pb-8">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                  {post.description}
                </p>
              </div>

              {/* Comments Section */}
              <div className="pt-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  댓글 <span className="text-slate-400 text-sm font-normal">{comments.length}</span>
                </h3>

                <div className="space-y-5 mb-8">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary shrink-0 border border-border flex items-center justify-center font-bold text-xs text-white">
                        {comment.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{comment.author}</span>
                          <span className="text-[10px] text-slate-500">{comment.time}</span>
                        </div>
                        <p className="text-sm text-slate-300">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                disabled={!commentText.trim()}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
              >
                <Send size={18} className="-ml-0.5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
