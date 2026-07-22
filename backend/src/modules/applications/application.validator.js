import { z } from 'zod';
import { AppError } from '../../utils/AppError.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

// Zod schema for the file object (Multer provides this in req.file)
const fileSchema = z.object({
  originalname: z.string().refine((name) => {
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  }, { message: 'Invalid file extension. Only .pdf and .docx are allowed.' }),
  mimetype: z.string().refine((mime) => ALLOWED_MIME_TYPES.includes(mime), {
    message: 'Invalid file type. Only PDF and DOCX documents are allowed.',
  }),
  size: z.number().max(MAX_FILE_SIZE, { message: 'File size must not exceed 5MB.' }),
});

export const validateApplicationSubmit = (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Resume file is required', 422);
    }
    
    // Validate the file object
    const result = fileSchema.safeParse(req.file);
    if (!result.success) {
      const messages = result.error.errors.map(err => err.message).join(', ');
      throw new AppError(messages, 422);
    }

    next();
  } catch (error) {
    next(error);
  }
};

const stageSchema = z.object({
  status: z.enum(['screening', 'interviewing', 'offered', 'hired', 'rejected']),
  notes: z.string().max(500).optional(),
});

export const validateApplicationStage = (req, res, next) => {
  try {
    const result = stageSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError('Invalid stage update data', 400, result.error.format());
    }
    next();
  } catch (error) {
    next(error);
  }
};

