import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { AppError } from '../../utils/AppError.js';
import { env } from 'process';

// Initialize Cloudinary
// In test environment, we might not have CLOUDINARY_URL, so we don't throw during startup
if (!env.CLOUDINARY_URL && env.NODE_ENV !== 'test') {
  console.error('FATAL ERROR: CLOUDINARY_URL is not defined in environment variables.');
  process.exit(1);
}

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer in memory
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadResumeToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'talentforgeai/resumes',
        resource_type: 'auto',
        // Optional: you can sanitize the filename here
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new AppError('Failed to upload file to storage service', 502));
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
