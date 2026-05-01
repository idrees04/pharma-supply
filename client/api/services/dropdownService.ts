import { AllEnumsResponse, ApiResponse, EnumOption, PaymentModeOption } from "@/types/api/dropdown";
import apiClient from "../axios";

// import { ApiResponse, PaymentModeOption } from '@/types/dropdown';
const BASE_URL = '/api/Enums';

export const paymentService = {
  // 2.1
  getPaymentModes: () =>
    apiClient.get<ApiResponse<PaymentModeOption[]>>('/api/Payments/payment-modes')
      .then(res => res.data.data),
};

export const enumService = {
  // 1.1
  getAccountTypeEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/AccountType`)
      .then(res => res.data.data),

  // 1.2
  getDeliveryChallanStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/DeliveryChallanStatus`)
      .then(res => res.data.data),

  // 1.3
  getExpenseStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/ExpenseStatus`)
      .then(res => res.data.data),

  // 1.4
  getHospitalTypeEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/HospitalType`)
      .then(res => res.data.data),

  // 1.5
  getHospitalStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/HospitalStatus`)
      .then(res => res.data.data),

  // 1.6
  getInventoryBatchStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/InventoryBatchStatus`)
      .then(res => res.data.data),

  // 1.7
  getInvoiceStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/InvoiceStatus`)
      .then(res => res.data.data),

  // 1.8
  getNotificationTypeEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/NotificationType`)
      .then(res => res.data.data),

  // 1.9
  getPaymentModeEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/PaymentMode`)
      .then(res => res.data.data),

  // 1.10
  getPaymentTypeEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/PaymentType`)
      .then(res => res.data.data),

  // 1.11
  getPurchaseOrderStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/PurchaseOrderStatus`)
      .then(res => res.data.data),

  // 1.12
  getSupplierStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/SupplierStatus`)
      .then(res => res.data.data),

  // 1.13
  getSupplyOrderFulfillmentSourceEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/SupplyOrderFulfillmentSource`)
      .then(res => res.data.data),

  // 1.14
  getSupplyOrderStatusEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/SupplyOrderStatus`)
      .then(res => res.data.data),

  // 1.15
  getUserRoleEnum: () =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/UserRole`)
      .then(res => res.data.data),

  // 1.16 – dynamic enum by name
  getEnumByName: (enumName: string) =>
    apiClient.get<ApiResponse<EnumOption[]>>(`${BASE_URL}/${enumName}`)
      .then(res => res.data.data),

  // 1.17 – all enums at once
  getAllEnums: () =>
    apiClient.get<ApiResponse<AllEnumsResponse>>(`${BASE_URL}/all`)
      .then(res => res.data.data),
};