import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Ensure IPv4 and standard public DNS resolvers for MongoDB SRV lookups on Windows
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
const IS_SERVERLESS = !!process.env.VERCEL;

// ─── Mongoose Schemas & Models ──────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, default: '' },
  points: { type: Number, default: 0 }
}, { strict: false });

const shopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  rating: { type: Number, default: 5 },
  pricing: { type: Object },
  status: { type: String, default: 'active' },
  description: { type: String }
}, { strict: false });

const documentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  filename: { type: String },
  filePath: { type: String },
  size: { type: Number },
  pageCount: { type: Number },
  createdAt: { type: String }
}, { strict: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  shopId: { type: String, required: true },
  documentId: { type: String },
  documentName: { type: String },
  documentPath: { type: String },
  pageCount: { type: Number },
  printSettings: { type: Object },
  deliveryType: { type: String },
  deliveryAddress: { type: String },
  totalPrice: { type: Number },
  pointsRedeemed: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  deliveryAgentId: { type: String, default: null },
  createdAt: { type: String }
}, { strict: false });

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  amount: { type: Number },
  paymentMethod: { type: String },
  paymentStatus: { type: String },
  transactionId: { type: String },
  createdAt: { type: String }
}, { strict: false });

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  shopId: { type: String, required: true },
  rating: { type: Number },
  comment: { type: String },
  createdAt: { type: String }
}, { strict: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
export const DocumentModel = mongoose.models.Document || mongoose.model('Document', documentSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

const collectionsMap = {
  users: User,
  shops: Shop,
  documents: DocumentModel,
  orders: Order,
  payments: Payment,
  reviews: Review
};

// ─── Initial Seed Data ───────────────────────────────────────────────────────

const initialDB = {
  users: [
    {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@copymate.com',
      password: '$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW',
      role: 'admin',
      phone: '+15550100',
      points: 0
    },
    {
      id: 'usr_shop1',
      name: 'Rajesh Xerox & Prints',
      email: 'rajesh@copymate.com',
      password: '$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW',
      role: 'shop_owner',
      phone: '+15550101',
      points: 0
    },
    {
      id: 'usr_shop2',
      name: 'Campus Print Hub',
      email: 'campus@copymate.com',
      password: '$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW',
      role: 'shop_owner',
      phone: '+15550102',
      points: 0
    },
    {
      id: 'usr_delivery1',
      name: 'Amit Kumar',
      email: 'amit@copymate.com',
      password: '$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW',
      role: 'delivery_agent',
      phone: '+15550103',
      points: 0
    },
    {
      id: 'usr_customer1',
      name: 'Sriram Swaminathan',
      email: 'sriram@copymate.com',
      password: '$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW',
      role: 'customer',
      phone: '+15550104',
      points: 120
    }
  ],
  shops: [
    {
      id: 'shp_1',
      ownerId: 'usr_shop1',
      name: 'Rajesh Xerox & Prints',
      address: 'Opposite College Gate 1, MG Road',
      phone: '+15550101',
      lat: 12.9716,
      lng: 77.5946,
      rating: 5,
      pricing: { bw: 2, color: 10, singleSide: 0, doubleSide: 0, a4: 0, a3: 5, delivery: 30 },
      status: 'active',
      description: 'Quick, high-quality printing and photocopying. Special student discounts available.'
    },
    {
      id: 'shp_2',
      ownerId: 'usr_shop2',
      name: 'Campus Print Hub',
      address: 'Academic Block A, Ground Floor',
      phone: '+15550102',
      lat: 12.9750,
      lng: 77.6000,
      rating: 4,
      pricing: { bw: 1.5, color: 8, singleSide: 0, doubleSide: 0, a4: 0, a3: 4, delivery: 25 },
      status: 'active',
      description: 'Affordable campus printing with fast turnaround. Located inside the campus.'
    }
  ],
  documents: [],
  orders: [],
  payments: [],
  reviews: []
};

// ─── JSON File Store (local dev only) ───────────────────────────────────────

let _memCache = null;

const readDB = () => {
  if (_memCache) return _memCache;
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    _memCache = JSON.parse(data);
    return _memCache;
  } catch {
    _memCache = JSON.parse(JSON.stringify(initialDB));
    return _memCache;
  }
};

const writeDB = (data) => {
  _memCache = data;
  try {
    const json = JSON.stringify(data, null, 2);
    const existing = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf-8') : '';
    if (json !== existing) {
      fs.writeFileSync(DB_FILE, json, 'utf-8');
    }
  } catch {
    // Read-only filesystem (Vercel Serverless) — in-memory only
  }
};

// Ensure data folder exists (local only)
try {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
} catch {}

// ─── MongoDB Connection ──────────────────────────────────────────────────────

let mongoConnected = false;
let mongoConnecting = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.log('ℹ️ MONGODB_URI not set. Using local JSON database.');
    return;
  }

  if (mongoConnected || mongoConnecting) return;
  mongoConnecting = true;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    mongoConnected = true;
    mongoConnecting = false;
    console.log('✅ Connected to MongoDB Atlas!');

    // Seed initial data if collections are empty
    for (const [colName, Model] of Object.entries(collectionsMap)) {
      try {
        const count = await Model.countDocuments();
        if (count === 0 && initialDB[colName] && initialDB[colName].length > 0) {
          console.log(`🌱 Seeding '${colName}'...`);
          await Model.insertMany(initialDB[colName], { ordered: false });
        }
      } catch (err) {
        // Ignore duplicate key errors on seed
        if (err.code !== 11000) {
          console.warn(`[Seed Warning] '${colName}':`, err.message);
        }
      }
    }
  } catch (err) {
    mongoConnected = false;
    mongoConnecting = false;
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔄 Falling back to local JSON file store.');
  }
};

const ensureMongoConnected = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) return false;
  if (mongoose.connection.readyState === 1) return true;
  await connectDB();
  return mongoose.connection.readyState === 1;
};

// ─── Public Collection API ────────────────────────────────────────────────────

/**
 * Get all documents from a collection.
 * Uses MongoDB if connected, otherwise falls back to local JSON.
 */
export const getCollection = async (collectionName) => {
  try {
    const isConnected = await ensureMongoConnected();
    if (isConnected) {
      const Model = collectionsMap[collectionName];
      if (!Model) return [];
      const docs = await Model.find({}, { _id: 0, __v: 0 }).lean();
      return docs || [];
    }
  } catch (err) {
    console.error(`[getCollection] MongoDB error for '${collectionName}':`, err.message);
  }
  // Fallback to local JSON
  const db = readDB();
  return db[collectionName] || [];
};

/**
 * Save an entire collection.
 * Uses MongoDB if connected, otherwise saves to local JSON.
 */
export const saveCollection = async (collectionName, data) => {
  try {
    const isConnected = await ensureMongoConnected();
    if (isConnected) {
      const Model = collectionsMap[collectionName];
      if (!Model) return;
      const bulkOps = data.map(item => {
        const { _id, __v, ...cleanItem } = item;
        return {
          updateOne: {
            filter: { id: item.id },
            update: { $set: cleanItem },
            upsert: true
          }
        };
      });
      if (bulkOps.length > 0) {
        await Model.bulkWrite(bulkOps, { ordered: false });
      }
      return;
    }
  } catch (err) {
    console.error(`[saveCollection] MongoDB error for '${collectionName}':`, err.message);
  }
  // Fallback: save to JSON
  const db = readDB();
  db[collectionName] = data;
  writeDB(db);
};

// ─── Points Helpers ──────────────────────────────────────────────────────────

export const awardPoints = async (userId, pages) => {
  try {
    const isConnected = await ensureMongoConnected();
    if (isConnected) {
      await User.updateOne({ id: userId }, { $inc: { points: pages } });
      return;
    }
  } catch (err) {
    console.error('[awardPoints] MongoDB error:', err.message);
  }
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    db.users[idx].points = (db.users[idx].points || 0) + pages;
    writeDB(db);
  }
};

export const deductPoints = async (userId, pointsToDeduct) => {
  try {
    const isConnected = await ensureMongoConnected();
    if (isConnected) {
      const user = await User.findOne({ id: userId });
      if (user) {
        const newPoints = Math.max(0, (user.points || 0) - pointsToDeduct);
        await User.updateOne({ id: userId }, { $set: { points: newPoints } });
      }
      return;
    }
  } catch (err) {
    console.error('[deductPoints] MongoDB error:', err.message);
  }
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    db.users[idx].points = Math.max(0, (db.users[idx].points || 0) - pointsToDeduct);
    writeDB(db);
  }
};
