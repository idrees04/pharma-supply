import { Router } from 'express';
import { mockSalesOrders, mockSupplyOrders, mockPurchaseOrders } from '../mockData';

const router = Router();

let salesOrders = [...mockSalesOrders];
let supplyOrders = [...mockSupplyOrders];
let purchaseOrders = [...mockPurchaseOrders];

// Sales Orders Routes
router.get('/sales-orders', (req, res) => {
  res.json(salesOrders);
});

router.post('/sales-orders', (req, res) => {
  const newOrder = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  salesOrders.push(newOrder);
  res.status(201).json(newOrder);
});

router.get('/sales-orders/:id', (req, res) => {
  const order = salesOrders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Sales order not found' });
  }
  res.json(order);
});

router.put('/sales-orders/:id', (req, res) => {
  const index = salesOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sales order not found' });
  }
  salesOrders[index] = { ...salesOrders[index], ...req.body };
  res.json(salesOrders[index]);
});

router.delete('/sales-orders/:id', (req, res) => {
  const index = salesOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sales order not found' });
  }
  const deleted = salesOrders.splice(index, 1);
  res.json(deleted[0]);
});

// Supply Orders Routes
router.get('/supply-orders', (req, res) => {
  res.json(supplyOrders);
});

router.post('/supply-orders', (req, res) => {
  const newOrder = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  supplyOrders.push(newOrder);
  res.status(201).json(newOrder);
});

router.get('/supply-orders/:id', (req, res) => {
  const order = supplyOrders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Supply order not found' });
  }
  res.json(order);
});

router.put('/supply-orders/:id', (req, res) => {
  const index = supplyOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supply order not found' });
  }
  supplyOrders[index] = { ...supplyOrders[index], ...req.body };
  res.json(supplyOrders[index]);
});

router.delete('/supply-orders/:id', (req, res) => {
  const index = supplyOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supply order not found' });
  }
  const deleted = supplyOrders.splice(index, 1);
  res.json(deleted[0]);
});

// Purchase Orders Routes
router.get('/purchase-orders', (req, res) => {
  res.json(purchaseOrders);
});

router.post('/purchase-orders', (req, res) => {
  const newOrder = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  purchaseOrders.push(newOrder);
  res.status(201).json(newOrder);
});

router.get('/purchase-orders/:id', (req, res) => {
  const order = purchaseOrders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  res.json(order);
});

router.put('/purchase-orders/:id', (req, res) => {
  const index = purchaseOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  purchaseOrders[index] = { ...purchaseOrders[index], ...req.body };
  res.json(purchaseOrders[index]);
});

router.delete('/purchase-orders/:id', (req, res) => {
  const index = purchaseOrders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  const deleted = purchaseOrders.splice(index, 1);
  res.json(deleted[0]);
});

export default router;
