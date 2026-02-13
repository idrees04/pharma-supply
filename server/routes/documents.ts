import { Router } from 'express';
import { mockDeliveryChallans, mockSalesTaxInvoices, mockTenders } from '../mockData';

const router = Router();

let deliveryChallans = [...mockDeliveryChallans];
let taxInvoices = [...mockSalesTaxInvoices];
let tenders = [...mockTenders];

// Delivery Challan Routes
router.get('/delivery-challans', (req, res) => {
  res.json(deliveryChallans);
});

router.post('/delivery-challans', (req, res) => {
  const newDC = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  deliveryChallans.push(newDC);
  res.status(201).json(newDC);
});

router.get('/delivery-challans/:id', (req, res) => {
  const dc = deliveryChallans.find((d) => d.id === req.params.id);
  if (!dc) {
    return res.status(404).json({ error: 'Delivery challan not found' });
  }
  res.json(dc);
});

router.put('/delivery-challans/:id', (req, res) => {
  const index = deliveryChallans.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery challan not found' });
  }
  deliveryChallans[index] = { ...deliveryChallans[index], ...req.body };
  res.json(deliveryChallans[index]);
});

router.delete('/delivery-challans/:id', (req, res) => {
  const index = deliveryChallans.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Delivery challan not found' });
  }
  const deleted = deliveryChallans.splice(index, 1);
  res.json(deleted[0]);
});

// Sales Tax Invoice Routes
router.get('/tax-invoices', (req, res) => {
  res.json(taxInvoices);
});

router.post('/tax-invoices', (req, res) => {
  const newInvoice = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  taxInvoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

router.get('/tax-invoices/:id', (req, res) => {
  const invoice = taxInvoices.find((i) => i.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Sales tax invoice not found' });
  }
  res.json(invoice);
});

router.put('/tax-invoices/:id', (req, res) => {
  const index = taxInvoices.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sales tax invoice not found' });
  }
  taxInvoices[index] = { ...taxInvoices[index], ...req.body };
  res.json(taxInvoices[index]);
});

router.delete('/tax-invoices/:id', (req, res) => {
  const index = taxInvoices.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sales tax invoice not found' });
  }
  const deleted = taxInvoices.splice(index, 1);
  res.json(deleted[0]);
});

// Tender Routes
router.get('/tenders', (req, res) => {
  res.json(tenders);
});

router.post('/tenders', (req, res) => {
  const newTender = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  tenders.push(newTender);
  res.status(201).json(newTender);
});

router.get('/tenders/:id', (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id);
  if (!tender) {
    return res.status(404).json({ error: 'Tender not found' });
  }
  res.json(tender);
});

router.put('/tenders/:id', (req, res) => {
  const index = tenders.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tender not found' });
  }
  tenders[index] = { ...tenders[index], ...req.body };
  res.json(tenders[index]);
});

router.delete('/tenders/:id', (req, res) => {
  const index = tenders.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tender not found' });
  }
  const deleted = tenders.splice(index, 1);
  res.json(deleted[0]);
});

export default router;
