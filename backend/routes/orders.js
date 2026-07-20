import express from 'express';
import { getCollection, saveCollection, deductPoints, awardPoints } from '../config/db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create Order (Customer only)
router.post('/', auth, authorize('customer'), (req, res) => {
  try {
    const {
      shopId,
      documentId,
      printSettings, // { colorMode, sideMode, paperSize, copies, pageRange }
      deliveryType,  // 'pickup' or 'delivery'
      deliveryAddress,
      redeemPoints   // points to redeem for discount
    } = req.body;

    if (!shopId || !documentId || !printSettings) {
      return res.status(400).json({ error: "Missing required order parameters." });
    }

    const shops = getCollection('shops');
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return res.status(404).json({ error: "Shop not found." });

    const documents = getCollection('documents');
    const doc = documents.find(d => d.id === documentId && d.userId === req.user.id);
    if (!doc) return res.status(404).json({ error: "Uploaded document not found." });

    // Calculate total pages based on page range or complete file
    let pagesToPrint = doc.pageCount;
    if (printSettings.pageRange && printSettings.pageRange.trim() !== "") {
      // Basic range parser, e.g., "1-5" or "3, 5, 8"
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

    // Ensure range doesn't exceed total pages
    pagesToPrint = Math.min(pagesToPrint, doc.pageCount);

    // Pricing calculation
    const isColor = printSettings.colorMode === 'color';
    const isDouble = printSettings.sideMode === 'double';
    const isA3 = printSettings.paperSize === 'A3';

    let ratePerPage = isColor ? shop.pricing.color : shop.pricing.bw;
    
    // Apply extra paper size charge
    if (isA3) {
      ratePerPage += shop.pricing.a3 || 0;
    }

    let subtotal = ratePerPage * pagesToPrint * (printSettings.copies || 1);
    
    // Delivery fee
    let deliveryFee = 0;
    if (deliveryType === 'delivery') {
      deliveryFee = shop.pricing.delivery || 30;
    }

    // Redeem points discount calculations (1 point = 1 rupee discount)
    const users = getCollection('users');
    const dbUser = users.find(u => u.id === req.user.id);
    let discount = 0;
    let pointsRedeemed = 0;
    if (redeemPoints && redeemPoints > 0) {
      pointsRedeemed = Math.min(parseInt(redeemPoints), dbUser.points || 0);
      discount = pointsRedeemed;
    }

    const totalPrice = Math.max(0, subtotal + deliveryFee - discount);

    const newOrder = {
      id: "ord_" + Math.random().toString(36).substr(2, 9),
      customerId: req.user.id,
      shopId,
      documentId,
      documentName: doc.filename,
      documentPath: doc.filePath,
      pageCount: doc.pageCount,
      printSettings,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : "",
      totalPrice,
      pointsRedeemed,
      discount,
      status: "pending", // pending, accepted, printing, ready_for_pickup, out_for_delivery, completed, rejected
      deliveryAgentId: null,
      createdAt: new Date().toISOString()
    };

    const orders = getCollection('orders');
    orders.push(newOrder);
    saveCollection('orders', orders);

    // Deduct points instantly if redeemed
    if (pointsRedeemed > 0) {
      deductPoints(req.user.id, pointsRedeemed);
    }

    res.status(201).json(newOrder);

  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to place order." });
  }
});

// Get Customer Orders
router.get('/customer', auth, authorize('customer'), (req, res) => {
  const orders = getCollection('orders');
  const shops = getCollection('shops');
  const customerOrders = orders.filter(o => o.customerId === req.user.id);
  
  // Attach shop names
  const populated = customerOrders.map(o => {
    const shop = shops.find(s => s.id === o.shopId);
    return {
      ...o,
      shopName: shop ? shop.name : "Unknown Shop"
    };
  });
  
  // Sort descending by date
  populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(populated);
});

// Get Shop Orders (Shop owner only)
router.get('/shop/:shopId', auth, authorize(['shop_owner', 'admin']), (req, res) => {
  const shops = getCollection('shops');
  const shop = shops.find(s => s.id === req.params.shopId);

  if (!shop) return res.status(404).json({ error: "Shop not found." });
  if (req.user.role !== 'admin' && shop.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized access to this shop's orders." });
  }

  const orders = getCollection('orders');
  const users = getCollection('users');
  const shopOrders = orders.filter(o => o.shopId === req.params.shopId);

  // Attach customer details
  const populated = shopOrders.map(o => {
    const cust = users.find(u => u.id === o.customerId);
    const agent = o.deliveryAgentId ? users.find(u => u.id === o.deliveryAgentId) : null;
    return {
      ...o,
      customerName: cust ? cust.name : "Customer",
      customerPhone: cust ? cust.phone : "",
      customerPoints: cust ? (cust.points || 0) : 0,
      deliveryAgentName: agent ? agent.name : ""
    };
  });

  populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(populated);
});

// Update Order Status (Shop owner, Delivery agent, Admin)
router.put('/:id/status', auth, (req, res) => {
  const orders = getCollection('orders');
  const index = orders.findIndex(o => o.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Order not found." });
  }

  const order = orders[index];
  const { status, deliveryAgentId } = req.body;
  const oldStatus = order.status;
  const validStatuses = ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'rejected'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  // Update order fields
  if (status) order.status = status;
  if (deliveryAgentId !== undefined) order.deliveryAgentId = deliveryAgentId;

  orders[index] = order;
  saveCollection('orders', orders);

  // Award points on order completion (1 point per page)
  if (status === 'completed' && oldStatus !== 'completed') {
    let printedPages = order.pageCount * (order.printSettings.copies || 1);
    awardPoints(order.customerId, printedPages);
  }

  res.json(order);
});

// Mock Pay Endpoint
router.post('/:id/pay', auth, authorize('customer'), (req, res) => {
  const orders = getCollection('orders');
  const order = orders.find(o => o.id === req.params.id && o.customerId === req.user.id);

  if (!order) return res.status(404).json({ error: "Order not found." });

  const payments = getCollection('payments');
  const newPayment = {
    id: "pay_" + Math.random().toString(36).substr(2, 9),
    orderId: order.id,
    amount: order.totalPrice,
    paymentMethod: req.body.paymentMethod || 'online',
    paymentStatus: 'completed',
    transactionId: "TXN_" + Math.round(Math.random() * 1e12),
    createdAt: new Date().toISOString()
  };

  payments.push(newPayment);
  saveCollection('payments', payments);

  res.json({ message: "Payment successful", payment: newPayment });
});

// Submit Review
router.post('/:id/review', auth, authorize('customer'), (req, res) => {
  const orders = getCollection('orders');
  const order = orders.find(o => o.id === req.params.id && o.customerId === req.user.id);

  if (!order) return res.status(404).json({ error: "Order not found." });

  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: "Rating is required." });

  const reviews = getCollection('reviews');
  const newReview = {
    id: "rev_" + Math.random().toString(36).substr(2, 9),
    customerId: req.user.id,
    shopId: order.shopId,
    rating: parseInt(rating),
    comment: comment || "",
    createdAt: new Date().toISOString()
  };

  reviews.push(newReview);
  saveCollection('reviews', reviews);

  // Re-calculate average shop rating
  const shops = getCollection('shops');
  const shopIndex = shops.findIndex(s => s.id === order.shopId);
  if (shopIndex !== -1) {
    const shopReviews = reviews.filter(r => r.shopId === order.shopId);
    const avgRating = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
    shops[shopIndex].rating = parseFloat(avgRating.toFixed(1));
    saveCollection('shops', shops);
  }

  res.status(201).json(newReview);
});

export default router;
