import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload to Cloudinary
export const uploadToCloudinary = async (buffer, folder = 'safetrip/tourists') => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:${buffer.mimetype};base64,${buffer.toString('base64')}`,
      {
        folder,
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto' },
        ],
      }
    );
    return result.secure_url;
  } catch (error) {
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export default upload;
