import path from 'path';
import fs from 'fs';
import multer from 'multer';
import express from 'express';

// Ensure local upload directory exists (Replit-friendly)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration (owner-scoped directories for tenant isolation)
const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    // Use owner ID for tenant isolation, fallback to 'public' for unauthenticated uploads
    const ownerId = req.user?.id ?? 'public';
    const ownerDir = path.join(UPLOAD_DIR, ownerId);
    
    // Ensure owner-specific directory exists
    if (!fs.existsSync(ownerDir)) {
      fs.mkdirSync(ownerDir, { recursive: true });
    }
    
    cb(null, ownerDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  },
});

// File filter for images and PDFs
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed'));
  }
};

// Multer upload instance with size limit (10MB)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Static file server for uploads
export const uploadsStatic = express.static(UPLOAD_DIR, {
  maxAge: '1d',
  etag: true,
});
