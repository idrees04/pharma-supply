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

        if (productsRes.data) {
          productsRes.data.forEach((product: any) => {
            if (!store.products.find((p) => p.id === product.id)) {
              store.addProduct(product);
            }
          });
        }

        if (suppliersRes.data) {
          suppliersRes.data.forEach((supplier: any) => {
            if (!store.suppliers.find((s) => s.id === supplier.id)) {
              store.addSupplier(supplier);
            }
          });
        }

        if (hospitalsRes.data) {
          hospitalsRes.data.forEach((hospital: any) => {
            if (!store.hospitals.find((h) => h.id === hospital.id)) {
              store.addHospital(hospital);
            }
          });
        }

        if (supplyOrdersRes.data) {
          supplyOrdersRes.data.forEach((order: any) => {
            if (!store.supplyOrders.find((o) => o.id === order.id)) {
              store.addSupplyOrder(order);
            }
          });
        }


        if (purchaseOrdersRes.data) {
          purchaseOrdersRes.data.forEach((order: any) => {
            if (!store.purchaseOrders.find((o) => o.id === order.id)) {
              store.addPurchaseOrder(order);
            }
          });
        }

        if (deliveryChallansRes.data) {
          deliveryChallansRes.data.forEach((dc: any) => {
            if (!store.deliveryChallans.find((d) => d.id === dc.id)) {
              store.addDeliveryChallan(dc);
            }
          });
        }

        if (taxInvoicesRes.data) {
          taxInvoicesRes.data.forEach((invoice: any) => {
            if (!store.taxInvoices.find((i) => i.id === invoice.id)) {
              store.addTaxInvoice(invoice);
            }
          });
        }

        if (dailyExpensesRes.data) {
          dailyExpensesRes.data.forEach((expense: any) => {
            if (!store.dailyExpenses.find((e) => e.id === expense.id)) {
              store.addDailyExpense(expense);
            }
          });
        }


        if (bankAccountsRes.data) {
          bankAccountsRes.data.forEach((account: any) => {
            if (!store.bankAccounts.find((a) => a.id === account.id)) {
              store.addBankAccount(account);
            }
          });
        }

        if (inventoryRes.data) {
          inventoryRes.data.forEach((item: any) => {
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
