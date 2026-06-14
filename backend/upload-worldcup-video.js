import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadVideo() {
  const videoPath = path.join(__dirname, '..', 'client', 'public', 'media', 'cfs-event.mp4');

  if (!fs.existsSync(videoPath)) {
    console.error('Video file not found at:', videoPath);
    return;
  }

  console.log('Uploading video to Cloudinary...');
  try {
    const result = await cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
      folder: 'gamecart/worldcup',
      public_id: 'cfs-event',
      overwrite: true,
    });

    console.log('✅ Upload successful!');
    console.log('Video URL:', result.secure_url);
    console.log('Update world-cup.tsx with this URL!');
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadVideo();
