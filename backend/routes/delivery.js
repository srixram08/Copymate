import express from 'express';
import { getCollection, saveCollection, awardPoints } from '../config/db.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get list of deliveries available for any agent to pick up
router.get('/available', auth, authorize('delivery_agent'), (req, res) => {
  const orders = getCollection('orders');
  const shops = getCollection('shops');
  
  // Available means: status is 'ready_for_pickup', deliveryType is 'delivery', and agent not assigned yet
  const availableOrders = orders.filter(o => 
    o.status === 'ready_for_pickup' && 
    o.deliveryType === 'delivery' && 
    !o.deliveryAgentId
  );

  const populated = availableOrders.map(o => {
    const shop = shops.find(s => s.id === o.shopId);
    return {
      ...o,
      shopName: shop ? shop.name : "Unknown Shop",
      shopAddress: shop ? shop.address : "",
      shopPhone: shop ? shop.phone : ""
    };
  });

  res.json(populated);
});

// Get agent's active and historical deliveries
router.get('/agent', auth, authorize('delivery_agent'), (req, res) => {
  const orders = getCollection('orders');
  const shops = getCollection('shops');
  const agentOrders = orders.filter(o => o.deliveryAgentId === req.user.id);

  const populated = agentOrders.map(o => {
    const shop = shops.find(s => s.id === o.shopId);
    return {
      ...o,
      shopName: shop ? shop.name : "Unknown Shop",
      shopAddress: shop ? shop.address : "",
      shopPhone: shop ? shop.phone : ""
    };
  });

  // Sort descending by date
  populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(populated);
});

// Pick up order: Change status to 'out_for_delivery' and assign agent
router.put('/:id/pickup', auth, authorize('delivery_agent'), (req, res) => {
  const orders = getCollection('orders');
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Order not found." });
  }

  const order = orders[index];
  if (order.status !== 'ready_for_pickup' || order.deliveryType !== 'delivery') {
    return res.status(400).json({ error: "Order is not ready for delivery pickup." });
  }

  order.status = 'out_for_delivery';
  order.deliveryAgentId = req.user.id;

  orders[index] = order;
  saveCollection('orders', orders);

  res.json(order);
});

// Confirm delivery: Change status to 'completed'
router.put('/:id/deliver', auth, authorize('delivery_agent'), (req, res) => {
  const orders = getCollection('orders');
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Order not found." });
  }

  const order = orders[index];
  if (order.deliveryAgentId !== req.user.id) {
    return res.status(403).json({ error: "You are not authorized for this delivery." });
  }

  const oldStatus = order.status;
  order.status = 'completed';

  orders[index] = order;
  saveCollection('orders', orders);

  // Award points on order completion (1 point per page)
  if (oldStatus !== 'completed') {
    let printedPages = order.pageCount * (order.printSettings.copies || 1);
    awardPoints(order.customerId, printedPages);
  }

  res.json(order);
});

export default router;
