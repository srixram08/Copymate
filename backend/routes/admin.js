import express from 'express';
import { getCollection, saveCollection } from '../config/db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get Admin Statistics
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await getCollection('users');
    const shops = await getCollection('shops');
    const orders = await getCollection('orders');
    const payments = await getCollection('payments');

    const totalRevenue = payments
      .filter(p => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const statusBreakdown = {
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      printing: orders.filter(o => o.status === 'printing').length,
      ready_for_pickup: orders.filter(o => o.status === 'ready_for_pickup').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      completed: orders.filter(o => o.status === 'completed').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
    };

    res.json({
      totalUsers: users.length,
      totalShops: shops.length,
      totalOrders: orders.length,
      totalRevenue,
      statusBreakdown,
      recentPayments: payments.slice(-5).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard.' });
  }
});

// Get all users
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await getCollection('users');
    const cleanUsers = users.map(({ password, ...u }) => u);
    res.json(cleanUsers);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch users.' });
  }
});

// Toggle shop active status
router.put('/shops/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    const shops = await getCollection('shops');
    const index = shops.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    const shop = { ...shops[index] };
    shop.status = shop.status === 'active' ? 'inactive' : 'active';

    shops[index] = shop;
    await saveCollection('shops', shops);

    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to toggle shop status.' });
  }
});

export default router;
