const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mysql = require("mysql2/promise");
const axios = require("axios");
const crypto = require("crypto");

const s3Client = new S3Client({
  region: "auto",
  endpoint: "https://83e0979d430a4d0e5e34e0977fc3ef9d.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "c5842771f978e40ad45c8aec798fbec5",
    secretAccessKey: "30b1fab0b155490567bd79cc353f4a3f915bc6b88afed026d686996a47637b17",
  },
});
const BUCKET_NAME = "ourband-media";
const PUBLIC_R2_URL = "https://pub-2d0fa5857e4e4b5ab63160b72f102555.r2.dev";

async function uploadBufferToR2(buffer, key, contentType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_R2_URL}/${key}`;
}

async function fetchAndUploadImage(seed, width, height, prefix) {
  const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const key = `dummy/${prefix}_${seed}_${Date.now()}.jpg`;
    await uploadBufferToR2(response.data, key, 'image/jpeg');
    return `${PUBLIC_R2_URL}/${key}`;
  } catch (e) {
    console.log("Image upload failed for seed", seed, e.message);
    return null;
  }
}

async function fetchAndUploadVideo(index) {
  const videoUrl = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
  try {
    const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const key = `dummy/jam_video_${index}_${Date.now()}.mp4`;
    await uploadBufferToR2(response.data, key, 'video/mp4');
    return `${PUBLIC_R2_URL}/${key}`;
  } catch (e) {
    console.log("Video upload failed", e.message);
    return null;
  }
}

async function main() {
  console.log("Starting Dummy Data Generation...");
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'wjdals1831',
    database: 'ourband'
  });

  try {
    console.log("Generating 30 Users...");
    const userIds = [];
    for (let i = 1; i <= 30; i++) {
      const email = `dummy_user_${i}_${Date.now()}@example.com`;
      const nickname = `Musician_${i}_${Date.now() % 1000}`;
      const passwordHash = "dummy_password_hash_12345"; 
      const profileUrl = await fetchAndUploadImage(`user${i}`, 200, 200, 'profile');
      const [res] = await connection.execute(
        `INSERT INTO users (email, nickname, password, type, is_active, created_at, updated_at) VALUES (?, ?, ?, 'USER', 1, NOW(), NOW())`,
        [email, nickname, passwordHash]
      );
      const newUserId = res.insertId;
      userIds.push(newUserId);

      await connection.execute(
        `INSERT INTO profile (user_id, instrument, profile_picture_url) VALUES (?, 'Vocal', ?)`,
        [newUserId, profileUrl]
      );
    }

    const leaderIds = userIds.slice(0, 10);
    const memberIds = userIds.slice(10);

    console.log("Generating 10 Bands...");
    const bandsData = [
      { name: "Neon Nights", genre: "Synth Pop", location: "서울 마포구", desc: "80년대 레트로 신스팝 감성을 추구하는 직장인 밴드입니다." },
      { name: "Rusty Strings", genre: "Acoustic", location: "서울 종로구", desc: "어쿠스틱 기타와 까혼으로 잔잔한 음악을 연주합니다." },
      { name: "Metal Heads", genre: "Heavy Metal", location: "경기 성남시", desc: "뼛속까지 헤비메탈! 메탈리카 카피 위주로 달립니다." },
      { name: "Jazz Cats", genre: "Jazz", location: "서울 강남구", desc: "재즈 스탠다드 곡들을 연주하며 주말마다 합주하는 소모임." },
      { name: "Seoul City Rockers", genre: "Punk Rock", location: "서울 서대문구", desc: "펑크 록 스피릿! 커버 밴드." },
      { name: "The Groovers", genre: "Funk", location: "서울 용산구", desc: "베이스 슬랩과 펑키한 기타 쨉쨉이를 사랑하는 사람들의 모임." },
      { name: "Dream Echo", genre: "Shoegaze", location: "경기 수원시", desc: "공간계 이펙터를 떡칠한 몽환적인 슈게이징을 연주합니다." },
      { name: "Midnight Blue", genre: "Blues", location: "인천 부평구", desc: "진득한 정통 블루스를 연주하며 잼 위주로 활동합니다." },
      { name: "K-Pop Covers", genre: "Pop", location: "서울 광진구", desc: "최신 K-Pop 댄스곡들을 밴드 사운드로 편곡해서 연주합니다." },
      { name: "The Unknowns", genre: "Alt Rock", location: "경기 고양시", desc: "자작곡 위주로 활동을 준비 중인 얼터너티브 록 밴드." }
    ];

    for (let i = 0; i < 10; i++) {
      const b = bandsData[i];
      const coverUrl = await fetchAndUploadImage(`band${i}`, 800, 400, 'cover');
      const logoUrl = await fetchAndUploadImage(`logo${i}`, 200, 200, 'logo');
      const [res] = await connection.execute(
        `INSERT INTO bands (name, description, genre, location, meeting_schedule, cover_image_url, logo_image_url, history_json, created_at, updated_at) VALUES (?, ?, ?, ?, '매주 토요일 오후 2시', ?, ?, '{}', DATE_SUB(NOW(), INTERVAL ? DAY), NOW())`,
        [b.name, b.desc, b.genre, b.location, coverUrl, logoUrl, Math.floor(Math.random() * 30)]
      );
      const bandId = res.insertId;

      await connection.execute(`INSERT INTO band_members (band_id, user_id, role, joined_at) VALUES (?, ?, 'Vocal', NOW())`, [bandId, leaderIds[i]]);
      
      const numMembers = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numMembers; j++) {
        const randMember = memberIds[Math.floor(Math.random() * memberIds.length)];
        await connection.execute(`INSERT IGNORE INTO band_members (band_id, user_id, role, joined_at) VALUES (?, ?, 'Member', NOW())`, [bandId, randMember]);
      }

      const numVacancies = Math.floor(Math.random() * 2) + 1;
      const roles = ['Bass', 'Drums', 'Keyboard', 'Guitar', 'Chorus'];
      for (let j = 0; j < numVacancies; j++) {
        await connection.execute(`INSERT INTO band_members (band_id, role, joined_at) VALUES (?, ?, NOW())`, [bandId, roles[Math.floor(Math.random() * roles.length)]]);
      }

      for(let f=0; f<15; f++) {
         const randUser = userIds[Math.floor(Math.random() * userIds.length)];
         await connection.execute(`INSERT IGNORE INTO band_follows (user_id, band_id, created_at) VALUES (?, ?, NOW())`, [randUser, bandId]);
      }
    }
    console.log("Bands created.");

    console.log("Generating 10 Jam Posts...");
    const jamsData = [
      { title: "Sweet Child O' Mine 기타 솔로 커버", inst: "Electric Guitar", genre: "Rock" },
      { title: "Autumn Leaves 피아노 잼", inst: "Piano", genre: "Jazz" },
      { title: "슬랩 베이스 펑크 잼 연습", inst: "Bass", genre: "Funk" },
      { title: "팝펑크 드럼 커버 (BPM 180)", inst: "Drums", genre: "Punk" },
      { title: "퇴근 후 통기타 자작곡 스케치", inst: "Acoustic Guitar", genre: "Indie" },
      { title: "빈티지 신디사이저 웨이브 잼", inst: "Synthesizer", genre: "Electronic" },
      { title: "펜더 블루스 즉흥 연주", inst: "Electric Guitar", genre: "Blues" },
      { title: "메탈 브레이크다운 연습", inst: "Drums", genre: "Metal" },
      { title: "로파이(Lo-Fi) 비트메이킹", inst: "Beatpad", genre: "Lo-Fi" },
      { title: "정통 하드락 연습 영상", inst: "Vocal", genre: "Rock" }
    ];

    for (let i = 0; i < 10; i++) {
      const j = jamsData[i];
      const videoUrl = await fetchAndUploadVideo(i) || 'https://www.w3schools.com/html/mov_bbb.mp4';
      const randUser = memberIds[Math.floor(Math.random() * memberIds.length)];
      const views = Math.floor(Math.random() * 400) + 100;
      const likes = Math.floor(Math.random() * 40) + 10;

      const [res] = await connection.execute(
        `INSERT INTO jam_post (user_id, media_url, title, description, instrument, genre, view_count, like_count, comment_count, share_count, original_volume, my_volume, is_hidden, is_deleted, created_at) VALUES (?, ?, ?, '잼 연습 영상입니다~', ?, ?, ?, ?, 5, 2, 1.0, 1.0, 0, 0, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [randUser, videoUrl, j.title, j.inst, j.genre, views, likes, Math.floor(Math.random() * 10)]
      );

      for(let l=0; l<likes; l++) {
         const lu = userIds[Math.floor(Math.random() * userIds.length)];
         await connection.execute(`INSERT IGNORE INTO jam_post_likes (user_id, jam_id, created_at) VALUES (?, ?, NOW())`, [lu, res.insertId]);
      }
    }
    console.log("Jams created.");

  } catch (error) {
    console.error("Error during DB operations:", error);
  } finally {
    await connection.end();
    console.log("Done!");
  }
}

main();
