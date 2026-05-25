
import { BandPreviewData } from "@/components/band/BandPreviewModal";

export const MOCK_TRENDING_BANDS: BandPreviewData[] = [
  {
    id: 1,
    name: "Neon Dreams",
    genre: "신스팝 / 인디록",
    coverImage: "https://picsum.photos/seed/band1/400/300",
    logoImage: "https://picsum.photos/seed/logo1/100/100",
    location: "서울 마포구 상수동",
    frequency: "월 2회",
    tags: ["#신스팝", "#인디록", "#자작곡", "#합주"],
    description: "토요일 합주 가능하신 신디사이저 모십니다.\n현재 자작곡 2곡 준비중이며 하반기 클럽 공연이 목표입니다.\n\n합을 맞추는 재미를 아시는 분, 성실하게 오래 함께하실 분을 찾고 있습니다!",
    videos: [
      {
        id: "v1",
        title: "Oasis - Don't Look Back In Anger (Cover)",
        date: "2023.11.20",
        thumbnail: "https://picsum.photos/seed/oasis1/800/450",
        description: "저번 주말 합주 때 맞춰본 오아시스 커버곡입니다.\n아직 기타 솔로 부분은 조금 더 다듬어야겠지만, 전체적인 합은 꽤 잘 맞는 것 같아요!"
      },
      {
        id: "v2",
        title: "Radiohead - Creep (합주실 라이브)",
        date: "2023.10.15",
        thumbnail: "https://picsum.photos/seed/radiohead1/800/450",
        description: "톤 잡는데 시간 꽤 썼는데 결과물이 좋네요!\n영상 한 번씩 모니터링 해주시고 피드백 있으면 댓글 남겨주세요."
      }
    ],
    members: [
      { role: "보컬/기타", name: "최진혁", isRecruiting: false },
      { role: "베이스", name: "이민수", isRecruiting: false },
      { role: "드럼", name: "김태양", isRecruiting: false },
      { role: "건반", name: "", isRecruiting: true }
    ],
    history: [
      { id: "1", date: "2023.11", title: "하반기 클럽 FF 정기공연" },
      { id: "2", date: "2023.08", title: "첫 번째 자작곡 'Neon Lights' 데모 완성" },
      { id: "3", date: "2023.01", title: "밴드 결성" }
    ]
  },
  {
    id: 2,
    name: "Acoustic Vibe",
    genre: "어쿠스틱 / 포크",
    coverImage: "https://picsum.photos/seed/band2/400/300",
    logoImage: "https://picsum.photos/seed/logo2/100/100",
    location: "서울 강남구 역삼동",
    frequency: "주 1회",
    tags: ["#어쿠스틱", "#취미밴드", "#잔잔한음악", "#보컬모집"],
    description: "퇴근 후 가볍게 어쿠스틱 잼을 즐기는 직장인 밴드입니다.\n장범준, 10cm 등 어쿠스틱 셋 음악 위주로 카피하고 있습니다.\n마음 편하게 음악하실 분 환영합니다!",
    videos: [
      {
        id: "v3",
        title: "벚꽃엔딩 - 어쿠스틱 잼",
        date: "2024.03.15",
        thumbnail: "https://picsum.photos/seed/cherry/800/450",
        description: "봄맞이 벚꽃엔딩 잼 영상입니다! 분위기 너무 좋았어요~"
      }
    ],
    members: [
      { role: "기타", name: "박지훈", isRecruiting: false },
      { role: "건반", name: "김소연", isRecruiting: false },
      { role: "퍼커션", name: "정재민", isRecruiting: false },
      { role: "목소리", name: "", isRecruiting: true }
    ],
    history: [
      { id: "4", date: "2024.01", title: "어쿠스틱 잼 데이 행사 참여" },
      { id: "5", date: "2023.06", title: "밴드 결성" }
    ]
  },
  {
    id: 3,
    name: "Metal Core",
    genre: "헤비메탈 / 하드록",
    coverImage: "https://picsum.photos/seed/band3/400/300",
    logoImage: "https://picsum.photos/seed/logo3/100/100",
    location: "서울 마포구 연남동",
    frequency: "월 4회",
    tags: ["#헤비메탈", "#경력자우대", "#강렬한사운드"],
    description: "메탈리카, 슬립낫 풀 카피 가능하신 베이시스트 찾습니다.\n합주 퀄리티를 중시하며, 추후 음반 작업도 고려하고 있습니다.\n\n확실한 실력과 열정을 가진 분들의 지원을 기다립니다.",
    videos: [
      {
        id: "v4",
        title: "Master of Puppets (Cover)",
        date: "2023.11.01",
        thumbnail: "https://picsum.photos/seed/metal1/800/450",
        description: "지난주 홍대 프리버드 합주 영상입니다. 템포 조금만 더 당깁시다!"
      }
    ],
    members: [
      { role: "보컬", name: "강동원", isRecruiting: false },
      { role: "리드기타", name: "최수정", isRecruiting: false },
      { role: "리듬기타", name: "이현우", isRecruiting: false },
      { role: "드럼", name: "박성호", isRecruiting: false },
      { role: "베이스", name: "", isRecruiting: true }
    ],
    history: [
      { id: "6", date: "2023.12", title: "연말 메탈 페스티벌 기획 및 주최" },
      { id: "7", date: "2023.05", title: "홍대 롤링홀 단독 공연" },
      { id: "8", date: "2021.03", title: "밴드 결성" }
    ]
  },
  {
    id: 4,
    name: "The Velvet Sound",
    genre: "R&B / Soul",
    coverImage: "https://picsum.photos/seed/band4/400/300",
    logoImage: "https://picsum.photos/seed/logo4/100/100",
    location: "서울 용산구 이태원동",
    frequency: "격주 1회",
    tags: ["#R&B", "#소울", "#직장인밴드"],
    description: "흑인 음악 기반의 소울풀한 연주를 지향합니다. 그루브 있는 베이시스트 한 분 모십니다.",
    videos: [],
    members: [
      { role: "보컬", name: "김형준", isRecruiting: false },
      { role: "건반", name: "박서아", isRecruiting: false },
      { role: "베이스", name: "이태환", isRecruiting: false }
    ],
    history: []
  },
  {
    id: 5,
    name: "Blue Night",
    genre: "재즈 블루스",
    coverImage: "https://picsum.photos/seed/band5/400/300",
    logoImage: "https://picsum.photos/seed/logo5/100/100",
    location: "서울 종로구 혜화동",
    frequency: "주 2회",
    tags: ["#재즈", "#블루스", "#즉흥연주"],
    description: "즉흥 연주의 묘미를 함께 나눌 실력파 즉흥 솔로 악기(색소폰 등) 구합니다.",
    videos: [],
    members: [
      { role: "피아노", name: "이준", isRecruiting: false },
      { role: "더블베이스", name: "최진우", isRecruiting: false },
      { role: "드럼", name: "정다은", isRecruiting: false },
      { role: "솔로악기", name: "", isRecruiting: true }
    ],
    history: []
  },
  {
    id: 6,
    name: "Cyber Punkz",
    genre: "일렉트로닉 / 록",
    coverImage: "https://picsum.photos/seed/band6/400/300",
    logoImage: "https://picsum.photos/seed/logo6/100/100",
    location: "경기 성남시 판교동",
    frequency: "월 2회",
    tags: ["#사이버펑크", "#일렉트로니카"],
    description: "신디사이저와 록 사운드의 결합을 실험하는 프로젝트 밴드입니다.",
    videos: [],
    members: [
      { role: "프로듀서", name: "조원희", isRecruiting: false },
      { role: "기타", name: "김수현", isRecruiting: false },
      { role: "미디/DJ", name: "최진호", isRecruiting: false }
    ],
    history: []
  },
  {
    id: 7,
    name: "Groove Rider",
    genre: "펑크 (Funk)",
    coverImage: "https://picsum.photos/seed/band7/400/300",
    logoImage: "https://picsum.photos/seed/logo7/100/100",
    location: "서울 송파구 잠실동",
    frequency: "주 1회",
    tags: ["#펑크", "#합주", "#슬랩장인"],
    description: "찰진 리듬감과 슬랩 베이스를 사랑하는 그루브 밴드입니다.",
    videos: [],
    members: [
      { role: "기타", name: "이도현", isRecruiting: false },
      { role: "드럼", name: "한민석", isRecruiting: false },
      { role: "보컬", name: "송지은", isRecruiting: false },
      { role: "브라스", name: "", isRecruiting: true }
    ],
    history: []
  },
  {
    id: 8,
    name: "Indie Cats",
    genre: "모던 록",
    coverImage: "https://picsum.photos/seed/band8/400/300",
    logoImage: "https://picsum.photos/seed/logo8/100/100",
    location: "서울 서대문구 창천동",
    frequency: "월 4회",
    tags: ["#모던록", "#청량한사운드"],
    description: "오아시스, 델리스파이스 등 청량하고 대중적인 모던 록 카피 밴드입니다. 드럼 초보도 환영합니다.",
    videos: [],
    members: [
      { role: "보컬기타", name: "류현", isRecruiting: false },
      { role: "베이스", name: "문선영", isRecruiting: false },
      { role: "드럼", name: "박진구", isRecruiting: false }
    ],
    history: []
  },
  {
    id: 9,
    name: "Storm Bringers",
    genre: "하드코어 펑크",
    coverImage: "https://picsum.photos/seed/band9/400/300",
    logoImage: "https://picsum.photos/seed/logo9/100/100",
    location: "서울 강동구 천호동",
    frequency: "무정기",
    tags: ["#하드코어", "#과격한무대"],
    description: "미친 듯이 달리는 하드코어 펑크 밴드입니다. 함께 땀 흘릴 스크리밍 보컬 구함!",
    videos: [],
    members: [
      { role: "드럼", name: "곽태준", isRecruiting: false },
      { role: "기타", name: "백기호", isRecruiting: false },
      { role: "보컬", name: "", isRecruiting: true }
    ],
    history: []
  }
];


  