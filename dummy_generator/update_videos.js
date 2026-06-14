const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");
const mysql = require("mysql2/promise");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
const PUBLIC_R2_URL = "https://pub-7182cb8a63b442d99599c60ce1f02ba7.r2.dev";

async function uploadToR2(stream, key) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: 'video/mp4'
        }));
        resolve(`${PUBLIC_R2_URL}/${key}`);
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', err => reject(err));
  });
}

const queries = [
  "guitar cover short", "piano cover short", "bass slap short", 
  "drum solo short", "acoustic guitar short", "synth jam short", 
  "electric guitar solo short", "drum cover short", "lofi beatpad short", "vocal cover short"
];

const realisticNicknames = [
  "GrooveMaster", "AcousticVibes", "RockStar99", "JazzCat", "MetalHead",
  "SynthWave", "BeatMaker", "VocalKing", "GuitarHero", "DrumAddict",
  "BassLine", "PianoMan", "IndieSoul", "BluesBoy", "PopIdol",
  "StringBender", "RhythmChaser", "MelodyMaker", "ChordsLife", "LofiChill"
];

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'wjdals1831', database: 'ourband'
  });

  try {
    console.log("Updating nicknames...");
    const [users] = await connection.execute("SELECT id FROM users WHERE email LIKE 'dummy_user_%'");
    for (let i = 0; i < users.length; i++) {
      const newNick = realisticNicknames[i % realisticNicknames.length] + Math.floor(Math.random() * 100);
      await connection.execute("UPDATE users SET nickname = ? WHERE id = ?", [newNick, users[i].id]);
    }
    console.log("Nicknames updated.");

    console.log("Fetching and updating 10 videos...");
    const [posts] = await connection.execute("SELECT id FROM jam_post ORDER BY id DESC LIMIT 10");
    
    for (let i = 0; i < 10; i++) {
      const query = queries[i];
      const r = await yts(query);
      const video = r.videos.find(v => v.seconds < 120); 
      if (video) {
        console.log(`Downloading ${video.title}...`);
        try {
          const stream = ytdl(video.url, { filter: 'audioandvideo', quality: 'lowestvideo' });
          const key = `dummy/video_${Date.now()}_${i}.mp4`;
          const r2Url = await uploadToR2(stream, key);
          
          await connection.execute("UPDATE jam_post SET media_url = ? WHERE id = ?", [r2Url, posts[i].id]);
          console.log(`Updated post ${posts[i].id} with ${r2Url}`);
        } catch (err) {
          console.error(`Failed to process video ${i}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

main();
