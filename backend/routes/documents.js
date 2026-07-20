import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCollection, saveCollection } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'uploads');

// Ensure uploads folder exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.docx', '.doc', '.ppt', '.pptx', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file format. Upload PDF, DOCX, PPT or Images."));
    }
  }
});

// Upload Document Endpoint
router.post('/upload', auth, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No document file was uploaded." });
    }

    const documents = getCollection('documents');
    
    // Simulate page count calculation (in a real app, libraries like pdf-parse would read this)
    // Here we generate a realistic page count based on file size, default 3 pages
    let pageCount = Math.floor(Math.random() * 8) + 1;
    if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
      pageCount = Math.max(1, Math.floor(req.file.size / 150000)); // ~150KB per page mock
    } else if (req.file.originalname.toLowerCase().endsWith('.pptx')) {
      pageCount = Math.max(2, Math.floor(req.file.size / 80000));
    }

    const newDoc = {
      id: "doc_" + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      filename: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      size: req.file.size,
      pageCount,
      uploadedAt: new Date().toISOString()
    };

    documents.push(newDoc);
    saveCollection('documents', documents);

    res.status(201).json(newDoc);

  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload document." });
  }
});

// Get User's Documents
router.get('/', auth, (req, res) => {
  const documents = getCollection('documents');
  const userDocs = documents.filter(d => d.userId === req.user.id);
  res.json(userDocs);
});

export default router;
