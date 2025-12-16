import { create } from 'zustand';

// Core Entities
export interface Product {
  id: string;
  genericName: string;
  brandName: string;
  manufacturer: string;
  strength: string;
  unit: string;
  packSize: number;
  gstRate: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  licenseNo: string;
  paymentTerms: 'Net15' | 'Net30' | 'Net60' | 'COD';
  isActive: boolean;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  licenseNo: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: string;
}

export interface SupplyOrder {
  id: string;
  orderNo: string;
  hospitalId: string;
  hospitalName: string;
  orderDate: string;
  deliveryDate: string;
  items: SupplyOrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'Completed';
  generatedPOId?: string;
  createdAt: string;
}

export interface SupplyOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastRestockDate: string;
  lastRestockQuantity: number;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  balance: number;
  accountType: 'Checking' | 'Savings';
  isActive: boolean;
  createdAt: string;
}

export interface InternalTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  referenceNo: string;
  date: string;
  notes: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Tender {
  id: string;
  pvmsNo: string;
  type: string;
  genericName: string;
  brandName: string;
  manufacturerBrand: string;
  quotationSubmittedBy: string;
  isAuthorizedDistributor: boolean;
  packSize: string;
  retailPrice: number;
  tradePrice: number;
  offerPrice: number;
  gstApplicable: boolean;
  discountOffered: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  refNo: string;
  supplierName: string;
  poDate: string;
  deliveryAddress: string;
  items: POItem[];
  totalAmount: number;
  distributorDiscount: number;
  netPayableAmount: number;
  paymentMethod: 'Cash' | 'Cheque' | 'Bank';
  notes: string;
  createdAt: string;
}

export interface POItem {
  id: string;
  nomenclature: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  orderId: string;
  hospitalName: string;
  orderDate: string;
  receivedDate: string;
  items: SalesItem[];
  saleTotal: number;
  purchaseTotal: number;
  profit: number;
  paymentStatus: 'Pending' | 'Partial' | 'Cleared';
  createdAt: string;
}

export interface SalesItem {
  id: string;
  itemName: string;
  strength: string;
  quantity: number;
  packSize: string;
  quantityInPacks: number;
  poRate: number;
  saleTotal: number;
  purchaseRate: number;
  purchaseTotal: number;
}

export interface DeliveryChallan {
  id: string;
  dcNo: string;
  dcDate: string;
  poNo: string;
  poDate: string;
  buyerName: string;
  address: string;
  items: DCItem[];
  createdAt: string;
}

export interface DCItem {
  id: string;
  product: string;
  genericName: string;
  company: string;
  quantity: number;
  batch: string;
  mfgDate: string;
  expiryDate: string;
}

export interface Payment {
  id: string;
  poId: string;
  paymentMode: 'Cash' | 'Cheque' | 'Bank';
  referenceNo: string;
  paymentDate: string;
  amount: number;
  createdAt: string;
}

export interface DailyExpense {
  id: string;
  voucherNo: string;
  date: string;
  payTo: string;
  expenses: ExpenseItem[];
  totalAmount: number;
  attachedReceipts: number;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  reference: string;
  description: string;
  concernPerson: string;
  amount: number;
  headWiseCategory: string;
}

export interface SalaryVoucher {
  id: string;
  voucherNo: string;
  employeeName: string;
  date: string;
  grossSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  netSalaryPayable: number;
  bankName: string;
  accountNo: string;
  createdAt: string;
}

export interface Allowance {
  id: string;
  type: string;
  amount: number;
}

export interface Deduction {
  id: string;
  type: string;
  amount: number;
}

export interface SalesTaxInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  address: string;
  orderNumbers: string[];
  orderDates: string[];
  items: InvoiceItem[];
  totalNetAmount: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  product: string;
  manufacturerCompany: string;
  expiryDate: string;
  quantity: number;
  batchNo: string;
  rate: number;
  gstApplicable: boolean;
  netRate: number;
  amount: number;
}

interface AppStore {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Hospitals
  hospitals: Hospital[];
  addHospital: (hospital: Omit<Hospital, 'id' | 'createdAt'>) => void;
  updateHospital: (id: string, hospital: Partial<Hospital>) => void;
  deleteHospital: (id: string) => void;

  // Supply Orders
  supplyOrders: SupplyOrder[];
  addSupplyOrder: (order: Omit<SupplyOrder, 'id' | 'createdAt'>) => void;
  updateSupplyOrder: (id: string, order: Partial<SupplyOrder>) => void;
  deleteSupplyOrder: (id: string) => void;

  // Inventory
  inventoryItems: InventoryItem[];
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;

  // Bank Accounts
  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => void;
  updateBankAccount: (id: string, account: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Internal Transfers
  internalTransfers: InternalTransfer[];
  addInternalTransfer: (transfer: Omit<InternalTransfer, 'id' | 'createdAt'>) => void;
  updateInternalTransfer: (id: string, transfer: Partial<InternalTransfer>) => void;
  deleteInternalTransfer: (id: string) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Tenders
  tenders: Tender[];
  addTender: (tender: Omit<Tender, 'id' | 'createdAt'>) => void;
  updateTender: (id: string, tender: Partial<Tender>) => void;
  deleteTender: (id: string) => void;

  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  // Sales Orders
  salesOrders: SalesOrder[];
  addSalesOrder: (so: Omit<SalesOrder, 'id' | 'createdAt'>) => void;
  updateSalesOrder: (id: string, so: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;

  // Delivery Challans
  deliveryChallans: DeliveryChallan[];
  addDeliveryChallan: (dc: Omit<DeliveryChallan, 'id' | 'createdAt'>) => void;
  updateDeliveryChallan: (id: string, dc: Partial<DeliveryChallan>) => void;
  deleteDeliveryChallan: (id: string) => void;

  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  // Daily Expenses
  dailyExpenses: DailyExpense[];
  addDailyExpense: (expense: Omit<DailyExpense, 'id' | 'createdAt'>) => void;
  updateDailyExpense: (id: string, expense: Partial<DailyExpense>) => void;
  deleteDailyExpense: (id: string) => void;

  // Salary Vouchers
  salaryVouchers: SalaryVoucher[];
  addSalaryVoucher: (voucher: Omit<SalaryVoucher, 'id' | 'createdAt'>) => void;
  updateSalaryVoucher: (id: string, voucher: Partial<SalaryVoucher>) => void;
  deleteSalaryVoucher: (id: string) => void;

  // Sales Tax Invoices
  taxInvoices: SalesTaxInvoice[];
  addTaxInvoice: (invoice: Omit<SalesTaxInvoice, 'id' | 'createdAt'>) => void;
  updateTaxInvoice: (id: string, invoice: Partial<SalesTaxInvoice>) => void;
  deleteTaxInvoice: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useStore = create<AppStore>((set) => ({
  // Products
  products: [],
  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, { ...product, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  // Suppliers
  suppliers: [],
  addSupplier: (supplier) =>
    set((state) => ({
      suppliers: [...state.suppliers, { ...supplier, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateSupplier: (id, supplier) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...supplier } : s)),
    })),
  deleteSupplier: (id) =>
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== id),
    })),

  // Hospitals
  hospitals: [],
  addHospital: (hospital) =>
    set((state) => ({
      hospitals: [...state.hospitals, { ...hospital, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateHospital: (id, hospital) =>
    set((state) => ({
      hospitals: state.hospitals.map((h) => (h.id === id ? { ...h, ...hospital } : h)),
    })),
  deleteHospital: (id) =>
    set((state) => ({
      hospitals: state.hospitals.filter((h) => h.id !== id),
    })),

  // Supply Orders
  supplyOrders: [],
  addSupplyOrder: (order) =>
    set((state) => ({
      supplyOrders: [...state.supplyOrders, { ...order, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateSupplyOrder: (id, order) =>
    set((state) => ({
      supplyOrders: state.supplyOrders.map((o) => (o.id === id ? { ...o, ...order } : o)),
    })),
  deleteSupplyOrder: (id) =>
    set((state) => ({
      supplyOrders: state.supplyOrders.filter((o) => o.id !== id),
    })),

  // Inventory
  inventoryItems: [],
  updateInventoryItem: (id, item) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.map((i) => (i.id === id ? { ...i, ...item } : i)),
    })),

  // Bank Accounts
  bankAccounts: [],
  addBankAccount: (account) =>
    set((state) => ({
      bankAccounts: [...state.bankAccounts, { ...account, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateBankAccount: (id, account) =>
    set((state) => ({
      bankAccounts: state.bankAccounts.map((a) => (a.id === id ? { ...a, ...account } : a)),
    })),
  deleteBankAccount: (id) =>
    set((state) => ({
      bankAccounts: state.bankAccounts.filter((a) => a.id !== id),
    })),

  // Internal Transfers
  internalTransfers: [],
  addInternalTransfer: (transfer) =>
    set((state) => ({
      internalTransfers: [...state.internalTransfers, { ...transfer, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateInternalTransfer: (id, transfer) =>
    set((state) => ({
      internalTransfers: state.internalTransfers.map((t) => (t.id === id ? { ...t, ...transfer } : t)),
    })),
  deleteInternalTransfer: (id) =>
    set((state) => ({
      internalTransfers: state.internalTransfers.filter((t) => t.id !== id),
    })),

  // Users
  users: [],
  currentUser: null,
  addUser: (user) =>
    set((state) => ({
      users: [...state.users, { ...user, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateUser: (id, user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...user } : u)),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
  setCurrentUser: (user) => set({ currentUser: user }),

  // Tenders
  tenders: [],
  addTender: (tender) =>
    set((state) => ({
      tenders: [...state.tenders, { ...tender, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateTender: (id, tender) =>
    set((state) => ({
      tenders: state.tenders.map((t) => (t.id === id ? { ...t, ...tender } : t)),
    })),
  deleteTender: (id) =>
    set((state) => ({
      tenders: state.tenders.filter((t) => t.id !== id),
    })),

  // Purchase Orders
  purchaseOrders: [],
  addPurchaseOrder: (po) =>
    set((state) => ({
      purchaseOrders: [...state.purchaseOrders, { ...po, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updatePurchaseOrder: (id, po) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((p) => (p.id === id ? { ...p, ...po } : p)),
    })),
  deletePurchaseOrder: (id) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.filter((p) => p.id !== id),
    })),

  // Sales Orders
  salesOrders: [],
  addSalesOrder: (so) =>
    set((state) => ({
      salesOrders: [...state.salesOrders, { ...so, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateSalesOrder: (id, so) =>
    set((state) => ({
      salesOrders: state.salesOrders.map((s) => (s.id === id ? { ...s, ...so } : s)),
    })),
  deleteSalesOrder: (id) =>
    set((state) => ({
      salesOrders: state.salesOrders.filter((s) => s.id !== id),
    })),

  // Delivery Challans
  deliveryChallans: [],
  addDeliveryChallan: (dc) =>
    set((state) => ({
      deliveryChallans: [...state.deliveryChallans, { ...dc, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateDeliveryChallan: (id, dc) =>
    set((state) => ({
      deliveryChallans: state.deliveryChallans.map((d) => (d.id === id ? { ...d, ...dc } : d)),
    })),
  deleteDeliveryChallan: (id) =>
    set((state) => ({
      deliveryChallans: state.deliveryChallans.filter((d) => d.id !== id),
    })),

  // Payments
  payments: [],
  addPayment: (payment) =>
    set((state) => ({
      payments: [...state.payments, { ...payment, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updatePayment: (id, payment) =>
    set((state) => ({
      payments: state.payments.map((p) => (p.id === id ? { ...p, ...payment } : p)),
    })),
  deletePayment: (id) =>
    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id),
    })),

  // Daily Expenses
  dailyExpenses: [],
  addDailyExpense: (expense) =>
    set((state) => ({
      dailyExpenses: [...state.dailyExpenses, { ...expense, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateDailyExpense: (id, expense) =>
    set((state) => ({
      dailyExpenses: state.dailyExpenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
    })),
  deleteDailyExpense: (id) =>
    set((state) => ({
      dailyExpenses: state.dailyExpenses.filter((e) => e.id !== id),
    })),

  // Salary Vouchers
  salaryVouchers: [],
  addSalaryVoucher: (voucher) =>
    set((state) => ({
      salaryVouchers: [...state.salaryVouchers, { ...voucher, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateSalaryVoucher: (id, voucher) =>
    set((state) => ({
      salaryVouchers: state.salaryVouchers.map((v) => (v.id === id ? { ...v, ...voucher } : v)),
    })),
  deleteSalaryVoucher: (id) =>
    set((state) => ({
      salaryVouchers: state.salaryVouchers.filter((v) => v.id !== id),
    })),

  // Sales Tax Invoices
  taxInvoices: [],
  addTaxInvoice: (invoice) =>
    set((state) => ({
      taxInvoices: [...state.taxInvoices, { ...invoice, id: generateId(), createdAt: new Date().toISOString() }],
    })),
  updateTaxInvoice: (id, invoice) =>
    set((state) => ({
      taxInvoices: state.taxInvoices.map((i) => (i.id === id ? { ...i, ...invoice } : i)),
    })),
  deleteTaxInvoice: (id) =>
    set((state) => ({
      taxInvoices: state.taxInvoices.filter((i) => i.id !== id),
    })),
}));
