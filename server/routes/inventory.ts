import { Router } from 'express';
import { mockInventoryItems } from '../mockData';

const router = Router();

let inventoryItems = [...mockInventoryItems];

// Inventory Items Routes
router.get('/inventory', (req, res) => {
  res.json(inventoryItems);
});

router.post('/inventory', (req, res) => {
  const newItem = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  inventoryItems.push(newItem);
  res.status(201).json(newItem);
});

router.get('/inventory/:id', (req, res) => {
  const item = inventoryItems.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(item);
});

router.put('/inventory/:id', (req, res) => {
  const index = inventoryItems.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  const updatedItem = { ...inventoryItems[index], ...req.body };
  updatedItem.availableStock = updatedItem.currentStock - updatedItem.reservedStock;
  inventoryItems[index] = updatedItem;
  res.json(inventoryItems[index]);
});

router.delete('/inventory/:id', (req, res) => {
  const index = inventoryItems.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  const deleted = inventoryItems.splice(index, 1);
  res.json(deleted[0]);
});

// Inventory Adjustment Route
router.post('/inventory/:id/adjust', (req, res) => {
  const { adjustment, reason } = req.body;

  const index = inventoryItems.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const item = inventoryItems[index];
  const newStock = item.currentStock + adjustment;

  if (newStock < 0) {
    return res.status(400).json({ error: 'Adjustment would result in negative stock' });
  }

  item.currentStock = newStock;
  item.availableStock = item.currentStock - item.reservedStock;
  item.lastRestockDate = new Date().toISOString();
  item.lastRestockQuantity = adjustment;

  res.json({
    success: true,
    message: `Stock adjusted by ${adjustment} (${reason})`,
    item,
  });
});

export default router;
