import { z } from "zod";

// Product Schema - Matches API specification
export const productSchema = z.object({
  productName: z.string().min(1, "Product Name is required"),
  genericName: z.string().min(1, "Generic Name is required"),
  productCode: z.string().min(1, "Product Code is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  productTypeId: z.coerce.number().int().min(1, "Product Type is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub Category is required"),
  unitId: z.coerce.number().int().min(1, "Unit of Measure is required"),
  standardPurchaseRate: z.coerce
    .number()
    .min(0, "Standard Purchase Rate must be non-negative"),
  standardSaleRate: z.coerce
    .number()
    .min(0, "Standard Sale Rate must be non-negative"),
  taxPercentage: z.coerce
    .number()
    .min(0, "Tax Percentage must be non-negative"),
  reorderLevel: z.coerce
    .number()
    .int()
    .min(0, "Reorder Level must be non-negative"),
  reorderQuantity: z.coerce
    .number()
    .int()
    .min(1, "Reorder Quantity must be positive"),
  hsnCode: z.string().min(1, "HSN Code is required"),
  isBatchRequired: z.boolean().default(false),
  description: z.string().optional().default(""),
  requiresPrescription: z.boolean().default(false),
  storageConditions: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Supplier Schema - Matches API specification (CreateSupplierRequest & UpdateSupplierRequest)
export const supplierSchema = z.object({
  supplierName: z.string().min(1, "Supplier Name is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
  country: z.string().min(1, "Country is required"),
  taxNumber: z.string().min(1, "Tax Number is required"),
  licenseNumber: z.string().min(1, "License Number is required"),
  paymentTermDays: z.coerce
    .number()
    .int()
    .min(0, "Payment Term Days must be non-negative"),
  creditLimit: z.coerce.number().min(0, "Credit Limit must be non-negative"),
  notes: z.string().optional().default(""),
  status: z.coerce
    .number()
    .int()
    .min(0, "Status must be non-negative")
    .optional()
    .default(1),
  isActive: z.boolean().default(true),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// Hospital Schema - Matches API specification
export const hospitalSchema = z.object({
  hospitalName: z.string().min(1, "Hospital Name is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal Code is required"),
  taxNumber: z.string().min(1, "Tax Number is required"),
  registrationNumber: z.string().min(1, "Registration Number is required"),
  hospitalType: z.coerce.number().int().min(0, "Hospital Type is required"),
  creditTermDays: z.coerce
    .number()
    .int()
    .min(0, "Credit Term Days must be non-negative"),
  creditLimit: z.coerce.number().min(0, "Credit Limit must be non-negative"),
  status: z.coerce
    .number()
    .int()
    .min(0, "Status is required")
    .optional()
    .default(1),
  isActive: z.boolean().default(true),
});

export type HospitalFormData = z.infer<typeof hospitalSchema>;

// Supply Order Item Schema
export const supplyOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product Name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit Price must be positive"),
});

// Supply Order Schema
export const supplyOrderSchema = z.object({
  orderNo: z.string().min(1, "Order No is required"),
  hospitalId: z.string().min(1, "Hospital is required"),
  hospitalName: z.string().min(1, "Hospital Name is required"),
  orderDate: z.string().min(1, "Order Date is required"),
  deliveryDate: z.string().min(1, "Delivery Date is required"),
  items: z.array(supplyOrderItemSchema).min(1, "At least one item is required"),
  status: z.enum(["Draft", "Confirmed", "Completed"]).default("Draft"),
});

export type SupplyOrderFormData = z.infer<typeof supplyOrderSchema>;

// Bank Account Schema
export const bankAccountSchema = z.object({
  accountName: z.string().min(1, "Account Name is required"),
  accountNo: z.string().min(1, "Account No is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  balance: z.coerce.number().min(0, "Balance must be non-negative"),
  accountType: z.enum(["Checking", "Savings"]),
  isActive: z.boolean().default(true),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

// Internal Transfer Schema
export const internalTransferSchema = z.object({
  fromAccountId: z.string().min(1, "From Account is required"),
  toAccountId: z.string().min(1, "To Account is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  referenceNo: z.string().min(1, "Reference No is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export type InternalTransferFormData = z.infer<typeof internalTransferSchema>;

// User Schema
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "manager", "accountant", "warehouse", "sales"]),
  isActive: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;

// Tender Schema
export const tenderSchema = z.object({
  pvmsNo: z.string().min(1, "PVMS No is required"),
  type: z.string().min(1, "Type is required"),
  genericName: z.string().min(1, "Generic Name is required"),
  brandName: z.string().min(1, "Brand Name is required"),
  manufacturerBrand: z.string().min(1, "Manufacturer Brand is required"),
  quotationSubmittedBy: z.string().min(1, "Quotation Submitted By is required"),
  isAuthorizedDistributor: z.boolean().default(false),
  packSize: z.string().min(1, "Pack Size is required"),
  retailPrice: z.coerce.number().positive("Retail Price must be positive"),
  tradePrice: z.coerce.number().positive("Trade Price must be positive"),
  offerPrice: z.coerce.number().positive("Offer Price must be positive"),
  gstApplicable: z.boolean().default(false),
  discountOffered: z.coerce.number().min(0, "Discount must be non-negative"),
});

export type TenderFormData = z.infer<typeof tenderSchema>;

// Purchase Order Schema
export const poItemSchema = z.object({
  nomenclature: z.string().min(1, "Nomenclature is required"),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
});

export const purchaseOrderSchema = z.object({
  refNo: z.string().min(1, "Reference No is required"),
  supplierName: z.string().min(1, "Supplier Name is required"),
  poDate: z.string().min(1, "PO Date is required"),
  deliveryAddress: z.string().min(1, "Delivery Address is required"),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  distributorDiscount: z.coerce
    .number()
    .min(0, "Discount must be non-negative"),
  paymentMethod: z.enum(["Cash", "Cheque", "Bank"]),
  notes: z.string().optional(),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

// Sales Order Schema
export const salesItemSchema = z.object({
  itemName: z.string().min(1, "Item Name is required"),
  strength: z.string().min(1, "Strength is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  packSize: z.string().min(1, "Pack Size is required"),
  quantityInPacks: z.coerce
    .number()
    .positive("Quantity in Packs must be positive"),
  poRate: z.coerce.number().positive("PO Rate must be positive"),
  purchaseRate: z.coerce.number().positive("Purchase Rate must be positive"),
});

export const salesOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  hospitalName: z.string().min(1, "Hospital Name is required"),
  orderDate: z.string().min(1, "Order Date is required"),
  receivedDate: z.string().min(1, "Received Date is required"),
  items: z.array(salesItemSchema).min(1, "At least one item is required"),
  paymentStatus: z.enum(["Pending", "Partial", "Cleared"]),
});

export type SalesOrderFormData = z.infer<typeof salesOrderSchema>;

// Delivery Challan Schema
export const dcItemSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  genericName: z.string().min(1, "Generic Name is required"),
  company: z.string().min(1, "Company is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  batch: z.string().min(1, "Batch No is required"),
  mfgDate: z.string().min(1, "Manufacturing Date is required"),
  expiryDate: z.string().min(1, "Expiry Date is required"),
});

export const deliveryChallanSchema = z.object({
  dcNo: z.string().min(1, "DC No is required"),
  dcDate: z.string().min(1, "DC Date is required"),
  poNo: z.string().min(1, "PO No is required"),
  poDate: z.string().min(1, "PO Date is required"),
  buyerName: z.string().min(1, "Buyer Name is required"),
  address: z.string().min(1, "Address is required"),
  items: z.array(dcItemSchema).min(1, "At least one item is required"),
});

export type DeliveryChallanFormData = z.infer<typeof deliveryChallanSchema>;

// Payment Schema
export const paymentSchema = z.object({
  poId: z.string().min(1, "PO ID is required"),
  paymentMode: z.enum(["Cash", "Cheque", "Bank"]),
  referenceNo: z.string().min(1, "Reference No is required"),
  paymentDate: z.string().min(1, "Payment Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Daily Expense Schema
export const expenseItemSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  description: z.string().min(1, "Description is required"),
  concernPerson: z.string().min(1, "Concern Person is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  headWiseCategory: z.string().min(1, "Category is required"),
});

export const dailyExpenseSchema = z.object({
  voucherNo: z.string().min(1, "Voucher No is required"),
  date: z.string().min(1, "Date is required"),
  payTo: z.string().min(1, "Pay To is required"),
  expenses: z
    .array(expenseItemSchema)
    .min(1, "At least one expense is required"),
  attachedReceipts: z.coerce
    .number()
    .min(0, "Receipts count must be non-negative"),
});

export type DailyExpenseFormData = z.infer<typeof dailyExpenseSchema>;

// Salary Voucher Schema
export const allowanceSchema = z.object({
  type: z.string().min(1, "Allowance type is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

export const deductionSchema = z.object({
  type: z.string().min(1, "Deduction type is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

export const salaryVoucherSchema = z.object({
  voucherNo: z.string().min(1, "Voucher No is required"),
  employeeName: z.string().min(1, "Employee Name is required"),
  date: z.string().min(1, "Date is required"),
  grossSalary: z.coerce.number().positive("Gross Salary must be positive"),
  allowances: z.array(allowanceSchema).optional(),
  deductions: z.array(deductionSchema).optional(),
  bankName: z.string().min(1, "Bank Name is required"),
  accountNo: z.string().min(1, "Account No is required"),
});

export type SalaryVoucherFormData = z.infer<typeof salaryVoucherSchema>;

// Sales Tax Invoice Schema
export const invoiceItemSchema = z.object({
  product: z.string().min(1, "Product is required"),
  manufacturerCompany: z.string().min(1, "Manufacturer Company is required"),
  expiryDate: z.string().min(1, "Expiry Date is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  batchNo: z.string().min(1, "Batch No is required"),
  rate: z.coerce.number().positive("Rate must be positive"),
  gstApplicable: z.boolean().default(false),
});

export const salesTaxInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice No is required"),
  invoiceDate: z.string().min(1, "Invoice Date is required"),
  customerName: z.string().min(1, "Customer Name is required"),
  address: z.string().min(1, "Address is required"),
  orderNumbers: z
    .array(z.string())
    .min(1, "At least one order number is required"),
  orderDates: z.array(z.string()).min(1, "At least one order date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export type SalesTaxInvoiceFormData = z.infer<typeof salesTaxInvoiceSchema>;

// Product Type Schema
export const productTypeSchema = z.object({
  typeName: z.string().min(1, "Type Name is required"),
  typeCode: z.string().min(1, "Type Code is required"),
  description: z.string().optional().default(""),
  displayOrder: z.coerce
    .number()
    .int()
    .min(0, "Display Order must be non-negative"),
  isActive: z.boolean().default(true),
});

export type ProductTypeFormData = z.infer<typeof productTypeSchema>;

// Unit Schema
export const unitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
  isActive: z.boolean().default(true),
});

export type UnitFormData = z.infer<typeof unitSchema>;
