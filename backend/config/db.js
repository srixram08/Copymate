import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Ensure IPv4 and standard public DNS resolvers for MongoDB SRV lookups on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem (e.g. Vercel Serverless)
}

// Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String, default: "" },
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
  status: { type: String, default: "active" },
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
  status: { type: String, default: "pending" },
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

// Initial Seed Data with Completed Prints and Points
const initialDB = {
  users: [
    {
      id: "usr_admin",
      name: "System Admin",
      email: "admin@copymate.com",
      password: "$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW", // bcrypt hash for 'admin123'
      role: "admin",
      phone: "+15550100",
      points: 0
    },
    {
      id: "usr_shop1",
      name: "Rajesh Xerox & Prints",
      email: "rajesh@copymate.com",
      password: "$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW", // 'admin123'
      role: "shop_owner",
      phone: "+15550101",
      points: 0
    },
    {
      id: "usr_shop2",
      name: "Campus Print Hub",
      email: "campus@copymate.com",
      password: "$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW", // 'admin123'
      role: "shop_owner",
      phone: "+15550102",
      points: 0
    },
    {
      id: "usr_delivery1",
      name: "Amit Kumar",
      email: "amit@copymate.com",
      password: "$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW", // 'admin123'
      role: "delivery_agent",
      phone: "+15550103",
      points: 0
    },
    {
      id: "usr_customer1",
      name: "Sriram Swaminathan",
      email: "sriram@copymate.com",
      password: "$2a$10$sYpdNKV3eqjGgC6M9zgXM.u/08N6Muyof9ymwtFEVw/yiD6vGt.wW", // 'admin123'
      role: "customer",
      phone: "+15550104",
      points: 120
    }
  ],
  shops: [
    {
      id: "shp_1",
      ownerId: "usr_shop1",
      name: "Rajesh Xerox & Prints",
      address: "Opposite College Gate 1, MG Road",
      phone: "+15550101",
      lat: 12.9716,
      lng: 77.5946,
      rating: 5,
      pricing: {
        bw: 2,
        color: 10,
        singleSide: 0,
        doubleSide: 0,
        a4: 0,
        a3: 5,
        delivery: 30
      },
      status: "active",
      description: "Quick, high-quality printing and photocopying. Special student discounts available."
    },
    {
      id: "shp_2",
      ownerId: "usr_shop2",
      name: "Campus Print Hub",
      address: "Academic Block A, Ground Floor",
      phone: "+15550102",
      lat: 12.9750,
      lng: 77.6000,
      rating: 4.5,
      pricing: {
        bw: 1.5,
        color: 8,
        singleSide: 0,
        doubleSide: 0,
        a4: 0,
        a3: 4,
        delivery: 20
      },
      status: "active",
      description: "On-campus digital print centre. Bindings, spiral printouts and notes copying."
    }
  ],
  documents: [
    {
      id: "doc_1",
      userId: "usr_customer1",
      filename: "College_Project_Final.pdf",
      filePath: "backend/uploads/College_Project_Final.pdf",
      size: 1542000,
      pageCount: 30,
      createdAt: "2026-07-15T13:45:00Z"
    },
    {
      id: "doc_2",
      userId: "usr_customer1",
      filename: "Resume_Sriram.pdf",
      filePath: "backend/uploads/Resume_Sriram.pdf",
      size: 512000,
      pageCount: 2,
      createdAt: "2026-07-16T09:12:00Z"
    }
  ],
  orders: [
    {
      id: "ord_past1",
      customerId: "usr_customer1",
      shopId: "shp_1",
      documentId: "doc_1",
      documentName: "College_Project_Final.pdf",
      documentPath: "backend/uploads/College_Project_Final.pdf",
      pageCount: 30,
      printSettings: {
        colorMode: "bw",
        sideMode: "double",
        paperSize: "A4",
        copies: 2,
        pageRange: ""
      },
      deliveryType: "pickup",
      deliveryAddress: "",
      totalPrice: 120,
      status: "completed",
      deliveryAgentId: null,
      createdAt: "2026-07-15T14:00:00Z"
    },
    {
      id: "ord_past2",
      customerId: "usr_customer1",
      shopId: "shp_1",
      documentId: "doc_2",
      documentName: "Resume_Sriram.pdf",
      documentPath: "backend/uploads/Resume_Sriram.pdf",
      pageCount: 2,
      printSettings: {
        colorMode: "color",
        sideMode: "single",
        paperSize: "A4",
        copies: 3,
        pageRange: ""
      },
      deliveryType: "delivery",
      deliveryAddress: "Flat 402, Sunshine Apartments, MG Road",
      totalPrice: 90,
      status: "completed",
      deliveryAgentId: "usr_delivery1",
      createdAt: "2026-07-16T09:30:00Z"
    }
  ],
  payments: [
    {
      id: "pay_past1",
      orderId: "ord_past1",
      amount: 120,
      paymentMethod: "online",
      paymentStatus: "completed",
      transactionId: "TXN_9876543210",
      createdAt: "2026-07-15T14:05:00Z"
    },
    {
      id: "pay_past2",
      orderId: "ord_past2",
      amount: 90,
      paymentMethod: "online",
      paymentStatus: "completed",
      transactionId: "TXN_1234567890",
      createdAt: "2026-07-16T09:35:00Z"
    }
  ],
  reviews: [
    {
      id: "rev_1",
      customerId: "usr_customer1",
      shopId: "shp_1",
      rating: 5,
      comment: "Super fast print. Colors are highly vibrant!",
      createdAt: "2026-07-16T12:00:00Z"
    }
  ]
};

// Initialize local DB file if not present
try {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  }
} catch (e) {
  // Read-only filesystem on serverless platforms
}

let cachedDB = null;

export const readDB = () => {
  if (cachedDB) return cachedDB;
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    cachedDB = JSON.parse(data);
    return cachedDB;
  } catch (err) {
    console.error("Error reading database file", err);
    cachedDB = initialDB;
    return cachedDB;
  }
};

export const writeDB = (data) => {
  cachedDB = data;
  try {
    const jsonString = JSON.stringify(data, null, 2);
    if (fs.existsSync(DB_FILE)) {
      const existing = fs.readFileSync(DB_FILE, 'utf-8');
      if (existing === jsonString) return;
    }
    fs.writeFileSync(DB_FILE, jsonString, 'utf-8');
  } catch (err) {
    console.error("Error writing database file", err);
  }
};

// Asynchronously sync collection to MongoDB if connected
async function syncCollectionToMongo(collectionName, items) {
  if (mongoose.connection.readyState !== 1) return;
  const Model = collectionsMap[collectionName];
  if (!Model) return;

  try {
    const bulkOps = items.map(item => {
      const { _id, ...cleanItem } = item;
      return {
        updateOne: {
          filter: { id: item.id },
          update: { $set: cleanItem },
          upsert: true
        }
      };
    });
    if (bulkOps.length > 0) {
      await Model.bulkWrite(bulkOps);
    }
  } catch (err) {
    console.error(`[MongoDB] Error syncing collection '${collectionName}':`, err.message);
  }
}

// Connect to MongoDB
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("ℹ️ MONGODB_URI not found in environment. Using local JSON database.");
    return;
  }

  if (uri.includes('<db_password>')) {
    console.warn("⚠️  [MongoDB Warning]: MONGODB_URI contains '<db_password>'. Please replace it with your actual database password in backend/.env!");
    return;
  }

  try {
    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Successfully connected to MongoDB Atlas!");

    const localData = readDB();

    // Check collections and seed / load from MongoDB
    for (const [colName, Model] of Object.entries(collectionsMap)) {
      try {
        const count = await Model.countDocuments();
        if (count === 0 && initialDB[colName] && initialDB[colName].length > 0) {
          console.log(`🌱 Seeding initial '${colName}' data into MongoDB...`);
          const itemsToSeed = localData[colName] || initialDB[colName];
          await Model.insertMany(itemsToSeed, { ordered: false });
        }

        // Populate local cache from MongoDB
        const docs = await Model.find({}, { _id: 0, __v: 0 }).lean();
        if (docs && docs.length > 0) {
          localData[colName] = docs;
        }
      } catch (err) {
        console.warn(`[MongoDB Warning] Error loading collection '${colName}':`, err.message);
      }
    }

    writeDB(localData);
    console.log("⚡ MongoDB data synchronized with local backend store!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("🔄 Falling back to local JSON file store.");
  }
};

export const getCollection = (collectionName) => {
  const db = readDB();
  return db[collectionName] || [];
};

export const saveCollection = (collectionName, data) => {
  const db = readDB();
  db[collectionName] = data;
  writeDB(db);
  // Async background sync to MongoDB
  syncCollectionToMongo(collectionName, data).catch(() => {});
};

// Points Helpers
export const awardPoints = (userId, pages) => {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = db.users[index];
    user.points = (user.points || 0) + pages;
    db.users[index] = user;
    writeDB(db);
    syncCollectionToMongo('users', db.users).catch(() => {});
  }
};

export const deductPoints = (userId, pointsToDeduct) => {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = db.users[index];
    user.points = Math.max(0, (user.points || 0) - pointsToDeduct);
    db.users[index] = user;
    writeDB(db);
    syncCollectionToMongo('users', db.users).catch(() => {});
  }
};
