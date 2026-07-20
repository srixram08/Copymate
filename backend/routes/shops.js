import express from 'express';
import { getCollection, saveCollection } from '../config/db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all shops
router.get('/', async (req, res) => {
  try {
    const shops = await getCollection('shops');
    res.json(shops.filter(s => s.status === 'active'));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch shops.' });
  }
});

// Get single shop detail with reviews
router.get('/:id', async (req, res) => {
  try {
    const shops = await getCollection('shops');
    const shop = shops.find(s => s.id === req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Print shop not found.' });
    }

    const reviews = (await getCollection('reviews')).filter(r => r.shopId === shop.id);
    const users = await getCollection('users');

    const populatedReviews = reviews.map(r => {
      const cust = users.find(u => u.id === r.customerId);
      return { ...r, customerName: cust ? cust.name : 'Anonymous' };
    });

    res.json({ ...shop, reviews: populatedReviews });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch shop.' });
  }
});

// Update shop details (Owner only or Admin)
router.put('/:id', auth, authorize(['shop_owner', 'admin']), async (req, res) => {
  try {
    const shops = await getCollection('shops');
    const index = shops.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    const shop = shops[index];

    if (req.user.role !== 'admin' && shop.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this shop.' });
    }

    const { name, address, phone, lat, lng, pricing, status, description } = req.body || {};

    shops[index] = {
      ...shop,
      name: name || shop.name,
      address: address || shop.address,
      phone: phone || shop.phone,
      lat: lat !== undefined ? lat : shop.lat,
      lng: lng !== undefined ? lng : shop.lng,
      pricing: pricing ? { ...shop.pricing, ...pricing } : shop.pricing,
      status: status || shop.status,
      description: description || shop.description
    };

    await saveCollection('shops', shops);
    res.json(shops[index]);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update shop.' });
  }
});

export default router;
