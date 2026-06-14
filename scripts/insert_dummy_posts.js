const fs = require('fs');

const userMap = {
    '관리자': 4,
    '홍대불꽃기타': 5,
    'gunsoup': 7,
    '서비스관리자': 8,
    'netid002': 9,
    'IgNeous': 10,
    '음악가': 11,
    'BassLine31': 12,
    'JazzCat92': 13,
    'DrumAddict80': 14
};

const boards = [
    {
        boardType: '자유게시판',
        posts: [
            { title: "요즘 홍대 합주실 대여비 너무 비싸지 않나요? ㅠㅠ", content: "예전엔 1시간에 만원대면 충분했는데 요새는 기본이 2만원이 넘어가네요.. 다들 어디로 다니시나요?", author: "BassLine31", comments: [{author: "홍대불꽃기타", content: "맞아요 진짜 너무 올랐어요.. 저희는 아예 외곽으로 빠집니다."}, {author: "JazzCat92", content: "합정 쪽에 시설은 낡았지만 가격 착한 곳 하나 알아요. 쪽지 드림!"}] },
            { title: "어제 펜타포트 락 페스티벌 다녀오신 분? 슬램존 역대급 ㅋㅋㅋ", content: "진짜 미친듯이 놀다 왔습니다. 어제 깃발 들고 계셨던 분 계신가요?", author: "IgNeous", comments: [{author: "gunsoup", content: "헐 저도 갔는데 모래먼지 다 마시고 옴 ㅋㅋ"}, {author: "음악가", content: "혹시 어제 셋리스트 기억나시는 분 있나요?"}] },
            { title: "직장인 밴드 회식 메뉴 추천 좀요", content: "매번 삼겹살만 먹으니까 질리네요. 합주 끝나고 가기 좋은 메뉴 뭐 있을까요?", author: "DrumAddict80", comments: [{author: "관리자", content: "치맥이 진리 아닐까요?"}, {author: "netid002", content: "저희는 합주 끝나면 항상 국밥 먹습니다 ㅋㅋ"}] },
            { title: "이번 주말에 뮬(Mule) 직거래하러 갑니다", content: "꾹꾹이 페달 하나 건지러 대전까지 가네요. 제발 상태 좋았으면!", author: "gunsoup", comments: [{author: "홍대불꽃기타", content: "오 무슨 페달 사시나요?"}, {author: "JazzCat92", content: "직거래는 무조건 현장에서 노브 다 돌려보셔야 해요!"}] },
            { title: "요즘 밴드 음악 추천 좀 해주세요", content: "맨날 듣던 것만 들어서 질리네요. 브릿팝이나 얼터너티브 쪽으로 숨은 명곡 있을까요?", author: "netid002", comments: [{author: "음악가", content: "요즘 실리카겔 음악 너무 좋더라고요. 들어보세요!"}, {author: "BassLine31", content: "라디오헤드 B사이드 트랙들 쭉 들어보시는 거 추천합니다."}] },
            { title: "메트로놈 앱 어떤 거 쓰시나요?", content: "무료 앱 쓰는데 자꾸 광고 떠서 짜증나네요 ㅠㅠ", author: "DrumAddict80", comments: [{author: "IgNeous", content: "저는 Soundbrenner 쓰는데 꽤 괜찮아요."}, {author: "gunsoup", content: "아예 하드웨어 메트로놈 하나 장만하는 게 속 편합니다."}] },
            { title: "공연장 대관료 질문드립니다", content: "100명 규모 클럽 대관하려고 하는데 보통 주말 저녁이면 얼마 정도 하나요?", author: "관리자", comments: [{author: "홍대불꽃기타", content: "홍대 기준이면 보통 150~200 정도 불렀던 것 같아요."}, {author: "JazzCat92", content: "음향 엔지니어 포함인지 아닌지 꼭 확인하세요!"}] },
            { title: "오아시스 재결합 진짜인가요? ㄷㄷ", content: "루머만 돌더니 이번엔 진짜라는 기사가 떴네요. 내한 오면 무조건 갑니다.", author: "IgNeous", comments: [{author: "gunsoup", content: "매번 나오는 루머라 이제 안 믿습니다 ㅋㅋㅋ"}, {author: "netid002", content: "진짜면 티켓팅 피터지겠네요."}] },
            { title: "밴드 이름 짓기 너무 어렵네요", content: "3주째 아이디어만 내고 결정을 못하고 있습니다. 다들 밴드 이름 어떻게 지으셨나요?", author: "BassLine31", comments: [{author: "음악가", content: "합주 끝나고 밥 먹은 식당 이름으로 대충 지었어요 ㅋㅋ"}, {author: "DrumAddict80", content: "멤버들 이름 이니셜 합치는 게 제일 무난합니다."}] },
            { title: "비오는 날 합주하러 가기 너무 귀찮음", content: "이펙터 보드 들고 우산 쓰고 가려니 벌써부터 막막하네요.", author: "홍대불꽃기타", comments: [{author: "IgNeous", content: "차 없는 뚜벅이 기타리스트의 슬픔이죠 ㅠㅠ"}, {author: "JazzCat92", content: "긱백에 방수 커버 꼭 씌우세요!"}] },
            { title: "우리 밴드 보컬이 갑자기 탈퇴한다고 합니다..", content: "다음 달이 공연인데 갑자기 잠수타버렸네요. 멘붕입니다.", author: "관리자", comments: [{author: "gunsoup", content: "헐.. 위로의 말씀을 드립니다. 급하게 객원 보컬이라도 구해보세요."}, {author: "BassLine31", content: "이런 무책임한 사람들 진짜 너무 싫어요 ㅡㅡ"}] },
            { title: "기타줄 어떤 브랜드 주로 쓰시나요?", content: "맨날 다다리오만 쓰다가 엘릭서로 넘어가볼까 고민 중입니다.", author: "netid002", comments: [{author: "홍대불꽃기타", content: "엘릭서 수명이 압도적이라 길게 보면 이득이에요."}, {author: "IgNeous", content: "저는 어니볼 특유의 찰랑거리는 새 줄 소리가 좋아서 자주 갈아줍니다."}] },
            { title: "유튜브에 커버 영상 올리려는데 저작권 문제 없나요?", content: "수익 창출은 안 할 건데 그냥 올려도 되는지 궁금합니다.", author: "음악가", comments: [{author: "관리자", content: "보통은 수익이 원작자에게 가는 조건으로 업로드 허용됩니다!"}, {author: "DrumAddict80", content: "특정 국가 차단 걸리는 곡들만 피하시면 돼요."}] },
            { title: "베이시스트 구하기가 하늘의 별따기네요", content: "기타랑 드럼은 넘쳐나는데 베이스가 없어서 합주를 못하고 있습니다 ㅠㅠ", author: "gunsoup", comments: [{author: "BassLine31", content: "베이시스트 귀한 건 어딜 가나 똑같군요 ㅋㅋ"}, {author: "IgNeous", content: "뮬 구인구직 게시판에 하루에 한 번씩 올려보세요."}] },
            { title: "공연 포스터 직접 만드시나요?", content: "포토샵 할 줄 아는 멤버가 없어서 걱정이네요.", author: "JazzCat92", comments: [{author: "netid002", content: "요즘은 미리캔버스나 캔바 같은 걸로 대충 만들어도 예쁘게 나와요."}, {author: "홍대불꽃기타", content: "크몽 같은 데서 싼 값에 외주 맡기는 것도 추천합니다."}] },
            { title: "요즘 릴스에 뜨는 밴드들 진짜 실력 좋네요", content: "보면서 반성 많이 하고 갑니다. 연습하러 가야지..", author: "DrumAddict80", comments: [{author: "관리자", content: "요즘 어린 친구들 진짜 잘 치더라고요. 자극 팍팍 됩니다."}] },
            { title: "앰프 시뮬레이터 vs 진짜 앰프", content: "라이브 할 때 무겁게 앰프 들고 다니기 벅차서 쿼드코어텍스 같은 거 고민 중입니다.", author: "IgNeous", comments: [{author: "홍대불꽃기타", content: "요즘 시뮬레이터 기술이 워낙 좋아서 라이브에선 큰 차이 못 느껴요!"}, {author: "BassLine31", content: "그래도 등 뒤에서 때려주는 진짜 앰프의 댐핑감은 포기 못하죠."}] },
            { title: "기타 솔로 연습 꿀팁 있나요?", content: "크로매틱만 주구장창 하려니 지루해서 미치겠습니다.", author: "netid002", comments: [{author: "음악가", content: "좋아하는 곡 솔로 파트 느리게 틀어놓고 카피하는 게 직빵입니다."}] },
            { title: "이번 주 홍대 클럽 공연 라인업 미쳤네요", content: "롤링홀 라인업 보셨나요? 이번 주말은 여기로 정했습니다.", author: "gunsoup", comments: [{author: "JazzCat92", content: "오 저도 갈 예정인데 현장에서 뵙겠네요 ㅋㅋ"}] },
            { title: "다들 밴드 연습 말고 개인 연습은 얼마나 하시나요?", content: "직장 다니면서 하루에 1시간 내기도 힘드네요 ㅠㅠ", author: "관리자", comments: [{author: "DrumAddict80", content: "패드 하나 사서 티비 보면서 툭툭 치는 게 전부입니다.."}, {author: "IgNeous", content: "주말에 몰아서 4-5시간씩 하고 평일엔 손가락만 풀어요."}] },
        ]
    },
    {
        boardType: '고민상담',
        posts: [
            { title: "보컬이 고음이 안 올라가서 고민입니다. 계속 해도 될까요?", content: "밴드 시작 6개월차인데 2옥 라만 넘어도 목이 조여옵니다.. 보컬 바꿀까요?", author: "gunsoup", comments: [{author: "음악가", content: "보컬은 고음이 다가 아닙니다! 음색이 매력있으면 충분해요."}, {author: "BassLine31", content: "키 낮춰서 부르는 건 어때요?"}] },
            { title: "베이스 치는데 손가락 물집이 안 사라져요..", content: "슬랩 연습하면서 물집이 계속 터집니다. 원래 이런가요?", author: "BassLine31", comments: [{author: "홍대불꽃기타", content: "굳은살 완전 배길 때까지 버티셔야 합니다! 화이팅!"}, {author: "DrumAddict80", content: "상처 나을 때까진 피크로 쳐보세요."}] },
            { title: "밴드 내에 연애하는 멤버가 생겼습니다", content: "기타랑 키보드가 비밀 연애하다 걸렸는데, 깨지면 밴드 터질까봐 조마조마하네요.", author: "IgNeous", comments: [{author: "관리자", content: "아.. 사내연애보다 무섭다는 밴드내 연애 ㅠㅠ 무사하시길 빕니다."}, {author: "netid002", content: "저희 밴드도 그러다 결국 베이스랑 보컬 나갔어요 흑흑"}] },
            { title: "드럼 치는데 박자감이 너무 안 좋아요", content: "메트로놈 켜고 연습해도 합주만 들어가면 빨라집니다. 드러머 자격이 없는 걸까요?", author: "DrumAddict80", comments: [{author: "JazzCat92", content: "흥분해서 그래요! 합주 때 인이어로 메트로놈 들으면서 치는 연습 해보세요."}, {author: "음악가", content: "처음엔 다 그렇습니다. 녹음해서 들어보면서 피드백하는 게 중요해요."}] },
            { title: "자작곡을 쓰고 싶은데 화성학을 꼭 알아야 하나요?", content: "코드는 대충 치는데 이론을 하나도 몰라서 진행이 뻔해집니다.", author: "netid002", comments: [{author: "홍대불꽃기타", content: "알면 좋지만 필수는 아닙니다! 비틀즈도 화성학 모르고 명곡 썼어요."}, {author: "관리자", content: "유튜브에 기초 화성학 영상 1시간짜리만 봐도 곡 쓰는데 훨씬 도움됩니다."}] },
            { title: "직장인 밴드, 합주 불참하는 멤버 어떻게 할까요?", content: "야근 핑계 대면서 한 달에 두 번이나 빠지는 멤버가 있는데 내보내야 할까요?", author: "관리자", comments: [{author: "gunsoup", content: "직장인 밴드는 어쩔 수 없어요. 대타 멤버 풀을 만들어두는 게 현실적입니다."}, {author: "IgNeous", content: "한 번 진지하게 커피 마시면서 얘기 나눠보세요. 의지가 중요하니까요."}] },
            { title: "30대 중반, 뒤늦게 기타 시작해도 될까요?", content: "어릴 때 로망이었는데 이제야 여유가 생기네요. 손이 굳었을까 걱정입니다.", author: "음악가", comments: [{author: "JazzCat92", content: "음악에 늦은 나이는 없습니다! 지금 당장 학원 등록하세요!"}, {author: "BassLine31", content: "저도 40에 시작해서 지금 인디 밴드 2개 뛰고 있습니다 ㅎㅎ"}] },
            { title: "장비병 걸린 것 같습니다. 통장 잔고가 남아나질 않아요", content: "멀티이펙터 샀다가 아날로그가 좋아보여서 또 사고.. 미치겠네요.", author: "홍대불꽃기타", comments: [{author: "netid002", content: "뮬 끊으세요. 뮬부터 지우셔야 병이 낫습니다 ㅋㅋㅋ"}, {author: "DrumAddict80", content: "그게 다 톤을 찾아가는 과정입니다 (합리화)"}] },
            { title: "무대 공포증이 너무 심합니다. 손이 덜덜 떨려요", content: "연습 땐 완벽한데 무대만 올라가면 머리가 하얘지고 박자가 나갑니다. 극복 방법 있을까요?", author: "gunsoup", comments: [{author: "관리자", content: "청심환 반 병 드시고 올라가보세요. 은근 효과 좋습니다."}, {author: "IgNeous", content: "틀려도 아무도 모른다는 마인드로 뻔뻔해지셔야 해요!"}] },
            { title: "베이스 라인을 어떻게 짜야 할지 감이 안 옵니다", content: "루트음만 치려니 너무 밋밋한데, 어프로치 노트를 넣으면 곡이랑 따로 노네요.", author: "BassLine31", comments: [{author: "JazzCat92", content: "좋아하는 곡들 베이스 라인 카피 많이 해보시면 아이디어가 쌓일 거예요."}, {author: "음악가", content: "드럼 킥 박자에 정확히 맞추는 것부터 연습해보세요. 그게 제일 중요합니다!"}] },
            { title: "밴드 탈퇴하고 싶은데 어떻게 말해야 상처를 안 줄까요?", content: "음악적 성향이 너무 달라서 스트레스인데, 형 동생 하는 사이라 말하기가 어렵네요.", author: "netid002", comments: [{author: "DrumAddict80", content: "질질 끄는 게 더 민폐입니다. 최대한 빨리 솔직하게 말씀하세요."}, {author: "홍대불꽃기타", content: "개인적인 사정(취업/이직/건강 등) 핑계 대는 게 제일 깔끔하긴 합니다."}] },
            { title: "보컬 톤이 너무 평범해서 고민입니다", content: "노래방 가면 노래 잘한다는 소린 듣는데, 밴드 음악엔 묻히는 밋밋한 목소리예요.", author: "IgNeous", comments: [{author: "관리자", content: "발성을 바꾸기보단 곡 해석력이나 감정 표현으로 승부해보는 건 어떨까요?"}] },
            { title: "혼자 믹싱하는데 저음역대가 자꾸 뭉칩니다", content: "베이스랑 킥 드럼이 서로 부딪혀서 소리가 지저분해요. EQ 만져도 똑같네요.", author: "JazzCat92", comments: [{author: "BassLine31", content: "킥이랑 베이스 주파수 대역을 조금 다르게 컷아웃 해보세요. 사이드체인 컴프도 필수!"}] },
            { title: "일렉기타 입문하려는데 레스폴 vs 스트랫 추천 부탁드려요", content: "디자인은 레스폴인데, 범용성은 스트랫이라 그래서 며칠째 고민 중입니다.", author: "음악가", comments: [{author: "홍대불꽃기타", content: "무조건 예쁜 거(눈에 밟히는 거) 사야 안 질리고 오래 칩니다. 레스폴 가시죠!"}, {author: "gunsoup", content: "레스폴 무거워서 어깨 빠집니다.. 스트랫 사세요."}] },
            { title: "메인기타리스트랑 자꾸 의견 충돌이 납니다", content: "저는 리듬 위주로 가고 싶은데 메인기타는 자꾸 속주만 하려고 하네요.", author: "관리자", comments: [{author: "netid002", content: "합주 끝나고 술 한잔 하면서 음악적 지향점을 다시 맞춰보셔야 할 듯.."}] },
            { title: "드럼 소리가 너무 커서 보컬 모니터링이 안 돼요", content: "좁은 합주실이라 드럼 소리에 보컬이 다 먹힙니다. 대책이 있을까요?", author: "IgNeous", comments: [{author: "DrumAddict80", content: "드러머한테 심벌 칠 때 살살 쳐달라고 부탁하세요. 드럼 쉴드 치는 곳으로 가시거나요."}] },
            { title: "밴드 홍보는 보통 어떻게 하시나요?", content: "인스타 계정 파긴 했는데 팔로워가 안 늘어요 ㅠㅠ", author: "BassLine31", comments: [{author: "JazzCat92", content: "요새는 유튜브 숏츠나 인스타 릴스로 커버 영상 짧게 올리는 게 직빵입니다."}] },
            { title: "커버곡 위주로 하다가 자작곡 밴드로 넘어가려니 힘드네요", content: "합주 속도도 안 나고 다들 열정이 식어가는 느낌입니다.", author: "홍대불꽃기타", comments: [{author: "음악가", content: "처음엔 유명한 곡 코드 진행만 베껴서 멜로디 얹어보는 연습부터 해보세요."}] },
            { title: "건반 연주자인데 합주 때 소리가 자꾸 기타에 묻힙니다", content: "볼륨을 키워도 소리가 안 뚫고 나오는 느낌이에요.", author: "netid002", comments: [{author: "IgNeous", content: "볼륨 문제가 아니라 주파수 문제일 확률이 큽니다. EQ로 중음역대 살짝 올려보세요."}] },
            { title: "멤버 구하기 너무 지쳐서 원맨 밴드 하려고 합니다", content: "로직 깔아서 미디로 다 찍고 기타만 제가 치려는데 한계가 많을까요?", author: "gunsoup", comments: [{author: "관리자", content: "요새 그렇게 하시는 분들 엄청 많습니다! 오히려 혼자 하니 의견 충돌 없고 편해요 ㅋㅋ"}] }
        ]
    },
    {
        boardType: '악기자랑',
        posts: [
            { title: "큰맘 먹고 펜더 커스텀샵 스트라토캐스터 장만했습니다!! 🎸", content: "3년 적금 부어서 데려왔습니다. 레릭 처리 예술이네요. 오늘 밤은 안고 잡니다 ㅋㅋ", author: "홍대불꽃기타", comments: [{author: "BassLine31", content: "영롱하네요 축하드립니다!!"}, {author: "JazzCat92", content: "평생 소장각이네요 ㅠㅠ 부럽습니다."}] },
            { title: "황학동에서 업어온 빈티지 롤랜드 신디사이저 수리 완료!", content: "헐값에 주워와서 한달 동안 부품 구하고 납땜해서 살려냈습니다. 소리 팻하네요!", author: "JazzCat92", comments: [{author: "IgNeous", content: "헐 이거 명기 아닌가요 금손이십니다!"}, {author: "음악가", content: "부품 구하기 힘드셨을텐데 대단합니다."}] },
            { title: "제 첫 페달보드 완성했습니다!", content: "튜너-드라이브-코러스-딜레이-리버브 국민 세팅으로 맞췄습니다. 무거워 죽겠네요.", author: "netid002", comments: [{author: "gunsoup", content: "깔끔하게 배선 정리 잘 하셨네요!"}, {author: "관리자", content: "이제 무거워서 멀티이펙터로 기변하게 되실 겁니다 ㅋㅋ"}] },
            { title: "드디어 내 방에 방음부스 설치했습니다 ㅠㅠ", content: "아파트에서 눈치보며 전자드럼 치다가 드디어 1.5x1.5 부스 넣었습니다. 천국이네요.", author: "DrumAddict80", comments: [{author: "BassLine31", content: "와 드럼러들의 최고 로망 방음부스 ㅠㅠ 부러워요."}, {author: "홍대불꽃기타", content: "새벽에 쳐도 안 들리나요?? 대박이네요."}] },
            { title: "깁슨 레스폴 스탠다드 골드탑 샀어요!!", content: "슬래쉬 톤 내보고 싶어서 질렀습니다. 허리 부러질 거 같은데 소리는 미쳤네요.", author: "IgNeous", comments: [{author: "음악가", content: "골드탑은 진리죠. 픽업 뭐 박혀있나요?"}] },
            { title: "마틴 어쿠스틱 D-28 영입 완료!", content: "기타치면 누구나 종착역은 마틴이라더니 쳐보고 바로 긁었습니다. 스트로크 소리가 다르네요.", author: "gunsoup", comments: [{author: "JazzCat92", content: "와 소리 한 번 들어보고 싶네요. 통기타 끝판왕 ㄷㄷ"}] },
            { title: "커스텀 베이스 주문 제작 6개월만에 수령했습니다", content: "바디 목재부터 픽업까지 전부 제 취향으로 때려넣었습니다. 네크 그립감 최고네요.", author: "BassLine31", comments: [{author: "netid002", content: "목재 결이 진짜 이쁘게 빠졌네요. 포데라 안 부럽습니다."}] },
            { title: "이펙터 보드 테트리스 끝판왕 인증합니다", content: "페달트레인 나노에 꾸역꾸역 6개 우겨넣었습니다. 발로 밟기 빡세긴 하네요 ㅋㅋ", author: "홍대불꽃기타", comments: [{author: "IgNeous", content: "ㅋㅋㅋ 공간 활용의 달인이시네요."}] },
            { title: "질전 K 커스텀 심벌 세트 질렀어요 ㅠㅠ", content: "텅장이 되었지만 영롱한 자태를 보니 배가 부릅니다. 내일 합주가 기대되네요.", author: "DrumAddict80", comments: [{author: "관리자", content: "소리 진짜 찰랑거리고 이쁘죠. 축하드립니다!"}] },
            { title: "낡은 스콰이어 기타 락카로 커스텀 도색해봤습니다", content: "어차피 싼 기타라 망치면 버린다는 마인드로 칠했는데 나름 펑크하고 이쁘네요!", author: "음악가", comments: [{author: "gunsoup", content: "오 빈티지하고 느낌 있는데요? 락카 냄새는 다 빠졌나요?"}] },
            { title: "노드 스테이지 4 드디어 도착했습니다", content: "빨간 맛 못 잊어서 결국 샀습니다. 피아노 터치감 예술이네요.", author: "JazzCat92", comments: [{author: "BassLine31", content: "건반러들의 영원한 로망 레드.. 부럽습니다 ㅠㅠ"}] },
            { title: "희귀한 빈티지 빅머프 파즈 페달 구했습니다", content: "이베이에서 2달 기다려서 받았네요. 진흙탕 구르는 소리 납니다 ㅋㅋ 최고!", author: "netid002", comments: [{author: "홍대불꽃기타", content: "와 70년대 모델인가요? 상태 엄청 좋네요."}] },
            { title: "야마하 사일런트 기타 여행용으로 샀어요", content: "밤에 연습하기도 좋고 캠핑장 가져가기도 딱이네요. 앰프 물리면 소리도 꽤 좋습니다.", author: "관리자", comments: [{author: "IgNeous", content: "이거 디자인도 진짜 미래지향적이고 이쁘더라고요."}] },
            { title: "중고 베이스 샀는데 넥이 휜 거 같아요 ㅠㅠ", content: "트러스로드 돌려도 한계가 있는 거 같은데 이거 리페어샵 가야할까요?", author: "BassLine31", comments: [{author: "DrumAddict80", content: "자랑게시판이 아니라 슬픔게시판이군요 ㅠㅠ 얼른 샵 가보세요."}] },
            { title: "슈어 SM7B 마이크 샀습니다! 방구석 레코딩 퀄리티가 확 달라지네요", content: "콘덴서 쓰다가 룸 어쿠스틱 안 좋아서 다이나믹으로 바꿨는데 노이즈 없고 소리 딴딴합니다.", author: "gunsoup", comments: [{author: "음악가", content: "보컬 레코딩 끝판왕 마이크죠. 인라인 프리는 뭐 물리셨어요?"}] },
            { title: "프랙탈 FM3 영입했습니다. 무거운 앰프여 안녕~", content: "톤 잡느라 밤샜는데 진짜 진공관 앰프 뺨치네요. 이제 긱백에 이거 하나 넣고 다닙니다.", author: "홍대불꽃기타", comments: [{author: "netid002", content: "진짜 라이브 하시는 분들은 요즘 다 프랙탈이나 헬릭스 쓰시더라고요."}] },
            { title: "오디오 인터페이스 아폴로 트윈으로 업그레이드!", content: "스칼렛 쓰다가 넘어왔는데 해상도가 아예 다르네요. UAD 플러그인도 신세계입니다.", author: "IgNeous", comments: [{author: "JazzCat92", content: "컨버터 차이가 은근 크죠. 축하드립니다!"}] },
            { title: "50년 된 올드 펜더 재즈베이스입니다 (사진)", content: "할아버지 창고에서 먼지 쌓여있던 거 가져와서 닦고 세팅받았습니다. 소리가 익었네요 완전.", author: "BassLine31", comments: [{author: "관리자", content: "헐.. 할아버님이 예전에 베이시스트셨나요? 가보로 물려주신 ㄷㄷ 대박."}] },
            { title: "수제작 기타 스트랩 샀는데 너무 이뻐요", content: "가죽 공방에서 커스텀으로 제 이름 각인해서 만들었습니다. 어깨도 안 아프고 좋네요.", author: "음악가", comments: [{author: "gunsoup", content: "오 각인 너무 고급스럽습니다. 어디 공방인지 정보 좀 주세요!"}] },
            { title: "롤랜드 SPD-SX 샘플링 패드 영입!", content: "라이브 때 일렉트릭 소스 섞어 쓰려고 샀습니다. 이제 드러머도 바쁘네요 ㅠㅠ", author: "DrumAddict80", comments: [{author: "홍대불꽃기타", content: "일렉트로닉 팝 할 때 이거 있으면 진짜 든든하죠! 연습 화이팅입니다."}] }
        ]
    }
];

async function run() {
    let startPostId = 11;
    let postValues = [];
    let commentValues = [];

    const now = new Date();

    for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        for (let j = 0; j < board.posts.length; j++) {
            const post = board.posts[j];
            const authorId = userMap[post.author];
            const created_at = new Date(now.getTime() - Math.random() * 1000000000).toISOString().slice(0, 19).replace('T', ' ');
            
            const postId = startPostId++;
            const vc = Math.floor(Math.random() * 100);
            const lc = Math.floor(Math.random() * 20);
            
            postValues.push(`(${postId}, '${board.boardType}', '${post.title.replace(/'/g, "''")}', '${post.content.replace(/'/g, "''")}', ${authorId}, ${vc}, ${lc}, ${post.comments.length}, b'0', b'0', '${created_at}', '${created_at}')`);
            
            for (let k = 0; k < post.comments.length; k++) {
                const comment = post.comments[k];
                const commenterId = userMap[comment.author];
                const commentDate = new Date(new Date(created_at).getTime() + Math.random() * 100000000).toISOString().slice(0, 19).replace('T', ' ');
                
                commentValues.push(`(${postId}, '${comment.content.replace(/'/g, "''")}', ${commenterId}, b'0', b'0', '${commentDate}', '${commentDate}')`);
            }
        }
    }
    
    const postQuery = "INSERT INTO community_posts (id, board_type, title, content, user_id, view_count, like_count, comment_count, is_hidden, is_deleted, created_at, updated_at) VALUES\n" + postValues.join(',\n') + ";";
    const commentQuery = "INSERT INTO community_post_comments (post_id, content, user_id, is_hidden, is_deleted, created_at, updated_at) VALUES\n" + commentValues.join(',\n') + ";";
    
    fs.writeFileSync('posts.sql', postQuery);
    fs.writeFileSync('comments.sql', commentQuery);
    console.log('SQL files generated.');
}

run().catch(console.error);
