import { Router } from 'express';
import {
  mockDailyExpenses,
  mockSalaryVouchers,
  mockBankAccounts,
  mockInventoryItems,
} from '../mockData';

const router = Router();

let dailyExpenses = [...mockDailyExpenses];
let salaryVouchers = [...mockSalaryVouchers];
let bankAccounts = [...mockBankAccounts];
let internalTransfers: any[] = [];
let payments: any[] = [];

// Daily Expenses Routes
router.get('/daily-expenses', (req, res) => {
  res.json(dailyExpenses);
});

router.post('/daily-expenses', (req, res) => {
  const newExpense = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  dailyExpenses.push(newExpense);
  res.status(201).json(newExpense);
});

router.get('/daily-expenses/:id', (req, res) => {
  const expense = dailyExpenses.find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ error: 'Daily expense not found' });
  }
  res.json(expense);
});

router.put('/daily-expenses/:id', (req, res) => {
  const index = dailyExpenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Daily expense not found' });
  }
  dailyExpenses[index] = { ...dailyExpenses[index], ...req.body };
  res.json(dailyExpenses[index]);
});

router.delete('/daily-expenses/:id', (req, res) => {
  const index = dailyExpenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Daily expense not found' });
  }
  const deleted = dailyExpenses.splice(index, 1);
  res.json(deleted[0]);
});

// Salary Vouchers Routes
router.get('/salary-vouchers', (req, res) => {
  res.json(salaryVouchers);
});

router.post('/salary-vouchers', (req, res) => {
  const newVoucher = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  salaryVouchers.push(newVoucher);
  res.status(201).json(newVoucher);
});

router.get('/salary-vouchers/:id', (req, res) => {
  const voucher = salaryVouchers.find((v) => v.id === req.params.id);
  if (!voucher) {
    return res.status(404).json({ error: 'Salary voucher not found' });
  }
  res.json(voucher);
});

router.put('/salary-vouchers/:id', (req, res) => {
  const index = salaryVouchers.findIndex((v) => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Salary voucher not found' });
  }
  salaryVouchers[index] = { ...salaryVouchers[index], ...req.body };
  res.json(salaryVouchers[index]);
});

router.delete('/salary-vouchers/:id', (req, res) => {
  const index = salaryVouchers.findIndex((v) => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Salary voucher not found' });
  }
  const deleted = salaryVouchers.splice(index, 1);
  res.json(deleted[0]);
});

// Bank Accounts Routes
router.get('/bank-accounts', (req, res) => {
  res.json(bankAccounts);
});

router.post('/bank-accounts', (req, res) => {
  const newAccount = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  bankAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

router.get('/bank-accounts/:id', (req, res) => {
  const account = bankAccounts.find((a) => a.id === req.params.id);
  if (!account) {
    return res.status(404).json({ error: 'Bank account not found' });
  }
  res.json(account);
});

router.put('/bank-accounts/:id', (req, res) => {
  const index = bankAccounts.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Bank account not found' });
  }
  bankAccounts[index] = { ...bankAccounts[index], ...req.body };
  res.json(bankAccounts[index]);
});

router.delete('/bank-accounts/:id', (req, res) => {
  const index = bankAccounts.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Bank account not found' });
  }
  const deleted = bankAccounts.splice(index, 1);
  res.json(deleted[0]);
});

// Internal Transfers Routes
router.get('/internal-transfers', (req, res) => {
  res.json(internalTransfers);
});

router.post('/internal-transfers', (req, res) => {
  const newTransfer = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };

  const fromAccount = bankAccounts.find((a) => a.id === req.body.fromAccountId);
  const toAccount = bankAccounts.find((a) => a.id === req.body.toAccountId);

  if (!fromAccount || !toAccount) {
    return res.status(404).json({ error: 'One or both accounts not found' });
  }

  if (fromAccount.balance < req.body.amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  fromAccount.balance -= req.body.amount;
  toAccount.balance += req.body.amount;

  internalTransfers.push(newTransfer);
  res.status(201).json(newTransfer);
});

router.get('/internal-transfers/:id', (req, res) => {
  const transfer = internalTransfers.find((t) => t.id === req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Internal transfer not found' });
  }
  res.json(transfer);
});

router.delete('/internal-transfers/:id', (req, res) => {
  const index = internalTransfers.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Internal transfer not found' });
  }
  const deleted = internalTransfers.splice(index, 1);
  res.json(deleted[0]);
});

// Payments Routes
router.get('/payments', (req, res) => {
  res.json(payments);
});

router.post('/payments', (req, res) => {
  const newPayment = {
    ...req.body,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  res.status(201).json(newPayment);
});

router.get('/payments/:id', (req, res) => {
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

router.put('/payments/:id', (req, res) => {
  const index = payments.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  payments[index] = { ...payments[index], ...req.body };
  res.json(payments[index]);
});

router.delete('/payments/:id', (req, res) => {
  const index = payments.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  const deleted = payments.splice(index, 1);
  res.json(deleted[0]);
});

export default router;
