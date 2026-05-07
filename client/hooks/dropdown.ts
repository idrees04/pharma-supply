// api/hooks/useDropdownData.ts
import { useGetQuery } from '@/api/hooks'; // your existing base hook (react-query)
import { enumService, paymentService } from '@/api/services/dropdownService';
import { AllEnumsResponse, EnumOption, PaymentModeOption } from '@/types/api/dropdown';

// ------------------------------------------------------------
// Generic hook for any enum endpoint
// ------------------------------------------------------------
function useEnumOptions<T = EnumOption[]>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options?: { staleTime?: number; enabled?: boolean }
) {
  return useGetQuery<T>(
    queryKey,
    fetcher,
    {
      staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
      enabled: options?.enabled,
    }
  );
}

// ------------------------------------------------------------
// Individual enum hooks (1.1 – 1.15)
// ------------------------------------------------------------
export const useAccountTypeOptions = (enabled = true) =>
  useEnumOptions(['enum', 'AccountType'], enumService.getAccountTypeEnum, { enabled });

export const useDeliveryChallanStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'DeliveryChallanStatus'], enumService.getDeliveryChallanStatusEnum, { enabled });

export const useExpenseStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'ExpenseStatus'], enumService.getExpenseStatusEnum, { enabled });

export const useHospitalTypeOptions = (enabled = true) =>
  useEnumOptions(['enum', 'HospitalType'], enumService.getHospitalTypeEnum, { enabled });

export const useHospitalStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'HospitalStatus'], enumService.getHospitalStatusEnum, { enabled });

export const useInventoryBatchStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'InventoryBatchStatus'], enumService.getInventoryBatchStatusEnum, { enabled });

export const useInvoiceStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'InvoiceStatus'], enumService.getInvoiceStatusEnum, { enabled });

export const useNotificationTypeOptions = (enabled = true) =>
  useEnumOptions(['enum', 'NotificationType'], enumService.getNotificationTypeEnum, { enabled });

export const usePaymentModeEnumOptions = (enabled = true) =>
  useEnumOptions(['enum', 'PaymentMode'], enumService.getPaymentModeEnum, { enabled });

export const usePaymentTypeOptions = (enabled = true) =>
  useEnumOptions(['enum', 'PaymentType'], enumService.getPaymentTypeEnum, { enabled });

export const usePurchaseOrderStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'PurchaseOrderStatus'], enumService.getPurchaseOrderStatusEnum, { enabled });

export const useSupplierStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'SupplierStatus'], enumService.getSupplierStatusEnum, { enabled });

export const useSupplyOrderFulfillmentSourceOptions = (enabled = true) =>
  useEnumOptions(['enum', 'FulfillmentSource'], enumService.getSupplyOrderFulfillmentSourceEnum, { enabled });

export const useSupplyOrderStatusOptions = (enabled = true) =>
  useEnumOptions(['enum', 'SupplyOrderStatus'], enumService.getSupplyOrderStatusEnum, { enabled });

export const useUserRoleOptions = (enabled = true) =>
  useEnumOptions(['enum', 'UserRole'], enumService.getUserRoleEnum, { enabled });

// 1.16 – dynamic enum by name
export const useEnumByName = (enumName: string | null, enabled = true) =>
  useEnumOptions(
    ['enum', 'byName', enumName],
    () => enumService.getEnumByName(enumName!),
    { enabled: enabled && !!enumName }
  );

// 1.17 – composite hook: fetch all enums at once (can be used with React Query or inside a provider)
export const useAllEnums = () =>
  useGetQuery<AllEnumsResponse>(
    ['enum', 'all'],
    () => enumService.getAllEnums(),
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

// 2.1 – payment modes
export const usePaymentModes = () =>
  useGetQuery<PaymentModeOption[]>(
    ['paymentModes'],
    () => paymentService.getPaymentModes(),
    { staleTime: 5 * 60 * 1000 }
  );