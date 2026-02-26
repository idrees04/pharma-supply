const API_BASE_URL = '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  let data;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    data: response.ok ? data : undefined,
    error: !response.ok ? data?.error || response.statusText : undefined,
    status: response.status,
  };
}

export const apiClient = {
  // Products
  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`);
    return handleResponse(response);
  },

  async getProduct(id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    return handleResponse(response);
  },

  async createProduct(data: any) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProduct(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteProduct(id: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Suppliers
  async getSuppliers() {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    return handleResponse(response);
  },

  async getSupplier(id: string) {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`);
    return handleResponse(response);
  },

  async createSupplier(data: any) {
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateSupplier(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteSupplier(id: string) {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Hospitals
  async getHospitals() {
    const response = await fetch(`${API_BASE_URL}/hospitals`);
    return handleResponse(response);
  },

  async getHospital(id: string) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}`);
    return handleResponse(response);
  },

  async createHospital(data: any) {
    const response = await fetch(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateHospital(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteHospital(id: string) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },


  // Supply Orders
  async getSupplyOrders() {
    const response = await fetch(`${API_BASE_URL}/supply-orders`);
    return handleResponse(response);
  },

  async getSupplyOrder(id: string) {
    const response = await fetch(`${API_BASE_URL}/supply-orders/${id}`);
    return handleResponse(response);
  },

  async createSupplyOrder(data: any) {
    const response = await fetch(`${API_BASE_URL}/supply-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateSupplyOrder(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/supply-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteSupplyOrder(id: string) {
    const response = await fetch(`${API_BASE_URL}/supply-orders/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Purchase Orders
  async getPurchaseOrders() {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`);
    return handleResponse(response);
  },

  async getPurchaseOrder(id: string) {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`);
    return handleResponse(response);
  },

  async createPurchaseOrder(data: any) {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePurchaseOrder(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePurchaseOrder(id: string) {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Delivery Challans
  async getDeliveryChallans() {
    const response = await fetch(`${API_BASE_URL}/delivery-challans`);
    return handleResponse(response);
  },

  async getDeliveryChallan(id: string) {
    const response = await fetch(`${API_BASE_URL}/delivery-challans/${id}`);
    return handleResponse(response);
  },

  async createDeliveryChallan(data: any) {
    const response = await fetch(`${API_BASE_URL}/delivery-challans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateDeliveryChallan(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/delivery-challans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteDeliveryChallan(id: string) {
    const response = await fetch(`${API_BASE_URL}/delivery-challans/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Tax Invoices
  async getTaxInvoices() {
    const response = await fetch(`${API_BASE_URL}/tax-invoices`);
    return handleResponse(response);
  },

  async getTaxInvoice(id: string) {
    const response = await fetch(`${API_BASE_URL}/tax-invoices/${id}`);
    return handleResponse(response);
  },

  async createTaxInvoice(data: any) {
    const response = await fetch(`${API_BASE_URL}/tax-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateTaxInvoice(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/tax-invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteTaxInvoice(id: string) {
    const response = await fetch(`${API_BASE_URL}/tax-invoices/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Daily Expenses
  async getDailyExpenses() {
    const response = await fetch(`${API_BASE_URL}/daily-expenses`);
    return handleResponse(response);
  },

  async getDailyExpense(id: string) {
    const response = await fetch(`${API_BASE_URL}/daily-expenses/${id}`);
    return handleResponse(response);
  },

  async createDailyExpense(data: any) {
    const response = await fetch(`${API_BASE_URL}/daily-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateDailyExpense(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/daily-expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteDailyExpense(id: string) {
    const response = await fetch(`${API_BASE_URL}/daily-expenses/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },


  // Bank Accounts
  async getBankAccounts() {
    const response = await fetch(`${API_BASE_URL}/bank-accounts`);
    return handleResponse(response);
  },

  async getBankAccount(id: string) {
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`);
    return handleResponse(response);
  },

  async createBankAccount(data: any) {
    const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateBankAccount(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteBankAccount(id: string) {
    const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Internal Transfers
  async getInternalTransfers() {
    const response = await fetch(`${API_BASE_URL}/internal-transfers`);
    return handleResponse(response);
  },

  async getInternalTransfer(id: string) {
    const response = await fetch(`${API_BASE_URL}/internal-transfers/${id}`);
    return handleResponse(response);
  },

  async createInternalTransfer(data: any) {
    const response = await fetch(`${API_BASE_URL}/internal-transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteInternalTransfer(id: string) {
    const response = await fetch(`${API_BASE_URL}/internal-transfers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Payments
  async getPayments() {
    const response = await fetch(`${API_BASE_URL}/payments`);
    return handleResponse(response);
  },

  async getPayment(id: string) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`);
    return handleResponse(response);
  },

  async createPayment(data: any) {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updatePayment(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deletePayment(id: string) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },


  // Inventory
  async getInventory() {
    const response = await fetch(`${API_BASE_URL}/inventory`);
    return handleResponse(response);
  },

  async getInventoryItem(id: string) {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
    return handleResponse(response);
  },

  async createInventoryItem(data: any) {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateInventoryItem(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteInventoryItem(id: string) {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  async adjustInventory(id: string, adjustment: number, reason: string) {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustment, reason }),
    });
    return handleResponse(response);
  },
};
