"use client";

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, ThumbsUp, User, Share2, AlertCircle, CheckCircle2, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ReportModal } from '@/components/common/ReportModal';
import { UserProfileModal } from '@/components/common/UserProfileModal';

type PollOption = {
  id: string;
  text: string;
  votes: number;
  isVoted?: boolean;
};

type PollData = {
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
};

type PostData = {
  id: string; title: string; content: string; author: string; date: string; likes: number; comments: number; tag: string; board: string; img?: string; poll?: PollData;
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
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const post = MOCK_POSTS[id as keyof typeof MOCK_POSTS] || MOCK_POSTS['1'];
  
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string | number; name: string; image?: string } | null>(null);
  const [poll, setPoll] = useState<PollData | undefined>(post.poll);
  
  const handleVote = (optionId: string) => {
    if (!poll) return;
    
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
  };
  
  const handleBack = () => {
    // If we can't go back safely, go to community board
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/community/free');
    }
  };

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
          <button onClick={() => setReportModalOpen(true)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-white/10"><AlertCircle size={20}/></button>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto p-6 md:p-8 w-full text-left flex-1">
        <h1 className="text-2xl md:text-3xl font-black text-white leading-snug mb-6">{post.title}</h1>
        
        <div className="flex justify-between items-center pb-6 border-b border-border/50 mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setSelectedUser({ id: post.author, name: post.author })}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-background overflow-hidden p-0.5 shadow-sm group-hover:border-primary/50 transition-colors">
              <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center">
                <User size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{post.author}</span>
              <span className="text-xs text-slate-500">{post.date}</span>
            </div>
          </div>
        </div>
        
        <div className="prose prose-invert max-w-none text-slate-300 text-base md:text-lg leading-loose whitespace-pre-wrap mb-12">
          {post.content}
        </div>
        
        {post.img && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-border">
            <img src={`https://picsum.photos/seed/${post.img}/800/600`} className="w-full h-auto" alt="게시글 첨부" />
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
                    {/* Background Progress Bar */}
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
            onClick={() => setIsLiked(!isLiked)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors", isLiked ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-border text-slate-400 hover:bg-slate-800 hover:text-white")}
          >
            <ThumbsUp size={16} className={isLiked ? "fill-primary" : ""} />
            <span className="text-sm font-bold">{isLiked ? post.likes + 1 : post.likes}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary border border-border text-slate-400 cursor-default">
            <MessageSquare size={16} /> 3
          </button>
        </div>

        {/* Comments Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">댓글 <span className="text-primary">{post.comments}</span></h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div 
              className="w-8 h-8 rounded-full bg-slate-800 border border-border shrink-0 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedUser({ id: '음악하는사람', name: '음악하는사람' })}
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedUser({ id: '음악하는사람', name: '음악하는사람' })}
                >
                  <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">음악하는사람</span>
                  <span className="text-[10px] text-slate-500">방금 전</span>
                </div>
              </div>
              <p className="text-sm text-slate-300">정말 멋지네요! 응원합니다 🙏</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border mt-1 shadow-inner overflow-hidden" />
            <div className="flex-1 border border-border rounded-xl bg-background overflow-hidden focus-within:border-primary transition-colors pr-2">
              <textarea 
                rows={2} 
                className="w-full bg-transparent text-sm text-white resize-none p-4 placeholder-slate-500 outline-none" 
                placeholder="댓글을 남겨보세요..."
              ></textarea>
              <div className="flex justify-end pb-2">
                <button className="bg-primary hover:bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
                  등록
                </button>
              </div>
            </div>
        </div>

      </main>
      
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} targetName="게시글" />
      
      <UserProfileModal 
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
        userImage={selectedUser?.image}
      />
    </div>
  );
}
