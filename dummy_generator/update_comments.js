const mysql = require("mysql2/promise");

const realisticComments = [
  "진짜 연주 너무 잘하시네요!! 저도 이렇게 치고 싶어요 ㅠㅠ",
  "톤이 너무 좋은데 혹시 이펙터 뭐 쓰시는지 알 수 있을까요?",
  "와우 리듬감 미쳤다... 계속 돌려보고 있어요 🔥",
  "이 곡 진짜 좋아하는데 커버 감사합니다!",
  "연습량이 느껴지네요. 대단하십니다 👏",
  "헉 너무 깔끔하게 잘 치시네요! 맞팔 부탁드려요 ㅎㅎ",
  "멋진 연주 잘 듣고 갑니다~",
  "저도 요즘 이 곡 연습 중인데 참고가 많이 됐어요!",
  "박자감이 엄청 타이트하시네요. 부럽습니다",
  "분위기 장난 아니네요 ㅠㅠ",
  "어떻게 하면 이렇게 부드럽게 칠 수 있나요?",
  "최고에요! 다음 커버도 기대할게요 👍",
  "손가락 진짜 빠르시네요 ㄷㄷ",
  "와 이거 라이브로 들으면 진짜 좋겠다...",
  "소리가 꽉 차있네요 너무 멋집니다!"
];

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'wjdals1831', database: 'ourband'
  });

  try {
    console.log("Fetching all dummy users...");
    const [users] = await connection.execute("SELECT id FROM users");
    const userIds = users.map(u => u.id);

    console.log("Fetching all jam posts...");
    const [jams] = await connection.execute("SELECT id, comment_count FROM jam_post");

    for (const jam of jams) {
      const targetCount = jam.comment_count;
      console.log(`Adding ${targetCount} comments to jam ${jam.id}...`);
      
      await connection.execute("DELETE FROM jam_post_comments WHERE jam_id = ?", [jam.id]);
      
      for (let i = 0; i < targetCount; i++) {
        const randUser = userIds[Math.floor(Math.random() * userIds.length)];
        const randComment = realisticComments[Math.floor(Math.random() * realisticComments.length)];
        
        await connection.execute(
          `INSERT INTO jam_post_comments (content, created_at, updated_at, jam_id, user_id, is_hidden, is_deleted) VALUES (?, NOW(), NOW(), ?, ?, 0, 0)`,
          [randComment, jam.id, randUser]
        );
      }
    }
    
    console.log("Successfully added realistic comments to all jam posts!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

main();
