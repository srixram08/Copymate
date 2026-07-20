import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection, saveCollection } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'copymate_super_secret_key_123';

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
    }

    const users = await getCollection('users');
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || '',
      points: 0
    };

    const updatedUsers = [...users, newUser];
    await saveCollection('users', updatedUsers);

    // If registered as shop owner, create a shop shell automatically
    if (role === 'shop_owner') {
      const shops = await getCollection('shops');
      const newShop = {
        id: 'shp_' + Math.random().toString(36).substr(2, 9),
        ownerId: newUser.id,
        name: `${name}'s Xerox Shop`,
        address: 'Provide Address',
        phone: phone || '',
        lat: 12.9716 + (Math.random() - 0.5) * 0.02,
        lng: 77.5946 + (Math.random() - 0.5) * 0.02,
        rating: 5.0,
        pricing: { bw: 2.0, color: 10.0, singleSide: 0.0, doubleSide: 0.0, a4: 0.0, a3: 5.0, delivery: 30.0 },
        status: 'active',
        description: 'New print shop on CopyMate'
      };
      const updatedShops = [...shops, newShop];
      await saveCollection('shops', updatedShops);
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
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = await getCollection('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
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
      const shops = await getCollection('shops');
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
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login.' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const users = await getCollection('users');
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    const users = await getCollection('users');
    const index = users.findIndex(u => u.id === req.user.id);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = { ...users[index] };

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailTaken) {
        return res.status(400).json({ error: 'Email is already taken by another profile.' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (password) {
      const salt = await bcrypt.genSalt(8);
      user.password = await bcrypt.hash(password, salt);
    }

    users[index] = user;
    await saveCollection('users', users);

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile details.' });
  }
});

export default router;
