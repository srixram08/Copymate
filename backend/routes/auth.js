import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection, saveCollection } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "copymate_super_secret_key_123";

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields (name, email, password, role) are required." });
    }

    const users = getCollection('users');
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role, // 'customer', 'shop_owner', 'delivery_agent', 'admin'
      phone: phone || ""
    };

    users.push(newUser);
    saveCollection('users', users);

    // If registered as shop owner, create a shop shell automatically
    if (role === 'shop_owner') {
      const shops = getCollection('shops');
      const newShop = {
        id: "shp_" + Math.random().toString(36).substr(2, 9),
        ownerId: newUser.id,
        name: `${name}'s Xerox Shop`,
        address: "Provide Address",
        phone: phone || "",
        lat: 12.9716 + (Math.random() - 0.5) * 0.02,
        lng: 77.5946 + (Math.random() - 0.5) * 0.02,
        rating: 5.0,
        pricing: {
          bw: 2.0,
          color: 10.0,
          singleSide: 0.0,
          doubleSide: 0.0,
          a4: 0.0,
          a3: 5.0,
          delivery: 30.0
        },
        status: "active",
        description: "New print shop on CopyMate"
      };
      shops.push(newShop);
      saveCollection('shops', shops);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const users = getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get shop ID if user is a shop owner
    let shopId = null;
    if (user.role === 'shop_owner') {
      const shops = getCollection('shops');
      const shop = shops.find(s => s.ownerId === user.id);
      if (shop) shopId = shop.id;
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        shopId
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login." });
  }
});

// Get current user profile details
router.get('/me', auth, (req, res) => {
  const users = getCollection('users');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Update current user profile details
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const users = getCollection('users');
    const index = users.findIndex(u => u.id === req.user.id);

    if (index === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = users[index];

    // Verify email uniqueness if email changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailTaken) {
        return res.status(400).json({ error: "Email is already taken by another profile." });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    users[index] = user;
    saveCollection('users', users);

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile details." });
  }
});

export default router;
