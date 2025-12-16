import { Router } from 'express';
import { mockProducts, mockSuppliers, mockHospitals } from '../mockData';

const router = Router();

let products = [...mockProducts];
let suppliers = [...mockSuppliers];
let hospitals = [...mockHospitals];

// Products Routes
router.get('/products', (req, res) => {
  res.json(products);
});

router.post('/products', (req, res) => {
  const newProduct = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

router.get('/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

router.put('/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

router.delete('/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const deleted = products.splice(index, 1);
  res.json(deleted[0]);
});

// Suppliers Routes
router.get('/suppliers', (req, res) => {
  res.json(suppliers);
});

router.post('/suppliers', (req, res) => {
  const newSupplier = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  suppliers.push(newSupplier);
  res.status(201).json(newSupplier);
});

router.get('/suppliers/:id', (req, res) => {
  const supplier = suppliers.find((s) => s.id === req.params.id);
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  res.json(supplier);
});

router.put('/suppliers/:id', (req, res) => {
  const index = suppliers.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  suppliers[index] = { ...suppliers[index], ...req.body };
  res.json(suppliers[index]);
});

router.delete('/suppliers/:id', (req, res) => {
  const index = suppliers.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supplier not found' });
  }
  const deleted = suppliers.splice(index, 1);
  res.json(deleted[0]);
});

// Hospitals Routes
router.get('/hospitals', (req, res) => {
  res.json(hospitals);
});

router.post('/hospitals', (req, res) => {
  const newHospital = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  hospitals.push(newHospital);
  res.status(201).json(newHospital);
});

router.get('/hospitals/:id', (req, res) => {
  const hospital = hospitals.find((h) => h.id === req.params.id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  res.json(hospital);
});

router.put('/hospitals/:id', (req, res) => {
  const index = hospitals.findIndex((h) => h.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  hospitals[index] = { ...hospitals[index], ...req.body };
  res.json(hospitals[index]);
});

router.delete('/hospitals/:id', (req, res) => {
  const index = hospitals.findIndex((h) => h.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  const deleted = hospitals.splice(index, 1);
  res.json(deleted[0]);
});

export default router;
