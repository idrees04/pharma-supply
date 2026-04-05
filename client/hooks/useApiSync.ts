import { useEffect, useState } from 'react';
import { useStore } from './useStore';
import { apiClient } from '../lib/apiClient';
import { useToast } from './use-toast';

export function useApiSync() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const store = useStore();

  useEffect(() => {
    const syncData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          productsRes,
          suppliersRes,
          hospitalsRes,
          supplyOrdersRes,
          purchaseOrdersRes,
          deliveryChallansRes,
          taxInvoicesRes,
          dailyExpensesRes,
          bankAccountsRes,
          inventoryRes,
        ] = await Promise.all([
          apiClient.getProducts(),
          apiClient.getSuppliers(),
          apiClient.getHospitals(),
          apiClient.getSupplyOrders(),
          apiClient.getPurchaseOrders(),
          apiClient.getDeliveryChallans(),
          apiClient.getTaxInvoices(),
          apiClient.getDailyExpenses(),
          apiClient.getBankAccounts(),
          apiClient.getInventory(),
        ]);

        if (Array.isArray(productsRes.data)) {
          productsRes.data.forEach((product) => {
            if (!store.products.find((p) => p.id === product.id)) {
              store.addProduct(product);
            }
          });
        }

        if (Array.isArray(suppliersRes.data)) {
          suppliersRes.data.forEach((supplier) => {
            if (!store.suppliers.find((s) => s.id === supplier.id)) {
              store.addSupplier(supplier);
            }
          });
        }

        if (Array.isArray(hospitalsRes.data)) {
          hospitalsRes.data.forEach((hospital) => {
            if (!store.hospitals.find((h) => h.id === hospital.id)) {
              store.addHospital(hospital);
            }
          });
        }

        if (Array.isArray(supplyOrdersRes.data)) {
          supplyOrdersRes.data.forEach((order) => {
            if (!store.supplyOrders.find((o) => o.id === order.id)) {
              store.addSupplyOrder(order);
            }
          });
        }


        if (Array.isArray(purchaseOrdersRes.data)) {
          purchaseOrdersRes.data.forEach((order) => {
            if (!store.purchaseOrders.find((o) => o.id === order.id)) {
              store.addPurchaseOrder(order);
            }
          });
        }

        if (Array.isArray(deliveryChallansRes.data)) {
          deliveryChallansRes.data.forEach((dc) => {
            if (!store.deliveryChallans.find((d) => d.id === dc.id)) {
              store.addDeliveryChallan(dc);
            }
          });
        }

        if (Array.isArray(taxInvoicesRes.data)) {
          taxInvoicesRes.data.forEach((invoice) => {
            if (!store.taxInvoices.find((i) => i.id === invoice.id)) {
              store.addTaxInvoice(invoice);
            }
          });
        }

        if (Array.isArray(dailyExpensesRes.data)) {
          dailyExpensesRes.data.forEach((expense) => {
            if (!store.dailyExpenses.find((e) => e.id === expense.id)) {
              store.addDailyExpense(expense);
            }
          });
        }


        if (Array.isArray(bankAccountsRes.data)) {
          bankAccountsRes.data.forEach((account) => {
            if (!store.bankAccounts.find((a) => a.id === account.id)) {
              store.addBankAccount(account);
            }
          });
        }

        if (Array.isArray(inventoryRes.data)) {
          inventoryRes.data.forEach((item) => {
            if (!store.inventoryItems.find((i) => i.id === item.id)) {
              store.updateInventoryItem(item.id, item);
            }
          });
        }


        toast({
          title: 'Data Loaded',
          description: 'Mock data has been loaded from API endpoints',
          duration: 3000,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    syncData();
  }, []);

  return { isLoading, error };
}
