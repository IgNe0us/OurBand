import re

with open('E:/BandProject/OurBand/front/ourband/components/jam/AudioJamModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Imports
imports_target = """import { addHistoryCommentApi, increaseHistoryShareApi, toggleHistoryLikeApi } from "@/api/account/userService";
import { apiClient } from "@/api/baseApi";
import { useUserProfile } from "@/store/userProfileContext";
import { toggleJamLikeApi, getJamCommentsApi, createJamCommentApi, incrementJamShareApi } from "@/api/jam/jamService";"""
imports_replacement = """import { addHistoryCommentApi, updateHistoryCommentApi, deleteHistoryCommentApi, increaseHistoryShareApi, toggleHistoryLikeApi, getUserInfoApi } from "@/api/account/userService";
import { apiClient } from "@/api/baseApi";
import { useUserProfile } from "@/store/userProfileContext";
import { toggleJamLikeApi, getJamCommentsApi, createJamCommentApi, updateJamCommentApi, deleteJamCommentApi, incrementJamShareApi } from "@/api/jam/jamService";"""
content = content.replace(imports_target, imports_replacement)

# 2. Add States
state_target = """  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  
  const [commentText, setCommentText] = useState("");
  // 💡 히스토리인 경우 더미 댓글 배열을 비워둠으로써 실시간 카운트 동기화 방해를 막습니다.
  const [comments, setComments] = useState<any[]>([]);"""
state_replacement = """  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number, author: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: number, text: string } | null>(null);"""
content = content.replace(state_target, state_replacement)

# 3. Add useEffect currentUserId
effect_target = """  useEffect(() => {
    if (isOpen && post) {
      setIsPlaying(false);"""
effect_replacement = """  useEffect(() => {
    if (isOpen && post) {
      getUserInfoApi().then(res => { if(res?.userId) setCurrentUserId(res.userId); }).catch(console.error);
      setIsPlaying(false);"""
content = content.replace(effect_target, effect_replacement)

# 4. Handle comment formatting and recursive rendering mapping
get_comments_target = """        if (isJam) {
          getJamCommentsApi(post.id)
            .then(res => {
              const mapped = res.map((c: any) => ({
                id: c.id,
                author: c.authorName,
                avatar: c.authorProfileImageUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt)
              }));
              setComments(mapped);
            })"""
get_comments_replacement = """        if (isJam) {
          getJamCommentsApi(Number(post.id))
            .then(res => {
              const mapComment = (c: any): any => ({
                id: c.id,
                author: c.authorName || c.author,
                authorId: c.authorId || c.userId,
                avatar: c.authorProfileImageUrl || c.profilePictureUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt),
                replies: c.replies ? c.replies.map(mapComment) : []
              });
              setComments(res.map(mapComment));
            })"""
content = content.replace(get_comments_target, get_comments_replacement)

get_history_target = """        } else {
          apiClient.get(`/users/history/${post.id}/comments`)
            .then(res => {
              const mapped = res.data.map((c: any) => ({
                id: c.id,
                author: c.author,
                avatar: c.profilePictureUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt)
              }));
              setComments(mapped);
            })"""
get_history_replacement = """        } else {
          apiClient.get(`/users/history/${post.id}/comments`)
            .then(res => {
              const mapComment = (c: any): any => ({
                id: c.id,
                author: c.authorName || c.author,
                authorId: c.authorId || c.userId,
                avatar: c.authorProfileImageUrl || c.profilePictureUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt),
                replies: c.replies ? c.replies.map(mapComment) : []
              });
              setComments(res.data.map(mapComment));
            })"""
content = content.replace(get_history_target, get_history_replacement)

# 5. Fix TS Error post.id
content = content.replace("toggleJamLikeApi(post.id)", "toggleJamLikeApi(Number(post.id))")
content = content.replace("createJamCommentApi(post.id,", "createJamCommentApi(Number(post.id),")
content = content.replace("incrementJamShareApi(post.id)", "incrementJamShareApi(Number(post.id))")

# 6. handleAddComment to support reply, edit, delete
handle_add_target = """  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      if (isJam) {
        const savedComment = await createJamCommentApi(post.id, { content: commentText.trim() });
        setComments(prev => [
          { 
            id: savedComment.id, 
            author: savedComment.authorName, 
            avatar: savedComment.authorProfileImageUrl || "",
            text: savedComment.content, 
            time: "방금 전" 
          },
          ...prev
        ]);
        setLocalCommentCount(prev => prev + 1);
      } else {
        // 서버에 댓글 저장 요청
        const savedComment = await addHistoryCommentApi(post.id, commentText.trim());
        
        // 서버가 리턴해준 진짜 데이터 형식으로 추가
        setComments(prev => [
          { 
            id: savedComment.id, 
            author: savedComment.author, 
            avatar: savedComment.profilePictureUrl || "",
            text: savedComment.content, 
            time: "방금 전" 
          },
          ...prev
        ]);
        setLocalCommentCount(prev => prev + 1);
      }
      setCommentText("");
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    }
  };"""
handle_add_replacement = """  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      if (isJam) await deleteJamCommentApi(Number(post.id), commentId);
      else await deleteHistoryCommentApi(post.id, commentId);
      
      const removeComment = (list: any[]): any[] => {
        return list.filter(c => c.id !== commentId).map(c => ({...c, replies: c.replies ? removeComment(c.replies) : []}));
      };
      setComments(prev => removeComment(prev));
      setLocalCommentCount(prev => Math.max(0, prev - 1));
    } catch (e) { alert("삭제 실패"); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      if (editingComment) {
        let savedComment;
        if (isJam) savedComment = await updateJamCommentApi(Number(post.id), editingComment.id, { content: commentText.trim() });
        else savedComment = await updateHistoryCommentApi(post.id, editingComment.id, commentText.trim());
        
        const updateList = (list: any[]): any[] => list.map(c => c.id === editingComment.id ? { ...c, text: commentText.trim() } : { ...c, replies: c.replies ? updateList(c.replies) : [] });
        setComments(prev => updateList(prev));
        setEditingComment(null);
      } else {
        let savedComment;
        if (isJam) savedComment = await createJamCommentApi(Number(post.id), { content: commentText.trim(), parentId: replyingTo?.id });
        else savedComment = await addHistoryCommentApi(post.id, commentText.trim(), replyingTo?.id);
        
        const newC = { 
          id: savedComment.id, 
          author: savedComment.authorName || savedComment.author, 
          authorId: savedComment.authorId || savedComment.userId,
          avatar: savedComment.authorProfileImageUrl || savedComment.profilePictureUrl || "",
          text: savedComment.content, 
          time: "방금 전",
          replies: []
        };
        
        if (replyingTo) {
          const addReply = (list: any[]): any[] => list.map(c => c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), newC] } : { ...c, replies: c.replies ? addReply(c.replies) : [] });
          setComments(prev => addReply(prev));
        } else {
          setComments(prev => [newC, ...prev]);
        }
        setLocalCommentCount(prev => prev + 1);
        setReplyingTo(null);
      }
      setCommentText("");
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    }
  };"""
content = content.replace(handle_add_target, handle_add_replacement)

# 7. Recursive render method & render call
render_comments_target = """                  <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    {comments.map((c, idx) => (
                      <div key={`comment-${c.id}-${idx}`} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border flex items-center justify-center overflow-hidden">
                            {c.avatar ? (
                              <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-slate-500" />
                            )}
                          </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-300">{c.author}</span>
                            <span className="text-[10px] text-slate-500">{c.time}</span>
                          </div>
                          <p className="text-sm text-white">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>"""

render_comments_replacement = """                  <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    {(() => {
                      const renderComment = (c: any, isReply: boolean = false) => (
                        <div key={`comment-${c.id}`} className={cn("flex gap-3 group", isReply ? "mt-3 ml-8 relative before:absolute before:-left-5 before:top-4 before:w-4 before:h-px before:bg-border before:content-['']" : "")}>
                            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border flex items-center justify-center overflow-hidden">
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="text-slate-500" />
                              )}
                            </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-300">{c.author}</span>
                                <span className="text-[10px] text-slate-500">{c.time}</span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                {c.authorId === currentUserId && (
                                  <>
                                    <button onClick={() => {setEditingComment({ id: c.id, text: c.text }); setCommentText(c.text); setReplyingTo(null);}} className="text-[10px] text-slate-400 hover:text-white">수정</button>
                                    <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-slate-400 hover:text-red-500">삭제</button>
                                  </>
                                )}
                                {!isReply && (
                                  <button onClick={() => {setReplyingTo({ id: c.id, author: c.author }); setEditingComment(null); setCommentText('');}} className="text-[10px] text-slate-400 hover:text-primary">답글 달기</button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-white break-all">{c.text}</p>
                            
                            {/* Replies */}
                            {c.replies && c.replies.length > 0 && (
                              <div className="mt-2">
                                {c.replies.map((reply: any) => renderComment(reply, true))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      return comments.map(c => renderComment(c, false));
                    })()}
                  </div>"""
content = content.replace(render_comments_target, render_comments_replacement)

# 8. Add Reply / Edit indicator
input_target = """                  <div className="p-4 bg-background border-t border-border shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex items-center bg-secondary rounded-full px-4 py-2 border border-border w-full">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="댓글 남기기..." 
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none py-1"
                      />"""

input_replacement = """                  <div className="p-4 bg-background border-t border-border shrink-0">
                    {(replyingTo || editingComment) && (
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs text-primary">
                          {replyingTo ? `@${replyingTo.author}님에게 답글 남기는 중` : `댓글 수정 중`}
                        </span>
                        <button onClick={() => { setReplyingTo(null); setEditingComment(null); setCommentText(''); }} className="text-xs text-slate-400 hover:text-white">취소</button>
                      </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex items-center bg-secondary rounded-full px-4 py-2 border border-border w-full">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={replyingTo ? "답글 남기기..." : "댓글 남기기..."} 
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none py-1"
                      />"""
content = content.replace(input_target, input_replacement)

# Active comment modal close should also reset
close_target = """                <motion.div key="jam-modal-comment" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveCommentId(null)}
              >"""
close_replacement = """                <motion.div key="jam-modal-comment" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => { setActiveCommentId(null); setReplyingTo(null); setEditingComment(null); setCommentText(''); }}
              >"""
content = content.replace(close_target, close_replacement)

close_btn_target = """<button onClick={() => setActiveCommentId(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>"""
close_btn_replacement = """<button onClick={() => { setActiveCommentId(null); setReplyingTo(null); setEditingComment(null); setCommentText(''); }} className="text-slate-400 hover:text-white"><X size={20}/></button>"""
content = content.replace(close_btn_target, close_btn_replacement)


with open('E:/BandProject/OurBand/front/ourband/components/jam/AudioJamModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
