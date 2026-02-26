export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
}

export function downloadJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

export function generateSalesReport(taxInvoices: any[]) {
  return {
    reportType: 'Sales Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalInvoices: taxInvoices.length,
      totalRevenue: taxInvoices.reduce((sum, inv) => sum + inv.totalNetAmount, 0),
    },
    invoices: taxInvoices.map((invoice) => ({
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      invoiceDate: invoice.invoiceDate,
      totalNetAmount: invoice.totalNetAmount,
    })),
  };
}

export function generateFinancialReport(
  bankAccounts: any[],
  internalTransfers: any[],
  payments: any[],
  dailyExpenses: any[],
) {
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalTransferred = internalTransfers.reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = dailyExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  return {
    reportType: 'Financial Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalBalance,
      totalTransferred,
      totalPayments,
      totalExpenses,
      netCashFlow: totalBalance - totalExpenses,
    },
    bankAccounts: bankAccounts.map((account) => ({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNo: account.accountNo,
      balance: account.balance,
      accountType: account.accountType,
    })),
    transfers: internalTransfers.map((transfer) => ({
      referenceNo: transfer.referenceNo,
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      amount: transfer.amount,
      date: transfer.date,
    })),
    payments: payments.map((payment) => ({
      poId: payment.poId,
      paymentMode: payment.paymentMode,
      amount: payment.amount,
      date: payment.paymentDate,
    })),
    expenses: dailyExpenses.map((expense) => ({
      voucherNo: expense.voucherNo,
      date: expense.date,
      payTo: expense.payTo,
      totalAmount: expense.totalAmount,
    })),
  };
}

export function generateInventoryReport(products: any[], inventoryItems: any[]) {
  const lowStockItems = inventoryItems.filter((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product && item.currentStock <= product.reorderPoint;
  });

  const outOfStockItems = inventoryItems.filter((item) => item.currentStock === 0);

  return {
    reportType: 'Inventory Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: inventoryItems.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      totalValue: inventoryItems.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? item.currentStock * (product.packSize || 1) : 0);
      }, 0),
    },
    inventory: inventoryItems.map((item) => ({
      productName: item.productName,
      currentStock: item.currentStock,
      reservedStock: item.reservedStock,
      availableStock: item.availableStock,
      lastRestockDate: item.lastRestockDate,
    })),
    lowStockAlert: lowStockItems.map((item) => ({
      productName: item.productName,
      currentStock: item.currentStock,
      reorderPoint: products.find((p) => p.id === item.productId)?.reorderPoint,
    })),
  };
}

export function generateProcurementReport(purchaseOrders: any[], suppliers: any[]) {
  return {
    reportType: 'Procurement Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalOrders: purchaseOrders.length,
      totalSuppliers: suppliers.length,
      totalAmount: purchaseOrders.reduce((sum, po) => sum + po.netPayableAmount, 0),
    },
    purchaseOrders: purchaseOrders.map((order) => ({
      refNo: order.refNo,
      supplierName: order.supplierName,
      poDate: order.poDate,
      totalAmount: order.netPayableAmount,
      itemCount: order.items.length,
    })),
    suppliers: suppliers.map((supplier) => ({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      paymentTerms: supplier.paymentTerms,
    })),
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function generatePDFContent(title: string, data: any): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .generated { text-align: right; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="generated">Generated on ${new Date().toLocaleString()}</div>
        ${data}
      </body>
    </html>
  `;
}
