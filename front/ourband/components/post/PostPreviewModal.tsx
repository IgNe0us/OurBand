"use client";
// @ts-nocheck
import { X, User, ThumbsUp, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface PostData {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tag: string;
  likes: number;
  comments: number;
}

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostData | null;
}

export function PostPreviewModal({ isOpen, onClose, post }: PostPreviewModalProps) {
  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-secondary rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border/50 shrink-0">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{post.tag}</span>
              상세 보기
            </h3>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors bg-secondary rounded-full hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6 text-left">
            <h2 className="text-xl md:text-2xl font-black text-white leading-snug">
              {post.title}
            </h2>
            
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-border flex items-center justify-center">
                   <User size={16} className="text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{post.author}</span>
                  <span className="text-xs text-slate-500">{post.date}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-sm md:text-base text-slate-300 leading-loose whitespace-pre-wrap">
              {post.content}
            </div>
            
            <div className="flex items-center gap-4 pt-6 mt-6 border-t border-border text-slate-400">
              <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-sm">
                <ThumbsUp size={16} /> {post.likes}
              </span>
              <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-sm">
                <MessageSquare size={16} /> {post.comments}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
