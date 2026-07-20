import express from 'express';
import { getCollection, saveCollection, deductPoints, awardPoints } from '../config/db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create Order (Customer only)
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const {
      shopId,
      documentId,
      printSettings,
      deliveryType,
      deliveryAddress,
      redeemPoints
    } = req.body || {};

    if (!shopId || !documentId || !printSettings) {
      return res.status(400).json({ error: 'Missing required order parameters.' });
    }

    const shops = await getCollection('shops');
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });

    const documents = await getCollection('documents');
    const doc = documents.find(d => d.id === documentId && d.userId === req.user.id);
    if (!doc) return res.status(404).json({ error: 'Uploaded document not found.' });

    // Calculate total pages based on page range or complete file
    let pagesToPrint = doc.pageCount;
    if (printSettings.pageRange && printSettings.pageRange.trim() !== '') {
      const range = printSettings.pageRange;
      if (range.includes('-')) {
        const parts = range.split('-');
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          pagesToPrint = (end - start) + 1;
        }
      } else if (range.includes(',')) {
        pagesToPrint = range.split(',').length;
      } else {
        const single = parseInt(range);
        if (!isNaN(single)) pagesToPrint = 1;
      }
    }

    pagesToPrint = Math.min(pagesToPrint, doc.pageCount);

    const isColor = printSettings.colorMode === 'color';
    const isA3 = printSettings.paperSize === 'A3';
    let ratePerPage = isColor ? shop.pricing.color : shop.pricing.bw;
    if (isA3) ratePerPage += shop.pricing.a3 || 0;

    let subtotal = ratePerPage * pagesToPrint * (printSettings.copies || 1);
    let deliveryFee = deliveryType === 'delivery' ? (shop.pricing.delivery || 30) : 0;

    const users = await getCollection('users');
    const dbUser = users.find(u => u.id === req.user.id);
    let discount = 0;
    let pointsRedeemed = 0;
    if (redeemPoints && redeemPoints > 0) {
      pointsRedeemed = Math.min(parseInt(redeemPoints), dbUser?.points || 0);
      discount = pointsRedeemed;
    }

    const totalPrice = Math.max(0, subtotal + deliveryFee - discount);

    const newOrder = {
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      customerId: req.user.id,
      shopId,
      documentId,
      documentName: doc.filename,
      documentPath: doc.filePath,
      pageCount: doc.pageCount,
      printSettings,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : '',
      totalPrice,
      pointsRedeemed,
      discount,
      status: 'pending',
      deliveryAgentId: null,
      createdAt: new Date().toISOString()
    };

    const orders = await getCollection('orders');
    const updatedOrders = [...orders, newOrder];
    await saveCollection('orders', updatedOrders);

    if (pointsRedeemed > 0) {
      await deductPoints(req.user.id, pointsRedeemed);
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to place order.' });
  }
});

// Get Customer Orders
router.get('/customer', auth, authorize('customer'), async (req, res) => {
  try {
    const orders = await getCollection('orders');
    const shops = await getCollection('shops');
    const customerOrders = orders.filter(o => o.customerId === req.user.id);

    const populated = customerOrders.map(o => {
      const shop = shops.find(s => s.id === o.shopId);
      return { ...o, shopName: shop ? shop.name : 'Unknown Shop' };
    });

    populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch orders.' });
  }
});

// Get Shop Orders (Shop owner only)
router.get('/shop/:shopId', auth, authorize(['shop_owner', 'admin']), async (req, res) => {
  try {
    const shops = await getCollection('shops');
    const shop = shops.find(s => s.id === req.params.shopId);

    if (!shop) return res.status(404).json({ error: 'Shop not found.' });
    if (req.user.role !== 'admin' && shop.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access to this shop's orders." });
    }

    const orders = await getCollection('orders');
    const users = await getCollection('users');
    const shopOrders = orders.filter(o => o.shopId === req.params.shopId);

    const populated = shopOrders.map(o => {
      const cust = users.find(u => u.id === o.customerId);
      const agent = o.deliveryAgentId ? users.find(u => u.id === o.deliveryAgentId) : null;
      return {
        ...o,
        customerName: cust ? cust.name : 'Customer',
        customerPhone: cust ? cust.phone : '',
        customerPoints: cust ? (cust.points || 0) : 0,
        deliveryAgentName: agent ? agent.name : ''
      };
    });

    populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch shop orders.' });
  }
});

// Update Order Status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const orders = await getCollection('orders');
    const index = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = { ...orders[index] };
    const { status, deliveryAgentId } = req.body || {};
    const oldStatus = order.status;
    const validStatuses = ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'rejected'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    if (status) order.status = status;
    if (deliveryAgentId !== undefined) order.deliveryAgentId = deliveryAgentId;

    orders[index] = order;
    await saveCollection('orders', orders);

    if (status === 'completed' && oldStatus !== 'completed') {
      const printedPages = order.pageCount * (order.printSettings?.copies || 1);
      await awardPoints(order.customerId, printedPages);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update order status.' });
  }
});

// Mock Pay Endpoint
router.post('/:id/pay', auth, authorize('customer'), async (req, res) => {
  try {
    const orders = await getCollection('orders');
    const order = orders.find(o => o.id === req.params.id && o.customerId === req.user.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const payments = await getCollection('payments');
    const newPayment = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      orderId: order.id,
      amount: order.totalPrice,
      paymentMethod: req.body?.paymentMethod || 'online',
      paymentStatus: 'completed',
      transactionId: 'TXN_' + Math.round(Math.random() * 1e12),
      createdAt: new Date().toISOString()
    };

    const updatedPayments = [...payments, newPayment];
    await saveCollection('payments', updatedPayments);

    res.json({ message: 'Payment successful', payment: newPayment });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Payment failed.' });
  }
});

// Submit Review
router.post('/:id/review', auth, authorize('customer'), async (req, res) => {
  try {
    const orders = await getCollection('orders');
    const order = orders.find(o => o.id === req.params.id && o.customerId === req.user.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { rating, comment } = req.body || {};
    if (!rating) return res.status(400).json({ error: 'Rating is required.' });

    const reviews = await getCollection('reviews');
    const newReview = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      customerId: req.user.id,
      shopId: order.shopId,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [...reviews, newReview];
    await saveCollection('reviews', updatedReviews);

    // Recalculate average shop rating
    const shops = await getCollection('shops');
    const shopIndex = shops.findIndex(s => s.id === order.shopId);
    if (shopIndex !== -1) {
      const shopReviews = updatedReviews.filter(r => r.shopId === order.shopId);
      const avgRating = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
      shops[shopIndex] = { ...shops[shopIndex], rating: parseFloat(avgRating.toFixed(1)) };
      await saveCollection('shops', shops);
    }

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to submit review.' });
  }
});

export default router;
