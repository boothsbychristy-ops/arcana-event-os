import { Request, Response, NextFunction } from "express";
import path from "path";

// Allowed MIME types for different upload contexts
const ALLOWED_MIME_TYPES = {
  image: new Set([
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml"
  ]),
  document: new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]),
  all: new Set([
    "image/jpeg",
    "image/jpg",
    "image/png", 
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf"
  ])
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,     // 10MB for images
  document: 25 * 1024 * 1024,  // 25MB for documents
  all: 10 * 1024 * 1024,       // 10MB for mixed uploads
  default: 10 * 1024 * 1024    // 10MB default
};

/**
 * Sanitize filename to prevent directory traversal and other issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  
  // Replace dangerous characters, keep only alphanumeric, dash, underscore, and dot
  const sanitized = basename.replace(/[^\w.\-]/g, "_");
  
  // Limit length to 120 characters
  const limited = sanitized.slice(0, 120);
  
  // Ensure extension is preserved
  const ext = path.extname(limited);
  const name = path.basename(limited, ext);
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now();
  
  return `${name}_${timestamp}${ext}`;
}

/**
 * Middleware to validate uploaded files
 */
export function validateUpload(
  type: "image" | "document" | "all" = "all"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "NO_FILE",
          message: "No file uploaded"
        }
      });
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[type];
    if (!allowedTypes.has(req.file.mimetype)) {
      return res.status(400).json({
        error: {
          code: "BAD_MIMETYPE",
          message: `File type not allowed. Allowed types: ${Array.from(allowedTypes).join(", ")}`
        }
      });
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.default;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        }
      });
    }

    // Sanitize filename
    if (req.file.originalname) {
      req.file.originalname = sanitizeFilename(req.file.originalname);
    }

    // Additional security checks for images
    if (type === "image" || type === "all") {
      // Check for double extensions (e.g., image.jpg.php)
      const filename = req.file.originalname.toLowerCase();
      const suspiciousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.com'];
      
      for (const ext of suspiciousExtensions) {
        if (filename.includes(ext)) {
          return res.status(400).json({
            error: {
              code: "SUSPICIOUS_FILENAME",
              message: "Filename contains suspicious patterns"
            }
          });
        }
      }
    }

    next();
  };
}

/**
 * Middleware for multiple file uploads
 */
export function validateMultipleUploads(
  type: "image" | "document" | "all" = "all",
  maxFiles: number = 10
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if files were uploaded
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({
        error: {
          code: "NO_FILES",
          message: "No files uploaded"
        }
      });
    }

    // Check number of files
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        error: {
          code: "TOO_MANY_FILES",
          message: `Maximum ${maxFiles} files allowed`
        }
      });
    }

    // Validate each file
    const allowedTypes = ALLOWED_MIME_TYPES[type];
    const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.default;

    for (const file of req.files) {
      // Validate MIME type
      if (!allowedTypes.has(file.mimetype)) {
        return res.status(400).json({
          error: {
            code: "BAD_MIMETYPE",
            message: `File "${file.originalname}" has invalid type. Allowed: ${Array.from(allowedTypes).join(", ")}`
          }
        });
      }

      // Validate file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: {
            code: "FILE_TOO_LARGE",
            message: `File "${file.originalname}" exceeds ${maxSize / (1024 * 1024)}MB`
          }
        });
      }

      // Sanitize filename
      if (file.originalname) {
        file.originalname = sanitizeFilename(file.originalname);
      }
    }

    next();
  };
}